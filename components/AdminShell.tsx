"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const links = [{ href: "/admin", label: "نیازمندی‌ها" }];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [ok, setOk] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-amber-300">پنل مدیریت</p>
          <h1 className="text-3xl font-black">بررسی نیازمندی‌های فروشگاه‌ها</h1>
        </div>
        <nav className="flex gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm",
                pathname === link.href ? "bg-amber-400 text-black" : "bg-white/10",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
