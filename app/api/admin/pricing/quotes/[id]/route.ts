import { NextResponse } from "next/server";
import { customerNames } from "@/lib/customer";
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
          business: { select: { name: true } },
          requirement: {
            select: { id: true, contactName: true, storeName: true, city: true, submittedAt: true },
          },
        },
      },
    },
  });
  if (!quote) {
    return NextResponse.json({ error: "استعلام پیدا نشد." }, { status: 404 });
  }

  return NextResponse.json({
    quote: serializeQuote(quote),
    user: {
      email: quote.user.email,
      name: quote.user.name,
      createdAt: quote.user.createdAt,
      ...customerNames(quote.user),
      city: quote.user.requirement?.city || "",
      businessName: quote.user.business?.name ?? null,
      requirementId: quote.user.requirement?.id ?? null,
      requirementSubmittedAt: quote.user.requirement?.submittedAt ?? null,
    },
  });
}
