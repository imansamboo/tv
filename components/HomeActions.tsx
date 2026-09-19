"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = {
  role: "CUSTOMER" | "ADMIN";
};

export function HomeActions() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((payload) => setUser(payload.user ?? null))
      .catch(() => setUser(null));
  }, []);

  if (user) {
    const href = user.role === "ADMIN" ? "/admin" : "/form";
    const label = user.role === "ADMIN" ? "ورود به پنل مدیریت" : "ادامه فرم نیازمندی‌ها";
    return (
      <Link href={href} className="rounded-2xl bg-amber-400 px-6 py-3 font-bold text-black">
        {label}
      </Link>
    );
  }

  return (
    <>
      <Link href="/register" className="rounded-2xl bg-amber-400 px-6 py-3 font-bold text-black">
        ثبت‌نام و شروع فرم
      </Link>
      <Link href="/login" className="rounded-2xl border border-white/15 px-6 py-3 font-bold">
        ورود به حساب
      </Link>
    </>
  );
}
