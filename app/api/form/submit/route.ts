import { NextResponse } from "next/server";
import { BROKEN_FORM_ERROR, loadCustomerRequirement, requirementColumns } from "@/lib/business";
import { notifyAdmins } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { firstInvalidStep } from "@/lib/validate";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "وارد شوید." }, { status: 401 });
  }

  const loaded = await loadCustomerRequirement(session.sub);
  if (loaded.kind === "needsBusiness") {
    return NextResponse.json({ error: "ابتدا کسب‌وکار خود را انتخاب کنید." }, { status: 409 });
  }
  if (loaded.kind === "brokenForm") {
    return NextResponse.json({ error: BROKEN_FORM_ERROR }, { status: 500 });
  }

  const { requirement, form, data } = loaded;
  if (requirement.status === "SUBMITTED") {
    return NextResponse.json(
      { error: "این درخواست قبلاً ثبت شده است.", alreadySubmitted: true },
      { status: 409 },
    );
  }

  const invalid = firstInvalidStep(form, data);
  if (invalid) {
    return NextResponse.json({ error: invalid.error, step: invalid.step }, { status: 400 });
  }

  const { columns, summary } = requirementColumns(form, data);
  const saved = await prisma.requirement.update({
    where: { userId: session.sub },
    data: {
      ...columns,
      status: "SUBMITTED",
      submittedAt: new Date(),
      currentStep: form.steps.length,
      formSnapshot: JSON.stringify(form),
    },
  });

  await notifyAdmins("REQUIREMENT_SUBMITTED", session.sub);

  return NextResponse.json({
    ok: true,
    summary,
    submittedAt: saved.submittedAt,
  });
}
