import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }

  const leads = await prisma.campaignLead.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, name: true } } },
  });

  return NextResponse.json({
    leads: leads.map((lead) => ({
      id: lead.id,
      phone: lead.phone,
      name: lead.name || lead.user?.name || "",
      email: lead.user?.email || "",
      message: lead.message,
      createdAt: lead.createdAt,
    })),
  });
}
