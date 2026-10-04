"use client";

import { useCallback, useState } from "react";
import { Field, fieldClass } from "@/components/ui";

export type CaptchaPayload = {
  token: string;
  question: string;
};

type FieldProps = {
  token: string;
  question: string;
  answer: string;
  loading: boolean;
  error?: string;
  onAnswerChange: (value: string) => void;
  onRefresh: () => void;
};

async function fetchCaptcha(): Promise<CaptchaPayload> {
  const res = await fetch("/api/auth/captcha", { cache: "no-store" });
  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload.error || "بارگذاری کد امنیتی ناموفق بود.");
  }
  return payload as CaptchaPayload;
}

export function usePersianCaptcha() {
  const [token, setToken] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const challenge = await fetchCaptcha();
      setToken(challenge.token);
      setQuestion(challenge.question);
      setAnswer("");
    } catch (loadError) {
      setToken("");
      setQuestion("");
      setAnswer("");
      setError(
        loadError instanceof Error ? loadError.message : "بارگذاری کد امنیتی ناموفق بود.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    token,
    question,
    answer,
    loading,
    error,
    setAnswer,
    refresh,
  };
}

export function PersianCaptchaField({
  token,
  question,
  answer,
  loading,
  error,
  onAnswerChange,
  onRefresh,
}: FieldProps) {
  return (
    <Field label="کد امنیتی" hint="پاسخ را به عدد (فارسی یا انگلیسی) وارد کنید">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-400/25 bg-amber-400/5 px-4 py-3">
          <p className="text-sm font-medium leading-7 text-amber-100" dir="rtl">
            {loading ? "در حال بارگذاری سؤال..." : question || "سؤال امنیتی در دسترس نیست."}
          </p>
          <button
            type="button"
            className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/75 transition hover:border-amber-300/40 hover:text-amber-200"
            onClick={onRefresh}
            disabled={loading}
            aria-label="دریافت کد امنیتی جدید"
          >
            جدید
          </button>
        </div>
        <input
          className={fieldClass}
          inputMode="numeric"
          autoComplete="off"
          value={answer}
          onChange={(event) => onAnswerChange(event.target.value)}
          placeholder="مثلاً ۸"
          required
          disabled={loading || !token}
        />
      </div>
      {error ? <span className="block text-xs text-rose-400">{error}</span> : null}
    </Field>
  );
}
