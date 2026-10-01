import { NextResponse } from "next/server";
import { z } from "zod";
import { loadAssignableCustomers, loadPricingFormDetail } from "@/lib/pricing-forms";
import { releasePricingImages } from "@/lib/pricing-service";
import { prisma } from "@/lib/prisma";
import { forbidden, getAdminSession } from "@/lib/session";

const NOT_FOUND = "فرم قیمت‌گذاری پیدا نشد.";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/admin/pricing-forms/[id]">,
) {
  if (!(await getAdminSession())) return forbidden();

  const { id } = await context.params;
  const [form, customers] = await Promise.all([
    loadPricingFormDetail(id),
    loadAssignableCustomers(),
  ]);
  if (!form) {
    return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  }

  return NextResponse.json({ form, customers });
}

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "عنوان فرم را وارد کنید.")
    .max(120, "عنوان فرم خیلی طولانی است.")
    .optional(),
  note: z.string().trim().max(1000, "توضیح فرم خیلی طولانی است.").nullable().optional(),
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

  await prisma.pricingForm.update({
    where: { id },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.note !== undefined ? { note: parsed.data.note || null } : {}),
    },
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
    select: {
      users: { where: { pricingQuote: null }, select: { id: true } },
      sections: { select: { items: { select: { imageUrl: true } } } },
    },
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

  // Sections and items cascade; submitted quotes keep their own snapshot rows.
  await prisma.pricingForm.delete({ where: { id } });
  await releasePricingImages(
    form.sections.flatMap((section) => section.items.map((item) => item.imageUrl)),
  );
  return NextResponse.json({ ok: true });
}
