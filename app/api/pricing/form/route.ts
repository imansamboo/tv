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

  const [requirement, sections, quote] = await Promise.all([
    prisma.requirement.findUnique({
      where: { userId: session.sub },
      select: { status: true },
    }),
    loadPricingForm(),
    findQuoteForUser(session.sub),
  ]);

  return NextResponse.json({
    requirementSubmitted: requirement?.status === "SUBMITTED",
    configError: pricingConfigError(sections),
    sections,
    quote,
  });
}
