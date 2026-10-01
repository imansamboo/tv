"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminShell, NOTIFICATIONS_CHANGED_EVENT } from "@/components/AdminShell";
import { cn } from "@/lib/cn";
import { faDate } from "@/lib/format";

type Notification = {
  id: string;
  kind: "REQUIREMENT_SUBMITTED" | "PRICING_SUBMITTED";
  label: string;
  readAt: string | null;
  createdAt: string;
  user: { id: string; email: string; contactName: string; storeName: string };
  requirementId: string | null;
  quoteId: string | null;
  pricingFormAssigned: boolean;
};

type Payload = { unreadCount: number; notifications: Notification[] };

function actionFor(row: Notification) {
  if (row.kind === "PRICING_SUBMITTED" && row.quoteId) {
    return { href: `/admin/quotes/${row.quoteId}`, label: "مشاهده قیمت‌گذاری" };
  }
  if (!row.requirementId) return null;
  if (row.kind === "REQUIREMENT_SUBMITTED" && !row.pricingFormAssigned && !row.quoteId) {
    return { href: `/admin/submissions/${row.requirementId}`, label: "اختصاص فرم قیمت‌گذاری" };
  }
  return { href: `/admin/submissions/${row.requirementId}`, label: "مشاهده نیازمندی‌ها" };
}

export default function AdminNotificationsPage() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/notifications")
      .then((res) => res.json())
      .then((data: Payload) => setPayload(data))
      .catch(() => setError("دریافت اعلان‌ها ممکن نشد."));
  }, []);

  useEffect(load, [load]);

  async function markRead(body: { all: true } | { ids: string[] }) {
    const res = await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return;
    const now = new Date().toISOString();
    const ids = "ids" in body ? new Set(body.ids) : null;
    setPayload((current) =>
      current
        ? {
            unreadCount: ids
              ? current.notifications.filter((row) => !row.readAt && !ids.has(row.id)).length
              : 0,
            notifications: current.notifications.map((row) =>
              !row.readAt && (!ids || ids.has(row.id)) ? { ...row, readAt: now } : row,
            ),
          }
        : current,
    );
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
  }

  const rows = payload?.notifications ?? [];

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-white/60">
          وقتی کاربری فرم نیازمندی‌ها یا فرم قیمت‌گذاری را ثبت می‌کند، اینجا باخبر می‌شوید.
        </p>
        {payload && payload.unreadCount > 0 ? (
          <button
            type="button"
            onClick={() => markRead({ all: true })}
            className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
          >
            علامت‌گذاری همه به‌عنوان خوانده‌شده
          </button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <ul className="space-y-3">
        {rows.map((row) => {
          const action = actionFor(row);
          return (
            <li
              key={row.id}
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 rounded-3xl border p-4",
                row.readAt
                  ? "border-white/10 bg-white/5"
                  : "border-amber-400/40 bg-amber-400/10",
              )}
            >
              <div className="min-w-0">
                <p className="text-sm">
                  {!row.readAt ? (
                    <span className="ml-2 inline-block h-2 w-2 rounded-full bg-amber-400" />
                  ) : null}
                  <span className="font-bold">
                    {row.user.storeName || row.user.contactName || row.user.email}
                  </span>{" "}
                  {row.label}
                </p>
                <p className="mt-1 text-xs text-white/45">
                  {row.user.email} · {faDate(row.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!row.readAt ? (
                  <button
                    type="button"
                    onClick={() => markRead({ ids: [row.id] })}
                    className="rounded-full px-3 py-1.5 text-xs text-white/60 hover:bg-white/10"
                  >
                    خوانده شد
                  </button>
                ) : null}
                {action ? (
                  <Link
                    href={action.href}
                    onClick={() => {
                      if (!row.readAt) void markRead({ ids: [row.id] });
                    }}
                    className="rounded-2xl bg-amber-400 px-4 py-2 text-xs font-bold text-black"
                  >
                    {action.label}
                  </Link>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {payload && rows.length === 0 ? (
        <p className="rounded-3xl border border-white/10 p-6 text-center text-white/45">
          هنوز اعلانی ثبت نشده است.
        </p>
      ) : null}
      {!payload && !error ? <p className="text-white/50">در حال بارگذاری...</p> : null}
    </AdminShell>
  );
}
