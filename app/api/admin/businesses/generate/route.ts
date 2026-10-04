import { NextResponse } from "next/server";
import { z } from "zod";
import { startFormGeneration } from "@/lib/form-generation-service";
import { forbidden, getAdminSession } from "@/lib/session";

const schema = z.object({
  businessType: z
    .string()
    .trim()
    .min(2, "نوع کسب‌وکار را وارد کنید.")
    .max(100, "نوع کسب‌وکار خیلی طولانی است."),
  notes: z.string().trim().max(1000, "توضیحات خیلی طولانی است.").optional(),
});

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return forbidden();

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "اطلاعات نامعتبر است." },
      { status: 400 },
    );
  }

  const jobId = await startFormGeneration({
    businessType: parsed.data.businessType,
    notes: parsed.data.notes,
    createdById: session.sub,
  });

  return NextResponse.json({ ok: true, jobId });
}
