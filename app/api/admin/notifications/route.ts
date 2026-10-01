import { NextResponse } from "next/server";
import { z } from "zod";
import { customerNames } from "@/lib/customer";
import { NOTIFICATION_LABELS } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { forbidden, getAdminSession } from "@/lib/session";

const LIST_LIMIT = 100;

export async function GET(request: Request) {
  if (!(await getAdminSession())) return forbidden();

  // The nav badge polls with `?count=1` and only needs the number.
  if (new URL(request.url).searchParams.get("count")) {
    const unreadCount = await prisma.adminNotification.count({ where: { readAt: null } });
    return NextResponse.json({ unreadCount });
  }

  const [unreadCount, rows] = await Promise.all([
    prisma.adminNotification.count({ where: { readAt: null } }),
    prisma.adminNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: LIST_LIMIT,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            pricingFormId: true,
            requirement: { select: { id: true, contactName: true, storeName: true } },
            pricingQuote: { select: { id: true } },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    unreadCount,
    notifications: rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      label: NOTIFICATION_LABELS[row.kind],
      readAt: row.readAt,
      createdAt: row.createdAt,
      user: {
        id: row.user.id,
        email: row.user.email,
        ...customerNames(row.user),
      },
      requirementId: row.user.requirement?.id ?? null,
      quoteId: row.user.pricingQuote?.id ?? null,
      pricingFormAssigned: Boolean(row.user.pricingFormId),
    })),
  });
}

const schema = z.union([
  z.object({ all: z.literal(true) }),
  z.object({ ids: z.array(z.string().min(1)).min(1).max(LIST_LIMIT) }),
]);

export async function PATCH(request: Request) {
  if (!(await getAdminSession())) return forbidden();

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "اطلاعات نامعتبر است." }, { status: 400 });
  }

  await prisma.adminNotification.updateMany({
    where: {
      readAt: null,
      ...("ids" in parsed.data ? { id: { in: parsed.data.ids } } : {}),
    },
    data: { readAt: new Date() },
  });

  const unreadCount = await prisma.adminNotification.count({ where: { readAt: null } });
  return NextResponse.json({ ok: true, unreadCount });
}
