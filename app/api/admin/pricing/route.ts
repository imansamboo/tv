import { NextResponse } from "next/server";
import { pricingConfigError } from "@/lib/pricing";
import { loadPricingConfig, loadPricingForm } from "@/lib/pricing-service";
import { prisma } from "@/lib/prisma";
import { forbidden, getAdminSession } from "@/lib/session";

export async function GET(request: Request) {
  if (!(await getAdminSession())) return forbidden();

  const formId = new URL(request.url).searchParams.get("formId") || null;
  if (formId && !(await prisma.pricingForm.findUnique({ where: { id: formId } }))) {
    return NextResponse.json({ error: "فرم قیمت‌گذاری پیدا نشد." }, { status: 404 });
  }

  const [sections, activeSections] = await Promise.all([
    loadPricingConfig(formId),
    loadPricingForm(formId),
  ]);

  return NextResponse.json({
    sections,
    // Warns the admin when the form customers see is not usable yet.
    configError: pricingConfigError(activeSections),
  });
}
