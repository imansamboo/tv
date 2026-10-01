import { NextResponse } from "next/server";
import { z } from "zod";
import { listPricingForms } from "@/lib/pricing-forms";
import { copyPricingSections } from "@/lib/pricing-service";
import { prisma } from "@/lib/prisma";
import { forbidden, getAdminSession } from "@/lib/session";

export async function GET() {
  if (!(await getAdminSession())) return forbidden();
  return NextResponse.json({ forms: await listPricingForms() });
}

const schema = z.object({
  title: z.string().trim().min(2, "عنوان فرم را وارد کنید.").max(120, "عنوان فرم خیلی طولانی است."),
  note: z.string().trim().max(1000, "توضیح فرم خیلی طولانی است.").optional(),
  /** "template", "empty", or the id of an existing form to copy. */
  copyFrom: z.string().min(1).default("template"),
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

  const { copyFrom } = parsed.data;
  const source = copyFrom === "template" ? null : copyFrom;
  if (copyFrom !== "empty" && source) {
    const exists = await prisma.pricingForm.findUnique({ where: { id: source } });
    if (!exists) {
      return NextResponse.json({ error: "فرم مبدأ پیدا نشد." }, { status: 404 });
    }
  }

  const form = await prisma.$transaction(async (tx) => {
    const created = await tx.pricingForm.create({
      data: { title: parsed.data.title, note: parsed.data.note || null },
    });
    if (copyFrom !== "empty") await copyPricingSections(tx, source, created.id);
    return created;
  });

  return NextResponse.json({ ok: true, id: form.id });
}
