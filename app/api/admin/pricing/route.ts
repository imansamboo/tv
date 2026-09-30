import { NextResponse } from "next/server";
import { pricingConfigError } from "@/lib/pricing";
import { loadPricingConfig, loadPricingForm } from "@/lib/pricing-service";
import { forbidden, getAdminSession } from "@/lib/session";

export async function GET() {
  if (!(await getAdminSession())) return forbidden();

  const [sections, activeSections] = await Promise.all([
    loadPricingConfig(),
    loadPricingForm(),
  ]);

  return NextResponse.json({
    sections,
    // Warns the admin when the form customers see is not usable yet.
    configError: pricingConfigError(activeSections),
  });
}
