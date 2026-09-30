"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = {
  role: "CUSTOMER" | "ADMIN";
};

const LABELS: Record<string, string> = {
  "/admin": "ورود به پنل مدیریت",
  "/pricing": "ادامه با فرم قیمت‌گذاری",
  "/form": "ادامه فرم نیازمندی‌ها",
};

export function HomeActions() {
  const [user, setUser] = useState<User | null>(null);
  const [landing, setLanding] = useState("/form");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((payload) => {
        setUser(payload.user ?? null);
        setLanding(payload.landing ?? "/form");
      })
      .catch(() => setUser(null));
  }, []);

  if (user) {
    return (
      <Link href={landing} className="rounded-2xl bg-amber-400 px-6 py-3 font-bold text-black">
        {LABELS[landing] ?? LABELS["/form"]}
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
