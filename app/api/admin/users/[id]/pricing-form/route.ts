import { NextResponse } from "next/server";
import { z } from "zod";
import { pricingConfigError } from "@/lib/pricing";
import { loadPricingForm } from "@/lib/pricing-service";
import { prisma } from "@/lib/prisma";
import { forbidden, getAdminSession } from "@/lib/session";

const schema = z.object({
  /** `null` takes the form away again. */
  formId: z.string().min(1).nullable(),
});

export async function PUT(
  request: Request,
  context: RouteContext<"/api/admin/users/[id]/pricing-form">,
) {
  if (!(await getAdminSession())) return forbidden();

  const { id } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "فرم قیمت‌گذاری را انتخاب کنید." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      role: true,
      requirement: { select: { status: true } },
      pricingQuote: { select: { id: true } },
    },
  });
  if (!user || user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "کاربر پیدا نشد." }, { status: 404 });
  }
  if (user.requirement?.status !== "SUBMITTED") {
    return NextResponse.json(
      { error: "این کاربر هنوز فرم نیازمندی‌ها را ثبت نهایی نکرده است." },
      { status: 409 },
    );
  }
  if (user.pricingQuote) {
    return NextResponse.json(
      { error: "این کاربر فرم قیمت‌گذاری خود را ثبت کرده و دیگر قابل تغییر نیست." },
      { status: 409 },
    );
  }

  const { formId } = parsed.data;
  if (formId) {
    const form = await prisma.pricingForm.findUnique({ where: { id: formId }, select: { id: true } });
    if (!form) {
      return NextResponse.json({ error: "فرم قیمت‌گذاری پیدا نشد." }, { status: 404 });
    }
    const configError = pricingConfigError(await loadPricingForm(formId));
    if (configError) {
      return NextResponse.json(
        { error: `این فرم هنوز قابل استفاده نیست: ${configError}` },
        { status: 409 },
      );
    }
  }

  await prisma.user.update({
    where: { id },
    data: { pricingFormId: formId, pricingFormAssignedAt: formId ? new Date() : null },
  });

  return NextResponse.json({ ok: true });
}
