import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { calculatePricing, pricingConfigError, totalPriceError } from "@/lib/pricing";
import { findQuoteForUser, loadPricingForm, serializeQuote } from "@/lib/pricing-service";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * Only the selected ids are accepted. Prices always come from the database, so a
 * total sent by the browser can never influence what is stored.
 */
const schema = z.object({
  selectedItemIds: z.array(z.string().min(1)).max(200).default([]),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "وارد شوید." }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "اطلاعات نامعتبر است." },
      { status: 400 },
    );
  }

  const requirement = await prisma.requirement.findUnique({
    where: { userId: session.sub },
    select: { status: true },
  });
  if (requirement?.status !== "SUBMITTED") {
    return NextResponse.json(
      {
        error: "ابتدا فرم نیازمندی‌ها را ثبت نهایی کنید.",
        requirementSubmitted: false,
      },
      { status: 409 },
    );
  }

  const existing = await findQuoteForUser(session.sub);
  if (existing) {
    return NextResponse.json(
      {
        error: "فرم قیمت‌گذاری قبلاً ثبت شده است.",
        alreadySubmitted: true,
        quote: existing,
      },
      { status: 409 },
    );
  }

  const sections = await loadPricingForm();
  const configError = pricingConfigError(sections);
  if (configError) {
    return NextResponse.json({ error: configError, configError }, { status: 409 });
  }

  const { lines, totals } = calculatePricing(sections, parsed.data.selectedItemIds);
  const tooLarge = totalPriceError(totals.totalPrice);
  if (tooLarge) {
    return NextResponse.json({ error: tooLarge }, { status: 400 });
  }

  try {
    const quote = await prisma.pricingQuote.create({
      data: {
        userId: session.sub,
        basePrice: totals.basePrice,
        extrasPrice: totals.extrasPrice,
        totalPrice: totals.totalPrice,
        items: {
          create: lines.map((line, position) => ({
            itemId: line.itemId,
            sectionTitle: line.sectionTitle,
            title: line.title,
            description: line.description,
            price: line.price,
            kind: line.kind,
            position,
            selected: line.selected,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ ok: true, quote: serializeQuote(quote) });
  } catch (error) {
    // `PricingQuote.userId` is unique, so a double submit loses the race here
    // rather than creating a second quote.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        {
          error: "فرم قیمت‌گذاری قبلاً ثبت شده است.",
          alreadySubmitted: true,
          quote: await findQuoteForUser(session.sub),
        },
        { status: 409 },
      );
    }
    throw error;
  }
}
