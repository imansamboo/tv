import { NextResponse } from "next/server";
import { z } from "zod";
import { listPricingForms } from "@/lib/pricing-forms";
import { prisma } from "@/lib/prisma";
import { forbidden, getAdminSession } from "@/lib/session";

export async function GET() {
  if (!(await getAdminSession())) return forbidden();
  return NextResponse.json({ forms: await listPricingForms() });
}

const schema = z.object({
  title: z.string().trim().min(2, "عنوان فرم را وارد کنید.").max(120, "عنوان فرم خیلی طولانی است."),
  note: z.string().trim().max(1000, "توضیح فرم خیلی طولانی است.").optional(),
  /** Starts the new form as a copy of an existing one. */
  copyFromId: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  if (!(await getAdminSession())) return forbidden();

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "اطلاعات نامعتبر است." },
      { status: 400 },
    );
  }

  let items: { itemId: string; price: number | null }[] = [];
  if (parsed.data.copyFromId) {
    const source = await prisma.pricingForm.findUnique({
      where: { id: parsed.data.copyFromId },
      select: { items: { select: { itemId: true, price: true } } },
    });
    if (!source) {
      return NextResponse.json({ error: "فرم مبدأ پیدا نشد." }, { status: 404 });
    }
    items = source.items;
  }

  const form = await prisma.pricingForm.create({
    data: {
      title: parsed.data.title,
      note: parsed.data.note || null,
      items: { create: items },
    },
  });
  return NextResponse.json({ ok: true, id: form.id });
}
