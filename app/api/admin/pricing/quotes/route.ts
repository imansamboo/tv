import { NextResponse } from "next/server";
import { customerNames, customerRequirementSelect } from "@/lib/customer";
import { prisma } from "@/lib/prisma";
import { forbidden, getAdminSession } from "@/lib/session";

export async function GET() {
  if (!(await getAdminSession())) return forbidden();

  const quotes = await prisma.pricingQuote.findMany({
    orderBy: { submittedAt: "desc" },
    include: {
      user: { select: { email: true, name: true, requirement: { select: customerRequirementSelect } } },
      items: { where: { selected: true }, select: { id: true } },
    },
  });

  return NextResponse.json({
    quotes: quotes.map((quote) => {
      return {
        id: quote.id,
        email: quote.user.email,
        ...customerNames(quote.user),
        selectedCount: quote.items.length,
        basePrice: quote.basePrice,
        extrasPrice: quote.extrasPrice,
        totalPrice: quote.totalPrice,
        submittedAt: quote.submittedAt,
      };
    }),
  });
}
