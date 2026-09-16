"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Field, fieldClass, PrimaryButton } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("تکرار رمز عبور یکسان نیست.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const payload = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(payload.error || "ثبت‌نام ناموفق بود.");
      return;
    }
    router.push("/form");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-md space-y-4 rounded-3xl border border-white/10 bg-[#101826] p-8"
    >
      <h1 className="text-2xl font-black">ثبت‌نام صاحب فروشگاه</h1>
      <p className="text-sm text-white/60">
        با ایمیل و رمز عبور حساب بسازید و نیازمندی‌های سایت فروش تلویزیون خود را ثبت کنید.
      </p>
      <Field label="نام و نام خانوادگی">
        <input
          className={fieldClass}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </Field>
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
          minLength={6}
          required
        />
      </Field>
      <Field label="تکرار رمز عبور">
        <input
          className={fieldClass}
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          required
        />
      </Field>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <PrimaryButton type="submit" disabled={busy} className="w-full">
        {busy ? "در حال ثبت..." : "ساخت حساب و ورود به فرم"}
      </PrimaryButton>
      <p className="text-sm text-white/50">
        قبلاً ثبت‌نام کرده‌اید؟{" "}
        <Link className="text-amber-300" href="/login">
          وارد شوید
        </Link>
      </p>
    </form>
  );
}
