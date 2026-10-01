import { NextResponse } from "next/server";
import { z } from "zod";
import { nextSectionOrder } from "@/lib/pricing-service";
import { prisma } from "@/lib/prisma";
import { forbidden, getAdminSession } from "@/lib/session";

const schema = z.object({
  title: z.string().trim().min(2, "عنوان بخش را وارد کنید."),
  subtitle: z.string().trim().max(200, "توضیح بخش خیلی طولانی است.").optional(),
  active: z.boolean().optional(),
  /** Omitted for the default template. */
  formId: z.string().min(1).nullable().optional(),
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

  const formId = parsed.data.formId ?? null;
  if (formId && !(await prisma.pricingForm.findUnique({ where: { id: formId } }))) {
    return NextResponse.json({ error: "فرم قیمت‌گذاری پیدا نشد." }, { status: 404 });
  }

  const section = await prisma.pricingSection.create({
    data: {
      formId,
      title: parsed.data.title,
      subtitle: parsed.data.subtitle || null,
      active: parsed.data.active ?? true,
      sortOrder: await nextSectionOrder(formId),
    },
  });

  return NextResponse.json({ ok: true, id: section.id });
}
