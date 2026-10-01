import { NextResponse } from "next/server";
import {
  BROKEN_FORM_ERROR,
  listActiveBusinesses,
  loadCustomerRequirement,
  requirementColumns,
} from "@/lib/business";
import { normalizeRequirement } from "@/lib/form";
import { summarizeRequirements } from "@/lib/summary";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "وارد شوید." }, { status: 401 });
  }

  const loaded = await loadCustomerRequirement(session.sub);
  if (loaded.kind === "needsBusiness") {
    if (session.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "فرم نیازمندی‌ها مخصوص مشتریان است؛ از پنل مدیریت استفاده کنید." },
        { status: 403 },
      );
    }
    return NextResponse.json({
      needsBusiness: true,
      businesses: await listActiveBusinesses(),
      userName: session.name,
    });
  }
  if (loaded.kind === "brokenForm") {
    return NextResponse.json({ error: BROKEN_FORM_ERROR }, { status: 500 });
  }

  const { requirement, form, data } = loaded;
  return NextResponse.json({
    business: loaded.business,
    pricingFormAssigned: loaded.pricingFormAssigned,
    form,
    status: requirement.status,
    currentStep: Math.min(requirement.currentStep, form.steps.length),
    data,
    summary: summarizeRequirements(form, data),
    submittedAt: requirement.submittedAt,
    updatedAt: requirement.updatedAt,
    userName: session.name,
  });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "وارد شوید." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const loaded = await loadCustomerRequirement(session.sub);
  if (loaded.kind === "needsBusiness") {
    return NextResponse.json({ error: "ابتدا کسب‌وکار خود را انتخاب کنید." }, { status: 409 });
  }
  if (loaded.kind === "brokenForm") {
    return NextResponse.json({ error: BROKEN_FORM_ERROR }, { status: 500 });
  }

  const { requirement, form } = loaded;
  if (requirement.status === "SUBMITTED") {
    return NextResponse.json(
      { error: "این درخواست ثبت نهایی شده و دیگر قابل ویرایش نیست." },
      { status: 409 },
    );
  }

  const data = normalizeRequirement(body?.data, form);
  const currentStep = Number.isInteger(body?.currentStep)
    ? Math.min(form.steps.length, Math.max(0, body.currentStep))
    : requirement.currentStep;
  const { columns, summary } = requirementColumns(form, data);

  const saved = await prisma.requirement.update({
    where: { userId: session.sub },
    data: { ...columns, currentStep },
  });

  return NextResponse.json({
    ok: true,
    status: saved.status,
    currentStep: saved.currentStep,
    data,
    summary,
    updatedAt: saved.updatedAt,
  });
}
