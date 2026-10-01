import { NextResponse } from "next/server";
import { z } from "zod";
import { PRICING_ITEM_KINDS, parseItemPrice } from "@/lib/pricing";
import {
  DUPLICATE_BASE_MESSAGE,
  baseLockFor,
  isDuplicateBaseError,
  moveItem,
  releasePricingImages,
} from "@/lib/pricing-service";
import { IMAGE_PATH_MESSAGE, isStoredPricingImage } from "@/lib/pricing-upload";
import { prisma } from "@/lib/prisma";
import { forbidden, getAdminSession } from "@/lib/session";

const schema = z.object({
  title: z.string().trim().min(2, "عنوان مورد را وارد کنید.").optional(),
  description: z.string().trim().max(500, "توضیح مورد خیلی طولانی است.").nullable().optional(),
  price: z.union([z.number(), z.string()]).optional(),
  imageUrl: z.string().trim().nullable().optional(),
  kind: z.enum(PRICING_ITEM_KINDS).optional(),
  active: z.boolean().optional(),
  move: z.enum(["up", "down"]).optional(),
});

const NOT_FOUND = "مورد پیدا نشد.";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/pricing/items/[id]">,
) {
  if (!(await getAdminSession())) return forbidden();

  const { id } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "اطلاعات نامعتبر است." },
      { status: 400 },
    );
  }

  const current = await prisma.pricingItem.findUnique({
    where: { id },
    include: { section: { select: { formId: true } } },
  });
  if (!current) {
    return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  }

  const { move, ...fields } = parsed.data;

  const data: Parameters<typeof prisma.pricingItem.update>[0]["data"] = {};
  if (fields.title !== undefined) data.title = fields.title;
  if (fields.description !== undefined) data.description = fields.description || null;
  if (fields.active !== undefined) data.active = fields.active;

  if (fields.price !== undefined) {
    const price = parseItemPrice(fields.price);
    if ("error" in price) {
      return NextResponse.json({ error: price.error }, { status: 400 });
    }
    data.price = price.price;
  }

  if (fields.kind !== undefined) {
    data.kind = fields.kind;
    data.baseLock = baseLockFor(fields.kind, current.section.formId);
  }

  let imageToDelete: string | null = null;
  if (fields.imageUrl !== undefined) {
    const imageUrl = fields.imageUrl || null;
    if (imageUrl && !isStoredPricingImage(imageUrl)) {
      return NextResponse.json({ error: IMAGE_PATH_MESSAGE }, { status: 400 });
    }
    data.imageUrl = imageUrl;
    if (current.imageUrl && current.imageUrl !== imageUrl) imageToDelete = current.imageUrl;
  }

  if (move) {
    const moved = await moveItem(id, move);
    if (!moved) {
      return NextResponse.json({ error: "جابه‌جایی امکان‌پذیر نیست." }, { status: 400 });
    }
  }

  if (Object.keys(data).length > 0) {
    try {
      await prisma.pricingItem.update({ where: { id }, data });
    } catch (error) {
      if (isDuplicateBaseError(error)) {
        return NextResponse.json({ error: DUPLICATE_BASE_MESSAGE }, { status: 409 });
      }
      throw error;
    }
    await releasePricingImages([imageToDelete]);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/admin/pricing/items/[id]">,
) {
  if (!(await getAdminSession())) return forbidden();

  const { id } = await context.params;
  const item = await prisma.pricingItem.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  }

  // Submitted quotes keep their snapshot rows; only the live catalogue entry goes.
  await prisma.pricingItem.delete({ where: { id } });
  await releasePricingImages([item.imageUrl]);

  return NextResponse.json({ ok: true });
}
