import { NextResponse } from "next/server";
import { mergeRequirement } from "@/lib/form";
import { listPricingForms } from "@/lib/pricing-forms";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }

  const { id } = await context.params;
  const row = await prisma.requirement.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          pricingFormAssignedAt: true,
          pricingForm: { select: { id: true, title: true } },
          pricingQuote: {
            select: { id: true, basePrice: true, totalPrice: true, submittedAt: true },
          },
        },
      },
    },
  });
  if (!row) {
    return NextResponse.json({ error: "درخواست پیدا نشد." }, { status: 404 });
  }

  const { pricingQuote, pricingForm, pricingFormAssignedAt, ...user } = row.user;
  const data = mergeRequirement(JSON.parse(row.data));
  const forms = await listPricingForms();
  return NextResponse.json({
    id: row.id,
    status: row.status,
    currentStep: row.currentStep,
    data,
    featureCount: row.extrasPrice,
    completionPercent: row.totalPrice,
    submittedAt: row.submittedAt,
    updatedAt: row.updatedAt,
    user,
    pricingQuote,
    pricingForm: pricingForm ? { ...pricingForm, assignedAt: pricingFormAssignedAt } : null,
    pricingForms: forms.map((form) => ({
      id: form.id,
      title: form.title,
      basePrice: form.basePrice,
      maxPrice: form.maxPrice,
      itemCount: form.itemCount,
      configError: form.configError,
    })),
  });
}
