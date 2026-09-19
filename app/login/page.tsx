"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { Field, fieldClass, PrimaryButton } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.user) {
          router.replace(search.get("next") || (payload.user.role === "ADMIN" ? "/admin" : "/form"));
        }
      })
      .finally(() => setCheckingSession(false));
  }, [router, search]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const payload = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(payload.error || "ورود ناموفق بود.");
      return;
    }
    router.push(search.get("next") || payload.next || "/form");
    router.refresh();
  }

  if (checkingSession) {
    return <p className="py-20 text-center text-white/60">در حال بررسی وضعیت ورود...</p>;
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-md space-y-4 rounded-3xl border border-white/10 bg-[#101826] p-8"
    >
      <h1 className="text-2xl font-black">ورود به فریمان</h1>
      <p className="text-sm text-white/60">
        با ایمیلی که ثبت کرده‌اید وارد شوید. تأیید ایمیل لازم نیست.
      </p>
      <Field label="ایمیل">
        <input
          className={fieldClass}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </Field>
      <Field label="رمز عبور">
        <input
          className={fieldClass}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </Field>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <PrimaryButton type="submit" disabled={busy} className="w-full">
        {busy ? "در حال ورود..." : "ورود"}
      </PrimaryButton>
      <p className="text-sm text-white/50">
        حساب ندارید؟{" "}
        <Link className="text-amber-300" href="/register">
          ثبت‌نام کنید
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
