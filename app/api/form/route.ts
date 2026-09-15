import { NextResponse } from "next/server";
import { emptyRequirement, mergeRequirement } from "@/lib/form";
import { calculateQuote } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

async function loadOrCreate(userId: string) {
  let requirement = await prisma.requirement.findUnique({
    where: { userId },
  });
  if (!requirement) {
    requirement = await prisma.requirement.create({
      data: {
        userId,
        data: JSON.stringify(emptyRequirement()),
      },
    });
  }
  const data = mergeRequirement(JSON.parse(requirement.data));
  const quote = calculateQuote(data);
  return { requirement, data, quote };
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "وارد شوید." }, { status: 401 });
  }
  const { requirement, data, quote } = await loadOrCreate(session.sub);
  return NextResponse.json({
    status: requirement.status,
    currentStep: requirement.currentStep,
    data,
    quote,
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
  const { requirement } = await loadOrCreate(session.sub);
  if (requirement.status === "SUBMITTED") {
    return NextResponse.json(
      { error: "این درخواست ثبت نهایی شده و دیگر قابل ویرایش نیست." },
      { status: 409 },
    );
  }

  const data = mergeRequirement(body?.data);
  const currentStep = Number.isInteger(body?.currentStep)
    ? Math.min(6, Math.max(0, body.currentStep))
    : requirement.currentStep;
  const quote = calculateQuote(data);

  const saved = await prisma.requirement.update({
    where: { userId: session.sub },
    data: {
      data: JSON.stringify(data),
      currentStep,
      tvPrice: quote.tvPrice,
      extrasPrice: quote.extrasPrice,
      totalPrice: quote.total,
    },
  });

  return NextResponse.json({
    ok: true,
    status: saved.status,
    currentStep: saved.currentStep,
    data,
    quote,
    updatedAt: saved.updatedAt,
  });
}
