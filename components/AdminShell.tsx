"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { toFaDigits } from "@/lib/format";

const links = [
  { href: "/admin", label: "نیازمندی‌ها" },
  { href: "/admin/businesses", label: "بیزینس‌ها" },
  { href: "/admin/pricing", label: "قالب پیش‌فرض فرم قیمت" },
  { href: "/admin/pricing-forms", label: "فرم‌های اختصاصی" },
  { href: "/admin/quotes", label: "قیمت‌گذاری‌ها" },
];

const NOTIFICATIONS_HREF = "/admin/notifications";
const POLL_MS = 30_000;

/** Pages can dispatch this after marking notifications read to refresh the badge. */
export const NOTIFICATIONS_CHANGED_EVENT = "fariman:notifications-changed";

function useUnreadCount(enabled: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const load = () =>
      fetch("/api/admin/notifications?count=1")
        .then((res) => (res.ok ? res.json() : null))
        .then((payload) => {
          if (active && payload) setCount(payload.unreadCount ?? 0);
        })
        .catch(() => {});

    load();
    const timer = setInterval(load, POLL_MS);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, load);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, load);
    };
  }, [enabled]);

  return count;
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [ok, setOk] = useState(false);
  const unread = useUnreadCount(ok);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((payload) => {
        setOk(payload.user?.role === "ADMIN");
      });
  }, []);

  if (!ok) {
    return <p className="py-16 text-center text-white/60">در حال بررسی دسترسی مدیر...</p>;
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-amber-300">پنل مدیریت</p>
          <h1 className="text-3xl font-black">بررسی نیازمندی‌های فروشگاه‌ها</h1>
        </div>
        <nav className="flex flex-wrap gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm",
                isActive(link.href) ? "bg-amber-400 text-black" : "bg-white/10",
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={NOTIFICATIONS_HREF}
            aria-label={unread > 0 ? `اعلان‌ها، ${unread} خوانده‌نشده` : "اعلان‌ها"}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm",
              isActive(NOTIFICATIONS_HREF) ? "bg-amber-400 text-black" : "bg-white/10",
            )}
          >
            اعلان‌ها
            {unread > 0 ? (
              <span className="min-w-5 rounded-full bg-rose-500 px-1.5 text-center text-xs font-bold leading-5 text-white">
                {toFaDigits(unread > 99 ? "99+" : unread)}
              </span>
            ) : null}
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
