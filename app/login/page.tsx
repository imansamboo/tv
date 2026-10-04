"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { PersianCaptchaField, usePersianCaptcha } from "@/components/PersianCaptchaField";
import { Field, fieldClass, PrimaryButton } from "@/components/ui";
import { captchaInputError } from "@/lib/captcha";
import { SITE_NAME } from "@/lib/site";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        if (payload.user) {
          router.replace(search.get("next") || payload.landing || "/form");
        }
      })
      .finally(() => setCheckingSession(false));
  }, [router, search, refreshCaptcha]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const captchaError = captchaInputError(captcha.token, captcha.answer);
    if (captchaError) {
      setError(captchaError);
      return;
    }
    setBusy(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        captchaToken: captcha.token,
        captchaAnswer: captcha.answer,
      }),
    });
    const payload = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(payload.error || "ورود ناموفق بود.");
      await captcha.refresh();
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
      <h1 className="text-2xl font-black">ورود به {SITE_NAME}</h1>
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
