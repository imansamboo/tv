import { NextResponse } from "next/server";
import {
  UPLOAD_MISSING_MESSAGE,
  savePricingImage,
} from "@/lib/pricing-upload";
import { forbidden, getAdminSession } from "@/lib/session";

export async function POST(request: Request) {
  if (!(await getAdminSession())) return forbidden();

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: UPLOAD_MISSING_MESSAGE }, { status: 400 });
  }

  const result = await savePricingImage(file);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, imageUrl: result.imageUrl });
}
