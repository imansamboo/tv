import { NextResponse } from "next/server";
import { z } from "zod";
import { initialRequirement, loadBusinessForm } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const schema = z.object({
  businessId: z.string().trim().min(1, "کسب‌وکار خود را انتخاب کنید."),
});

/**
 * Sets the customer's business (accounts created before businesses existed, or
 * a wrong pick at registration). Answers start over, so a submitted requirement
 * can no longer switch.
 */
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "وارد شوید." }, { status: 401 });
  }
  if (session.role !== "CUSTOMER") {
    return NextResponse.json({ error: "فقط مشتریان کسب‌وکار انتخاب می‌کنند." }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "اطلاعات نامعتبر است." },
      { status: 400 },
    );
  }

  const business = await loadBusinessForm(parsed.data.businessId, { activeOnly: true });
  if (!business) {
    return NextResponse.json({ error: "کسب‌وکار انتخاب‌شده معتبر نیست." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { name: true, businessId: true, requirement: { select: { status: true } } },
  });
  if (!user) {
    return NextResponse.json({ error: "حساب کاربری پیدا نشد." }, { status: 404 });
  }
  if (user.requirement?.status === "SUBMITTED") {
    return NextResponse.json(
      { error: "نیازمندی‌ها ثبت نهایی شده و کسب‌وکار قابل تغییر نیست." },
      { status: 409 },
    );
  }
  if (user.businessId === business.business.id) {
    return NextResponse.json({ ok: true });
  }

  const { columns } = initialRequirement(business.form, user.name);
  await prisma.user.update({
    where: { id: session.sub },
    data: {
      businessId: business.business.id,
      requirement: {
        upsert: {
          create: { ...columns, currentStep: 0 },
          update: { ...columns, currentStep: 0, formSnapshot: null },
        },
      },
    },
  });
  return NextResponse.json({ ok: true });
}
