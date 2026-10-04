"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { PersianCaptchaField, usePersianCaptcha } from "@/components/PersianCaptchaField";
import { Field, fieldClass, PrimaryButton } from "@/components/ui";
import type { BusinessOption } from "@/lib/business";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const captcha = usePersianCaptcha();
  const { refresh: refreshCaptcha } = captcha;

  useEffect(() => {
    void refreshCaptcha();
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.user) router.replace("/form");
      })
      .finally(() => setCheckingSession(false));
  }, [router, refreshCaptcha]);

  useEffect(() => {
    fetch("/api/businesses")
      .then((res) => res.json())
      .then((payload: { businesses?: BusinessOption[] }) => setBusinesses(payload.businesses ?? []))
      .catch(() => setBusinesses([]));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("تکرار رمز عبور یکسان نیست.");
      return;
    }
    if (!businessId) {
      setError("کسب‌وکار خود را انتخاب کنید.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        businessId,
        captchaToken: captcha.token,
        captchaAnswer: captcha.answer,
      }),
    });
    const payload = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(payload.error || "ثبت‌نام ناموفق بود.");
      await captcha.refresh();
      return;
    }
    router.push("/form");
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
      <h1 className="text-2xl font-black">ثبت‌نام صاحب کسب‌وکار</h1>
      <p className="text-sm text-white/60">
        با ایمیل و رمز عبور حساب بسازید، کسب‌وکار خود را انتخاب کنید و نیازمندی‌های سایت آن را ثبت کنید.
      </p>
      <Field label="نام و نام خانوادگی">
        <input
          className={fieldClass}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </Field>
      <Field
        label="کسب‌وکار"
        hint={businesses.find((business) => business.id === businessId)?.description || undefined}
      >
        <select
          className={fieldClass}
          value={businessId}
          onChange={(event) => setBusinessId(event.target.value)}
          required
        >
          <option value="">انتخاب کنید</option>
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name}
            </option>
          ))}
        </select>
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
      <PersianCaptchaField
        token={captcha.token}
        question={captcha.question}
        answer={captcha.answer}
        loading={captcha.loading}
        error={captcha.error}
        onAnswerChange={captcha.setAnswer}
        onRefresh={() => void captcha.refresh()}
      />
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
