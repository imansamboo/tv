import { NextResponse } from "next/server";
import { z } from "zod";
import { PRICING_ITEM_KINDS, parseItemPrice } from "@/lib/pricing";
import {
  DUPLICATE_BASE_MESSAGE,
  baseLockFor,
  isDuplicateBaseError,
  nextItemOrder,
} from "@/lib/pricing-service";
import { IMAGE_PATH_MESSAGE, isStoredPricingImage } from "@/lib/pricing-upload";
import { prisma } from "@/lib/prisma";
import { forbidden, getAdminSession } from "@/lib/session";

const schema = z.object({
  sectionId: z.string().min(1, "بخش را انتخاب کنید."),
  title: z.string().trim().min(2, "عنوان مورد را وارد کنید."),
  description: z.string().trim().max(500, "توضیح مورد خیلی طولانی است.").optional(),
  price: z.union([z.number(), z.string()]),
  imageUrl: z.string().trim().nullable().optional(),
  kind: z.enum(PRICING_ITEM_KINDS).default("OPTIONAL"),
  active: z.boolean().optional(),
});

export async function POST(request: Request) {
  if (!(await getAdminSession())) return forbidden();

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "اطلاعات نامعتبر است." },
      { status: 400 },
    );
  }

  const price = parseItemPrice(parsed.data.price);
  if ("error" in price) {
    return NextResponse.json({ error: price.error }, { status: 400 });
  }

  const imageUrl = parsed.data.imageUrl || null;
  if (imageUrl && !isStoredPricingImage(imageUrl)) {
    return NextResponse.json({ error: IMAGE_PATH_MESSAGE }, { status: 400 });
  }

  const section = await prisma.pricingSection.findUnique({
    where: { id: parsed.data.sectionId },
    select: { id: true, formId: true },
  });
  if (!section) {
    return NextResponse.json({ error: "بخش پیدا نشد." }, { status: 404 });
  }

  try {
    const item = await prisma.pricingItem.create({
      data: {
        sectionId: section.id,
        title: parsed.data.title,
        description: parsed.data.description || null,
        price: price.price,
        imageUrl,
        kind: parsed.data.kind,
        baseLock: baseLockFor(parsed.data.kind, section.formId),
        active: parsed.data.active ?? true,
        sortOrder: await nextItemOrder(section.id),
      },
    });
    return NextResponse.json({ ok: true, id: item.id });
  } catch (error) {
    if (isDuplicateBaseError(error)) {
      return NextResponse.json({ error: DUPLICATE_BASE_MESSAGE }, { status: 409 });
    }
    throw error;
  }
}
