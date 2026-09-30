import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { deletePricingImage } from "@/lib/pricing-upload";
import { moveSection } from "@/lib/pricing-service";
import { prisma } from "@/lib/prisma";
import { forbidden, getAdminSession } from "@/lib/session";

const schema = z.object({
  title: z.string().trim().min(2, "عنوان بخش را وارد کنید.").optional(),
  subtitle: z.string().trim().max(200, "توضیح بخش خیلی طولانی است.").nullable().optional(),
  active: z.boolean().optional(),
  move: z.enum(["up", "down"]).optional(),
});

const NOT_FOUND = "بخش پیدا نشد.";

export async function PATCH(request: Request, context: RouteContext<"/api/admin/pricing/sections/[id]">) {
  if (!(await getAdminSession())) return forbidden();

  const { id } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "اطلاعات نامعتبر است." },
      { status: 400 },
    );
  }

  const { move, ...fields } = parsed.data;
  if (move) {
    const moved = await moveSection(id, move);
    if (!moved) {
      return NextResponse.json({ error: "جابه‌جایی امکان‌پذیر نیست." }, { status: 400 });
    }
  }

  if (Object.keys(fields).length > 0) {
    try {
      await prisma.pricingSection.update({
        where: { id },
        data: {
          ...(fields.title === undefined ? {} : { title: fields.title }),
          ...(fields.subtitle === undefined ? {} : { subtitle: fields.subtitle || null }),
          ...(fields.active === undefined ? {} : { active: fields.active }),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
      }
      throw error;
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/admin/pricing/sections/[id]">,
) {
  if (!(await getAdminSession())) return forbidden();

  const { id } = await context.params;
  const section = await prisma.pricingSection.findUnique({
    where: { id },
    include: { items: { select: { imageUrl: true } } },
  });
  if (!section) {
    return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  }

  // Items cascade with the section; their quote snapshots keep their own copies.
  await prisma.pricingSection.delete({ where: { id } });
  await Promise.all(section.items.map((item) => deletePricingImage(item.imageUrl)));

  return NextResponse.json({ ok: true });
}
