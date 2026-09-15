import { NextResponse } from "next/server";
import { mergeRequirement } from "@/lib/form";
import { calculateQuote } from "@/lib/pricing";
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
    include: { user: { select: { email: true, name: true, createdAt: true } } },
  });
  if (!row) {
    return NextResponse.json({ error: "درخواست پیدا نشد." }, { status: 404 });
  }

  const data = mergeRequirement(JSON.parse(row.data));
  return NextResponse.json({
    id: row.id,
    status: row.status,
    currentStep: row.currentStep,
    data,
    quote: calculateQuote(data),
    tvPrice: row.tvPrice,
    extrasPrice: row.extrasPrice,
    totalPrice: row.totalPrice,
    submittedAt: row.submittedAt,
    updatedAt: row.updatedAt,
    user: row.user,
  });
}
