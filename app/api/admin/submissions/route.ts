import { NextResponse } from "next/server";
import { mergeRequirement } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }

  const [users, drafts, submitted, rows] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.requirement.count({ where: { status: "DRAFT" } }),
    prisma.requirement.count({ where: { status: "SUBMITTED" } }),
    prisma.requirement.findMany({
      orderBy: { updatedAt: "desc" },
      include: { user: { select: { email: true, name: true } } },
    }),
  ]);

  return NextResponse.json({
    stats: { users, drafts, submitted },
    submissions: rows.map((row) => {
      const data = mergeRequirement(JSON.parse(row.data));
      return {
        id: row.id,
        status: row.status,
        email: row.user.email,
        contactName: data.contactName || row.user.name,
        storeName: data.storeName,
        businessType: data.businessType,
        city: data.city,
        featureCount: row.extrasPrice,
        completionPercent: row.totalPrice,
        submittedAt: row.submittedAt,
        updatedAt: row.updatedAt,
      };
    }),
  });
}
