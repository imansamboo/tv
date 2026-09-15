import { NextResponse } from "next/server";
import { mergeRequirement } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }

  const [users, drafts, submitted, leads, rows] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.requirement.count({ where: { status: "DRAFT" } }),
    prisma.requirement.count({ where: { status: "SUBMITTED" } }),
    prisma.campaignLead.count(),
    prisma.requirement.findMany({
      orderBy: { updatedAt: "desc" },
      include: { user: { select: { email: true, name: true } } },
    }),
  ]);

  return NextResponse.json({
    stats: { users, drafts, submitted, leads },
    submissions: rows.map((row) => {
      const data = mergeRequirement(JSON.parse(row.data));
      return {
        id: row.id,
        status: row.status,
        email: row.user.email,
        name: data.fullName || row.user.name,
        phone: data.phone,
        city: data.city,
        sizeInches: data.sizeInches,
        brand: data.brand,
        totalPrice: row.totalPrice,
        submittedAt: row.submittedAt,
        updatedAt: row.updatedAt,
      };
    }),
  });
}
