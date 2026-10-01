import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { loadBusinessDetail } from "@/lib/business";
import { requirementFormSchema } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { forbidden, getAdminSession } from "@/lib/session";

const NOT_FOUND = "کسب‌وکار پیدا نشد.";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/admin/businesses/[id]">,
) {
  if (!(await getAdminSession())) return forbidden();

  const { id } = await context.params;
  const business = await loadBusinessDetail(id);
  if (!business) {
    return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  }
  return NextResponse.json({ business });
}

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "نام کسب‌وکار را وارد کنید.")
    .max(120, "نام کسب‌وکار خیلی طولانی است.")
    .optional(),
  description: z.string().trim().max(300, "توضیح خیلی طولانی است.").nullable().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  form: requirementFormSchema.optional(),
});

/**
 * Saving the form only affects drafts: submitted requirements keep the snapshot
 * taken at submission. Drafts keep answers whose field keys still exist.
 */
export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/businesses/[id]">,
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

  const exists = await prisma.business.findUnique({ where: { id }, select: { id: true } });
  if (!exists) {
    return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  }

  const { name, description, active, sortOrder, form } = parsed.data;
  try {
    await prisma.business.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
        ...(active !== undefined ? { active } : {}),
        ...(sortOrder !== undefined ? { sortOrder } : {}),
        ...(form !== undefined ? { form: JSON.stringify(form) } : {}),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "کسب‌وکاری با این نام وجود دارد." }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({ ok: true, business: await loadBusinessDetail(id) });
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/admin/businesses/[id]">,
) {
  if (!(await getAdminSession())) return forbidden();

  const { id } = await context.params;
  const business = await prisma.business.findUnique({
    where: { id },
    select: { _count: { select: { users: true } } },
  });
  if (!business) {
    return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  }
  if (business._count.users > 0) {
    return NextResponse.json(
      {
        error:
          "کاربرانی با این کسب‌وکار ثبت‌نام کرده‌اند و حذف آن ممکن نیست. به‌جای حذف، آن را غیرفعال کنید.",
      },
      { status: 409 },
    );
  }

  await prisma.business.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
