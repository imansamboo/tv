"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type User = {
  email: string;
  name: string;
  role: "CUSTOMER" | "ADMIN";
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((payload) => setUser(payload.user ?? null))
      .catch(() => setUser(null));
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  const linkClass = (href: string) =>
    cn(
      "rounded-full px-3 py-1.5 text-sm transition",
      pathname === href || pathname.startsWith(`${href}/`)
        ? "bg-amber-400 text-black"
        : "text-white/70 hover:bg-white/10 hover:text-white",
    );

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070b14]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-amber-400 text-lg font-black text-black">
            TV
          </span>
          <span>
            <span className="block text-sm font-bold">فریمان</span>
            <span className="block text-[11px] text-white/50">
              فرم نیازمندی‌های سایت فروشگاه
            </span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          <Link className={linkClass("/")} href="/">
            خانه
          </Link>
          {user?.role === "ADMIN" ? (
            <Link className={linkClass("/admin")} href="/admin">
              پنل مدیریت
            </Link>
          ) : (
            <Link className={linkClass("/form")} href="/form">
              فرم نیازمندی‌ها
            </Link>
          )}
          {user ? (
            <>
              <span className="hidden px-2 text-xs text-white/50 sm:inline">
                {user.name || user.email}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-full px-3 py-1.5 text-sm text-white/70 hover:bg-white/10"
              >
                خروج
              </button>
            </>
          ) : (
            <>
              <Link className={linkClass("/login")} href="/login">
                ورود
              </Link>
              <Link className={linkClass("/register")} href="/register">
                ثبت‌نام
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
