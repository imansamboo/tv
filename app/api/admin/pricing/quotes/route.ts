import { NextResponse } from "next/server";
import { mergeRequirement } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { forbidden, getAdminSession } from "@/lib/session";

export async function GET() {
  if (!(await getAdminSession())) return forbidden();

  const quotes = await prisma.pricingQuote.findMany({
    orderBy: { submittedAt: "desc" },
    include: {
      user: { select: { email: true, name: true, requirement: { select: { data: true } } } },
      items: { where: { selected: true }, select: { id: true } },
    },
  });

  return NextResponse.json({
    quotes: quotes.map((quote) => {
      const raw = quote.user.requirement?.data;
      const requirement = raw ? mergeRequirement(JSON.parse(raw)) : null;
      return {
        id: quote.id,
        email: quote.user.email,
        contactName: requirement?.contactName || quote.user.name || "",
        storeName: requirement?.storeName || "",
        selectedCount: quote.items.length,
        basePrice: quote.basePrice,
        extrasPrice: quote.extrasPrice,
        totalPrice: quote.totalPrice,
        submittedAt: quote.submittedAt,
      };
    }),
  });
}
