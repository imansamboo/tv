import { NextResponse } from "next/server";
import { pricingConfigError } from "@/lib/pricing";
import { findQuoteForUser, loadPricingForm } from "@/lib/pricing-service";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "وارد شوید." }, { status: 401 });
  }

  const [user, quote] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.sub },
      select: { pricingFormId: true, requirement: { select: { status: true } } },
    }),
    findQuoteForUser(session.sub),
  ]);

  const formId = user?.pricingFormId ?? null;
  const sections = formId ? await loadPricingForm(formId) : [];

  return NextResponse.json({
    requirementSubmitted: user?.requirement?.status === "SUBMITTED",
    formAssigned: Boolean(formId),
    configError: formId ? pricingConfigError(sections) : null,
    sections,
    quote,
  });
}
