import { NextResponse } from "next/server";
import { mergeRequirement } from "@/lib/form";
import { serializeQuote } from "@/lib/pricing-service";
import { prisma } from "@/lib/prisma";
import { forbidden, getAdminSession } from "@/lib/session";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/admin/pricing/quotes/[id]">,
) {
  if (!(await getAdminSession())) return forbidden();

  const { id } = await context.params;
  const quote = await prisma.pricingQuote.findUnique({
    where: { id },
    include: {
      items: true,
      user: {
        select: {
          email: true,
          name: true,
          createdAt: true,
          requirement: { select: { id: true, data: true, submittedAt: true } },
        },
      },
    },
  });
  if (!quote) {
    return NextResponse.json({ error: "استعلام پیدا نشد." }, { status: 404 });
  }

  const raw = quote.user.requirement?.data;
  const requirement = raw ? mergeRequirement(JSON.parse(raw)) : null;

  return NextResponse.json({
    quote: serializeQuote(quote),
    user: {
      email: quote.user.email,
      name: quote.user.name,
      createdAt: quote.user.createdAt,
      contactName: requirement?.contactName || quote.user.name || "",
      storeName: requirement?.storeName || "",
      city: requirement?.city || "",
      requirementId: quote.user.requirement?.id ?? null,
      requirementSubmittedAt: quote.user.requirement?.submittedAt ?? null,
    },
  });
}
