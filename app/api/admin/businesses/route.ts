import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { listBusinesses } from "@/lib/business";
import { blankRequirementForm } from "@/lib/business-seed";
import { prisma } from "@/lib/prisma";
import { forbidden, getAdminSession } from "@/lib/session";

export async function GET() {
  if (!(await getAdminSession())) return forbidden();
  return NextResponse.json({ businesses: await listBusinesses() });
}

const schema = z.object({
  name: z.string().trim().min(2, "نام کسب‌وکار را وارد کنید.").max(120, "نام کسب‌وکار خیلی طولانی است."),
  description: z.string().trim().max(300, "توضیح خیلی طولانی است.").optional(),
  /** Id of an existing business whose form is copied; empty starts from a blank form. */
  copyFromId: z.string().trim().optional(),
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

  const { name, description, copyFromId } = parsed.data;
  let form = JSON.stringify(blankRequirementForm());
  if (copyFromId) {
    const source = await prisma.business.findUnique({
      where: { id: copyFromId },
      select: { form: true },
    });
    if (!source) {
      return NextResponse.json({ error: "کسب‌وکار مبدأ پیدا نشد." }, { status: 404 });
    }
    form = source.form;
  }

  const last = await prisma.business.aggregate({ _max: { sortOrder: true } });
  try {
    const business = await prisma.business.create({
      data: {
        name,
        description: description || null,
        form,
        sortOrder: (last._max.sortOrder ?? -1) + 1,
      },
    });
    return NextResponse.json({ ok: true, id: business.id });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "کسب‌وکاری با این نام وجود دارد." }, { status: 409 });
    }
    throw error;
  }
}
