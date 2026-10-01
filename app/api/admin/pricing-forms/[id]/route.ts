import { NextResponse } from "next/server";
import { z } from "zod";
import {
  loadAssignableCustomers,
  loadPricingFormDetail,
  parseFormEntries,
} from "@/lib/pricing-forms";
import { loadPricingConfig } from "@/lib/pricing-service";
import { prisma } from "@/lib/prisma";
import { forbidden, getAdminSession } from "@/lib/session";

const NOT_FOUND = "فرم قیمت‌گذاری پیدا نشد.";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/admin/pricing-forms/[id]">,
) {
  if (!(await getAdminSession())) return forbidden();

  const { id } = await context.params;
  const [form, catalogue, customers] = await Promise.all([
    loadPricingFormDetail(id),
    loadPricingConfig(),
    loadAssignableCustomers(),
  ]);
  if (!form) {
    return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  }

  return NextResponse.json({ form, catalogue, customers });
}

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "عنوان فرم را وارد کنید.")
    .max(120, "عنوان فرم خیلی طولانی است.")
    .optional(),
  note: z.string().trim().max(1000, "توضیح فرم خیلی طولانی است.").nullable().optional(),
  items: z
    .array(
      z.object({
        itemId: z.string().min(1),
        price: z.union([z.number(), z.string(), z.null()]).optional(),
      }),
    )
    .max(500)
    .optional(),
});

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/pricing-forms/[id]">,
) {
  if (!(await getAdminSession())) return forbidden();

  const { id } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "اطلاعات نامعتبر است." },
      { status: 400 },
    );
  }

  const exists = await prisma.pricingForm.findUnique({ where: { id }, select: { id: true } });
  if (!exists) {
    return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  }

  let entries: { itemId: string; price: number | null }[] | null = null;
  if (parsed.data.items) {
    const result = await parseFormEntries(parsed.data.items);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    entries = result.entries;
  }

  await prisma.$transaction(async (tx) => {
    await tx.pricingForm.update({
      where: { id },
      data: {
        ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
        ...(parsed.data.note !== undefined ? { note: parsed.data.note || null } : {}),
        // Touch the row even when only items change so lists sort by last edit.
        updatedAt: new Date(),
      },
    });
    if (entries) {
      await tx.pricingFormItem.deleteMany({ where: { formId: id } });
      await tx.pricingFormItem.createMany({
        data: entries.map((entry) => ({ formId: id, ...entry })),
      });
    }
  });

  return NextResponse.json({ ok: true, form: await loadPricingFormDetail(id) });
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/admin/pricing-forms/[id]">,
) {
  if (!(await getAdminSession())) return forbidden();

  const { id } = await context.params;
  const form = await prisma.pricingForm.findUnique({
    where: { id },
    select: { users: { where: { pricingQuote: null }, select: { id: true } } },
  });
  if (!form) {
    return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  }
  // Deleting would silently send these customers back to the waiting screen.
  if (form.users.length > 0) {
    return NextResponse.json(
      {
        error:
          "این فرم به کاربرانی اختصاص داده شده که هنوز آن را ثبت نکرده‌اند. ابتدا فرم دیگری به آن‌ها اختصاص دهید.",
      },
      { status: 409 },
    );
  }

  await prisma.pricingForm.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
