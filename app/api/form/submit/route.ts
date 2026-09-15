import { NextResponse } from "next/server";
import { mergeRequirement } from "@/lib/form";
import { calculateQuote } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { firstInvalidStep } from "@/lib/validate";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "وارد شوید." }, { status: 401 });
  }

  const requirement = await prisma.requirement.findUnique({
    where: { userId: session.sub },
  });
  if (!requirement) {
    return NextResponse.json({ error: "فرم پیدا نشد." }, { status: 404 });
  }
  if (requirement.status === "SUBMITTED") {
    return NextResponse.json(
      { error: "این درخواست قبلاً ثبت شده است.", alreadySubmitted: true },
      { status: 409 },
    );
  }

  const data = mergeRequirement(JSON.parse(requirement.data));
  const invalid = firstInvalidStep(data);
  if (invalid) {
    return NextResponse.json(
      { error: invalid.error, step: invalid.step },
      { status: 400 },
    );
  }

  const quote = calculateQuote(data);
  const saved = await prisma.requirement.update({
    where: { userId: session.sub },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      currentStep: 6,
      tvPrice: quote.tvPrice,
      extrasPrice: quote.extrasPrice,
      totalPrice: quote.total,
      data: JSON.stringify(data),
    },
  });

  return NextResponse.json({
    ok: true,
    quote,
    submittedAt: saved.submittedAt,
  });
}
