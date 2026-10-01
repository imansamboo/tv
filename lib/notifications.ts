import type { NotificationKind } from "@prisma/client";
import { prisma } from "./prisma";

export const NOTIFICATION_LABELS: Record<NotificationKind, string> = {
  REQUIREMENT_SUBMITTED: "فرم نیازمندی‌ها را ثبت کرد و منتظر فرم قیمت‌گذاری است",
  PRICING_SUBMITTED: "فرم قیمت‌گذاری را تکمیل و ثبت کرد",
};

/**
 * Records an event for the admin panel. A failure here must never undo the
 * customer's submission, so it is logged instead of thrown.
 */
export async function notifyAdmins(kind: NotificationKind, userId: string) {
  try {
    await prisma.adminNotification.create({ data: { kind, userId } });
  } catch (error) {
    console.error("Failed to record admin notification", error);
  }
}
