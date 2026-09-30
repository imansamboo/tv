"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PricingResult } from "@/components/pricing/PricingResult";
import type { PricingQuoteView } from "@/lib/pricing-service";

export default function PricingResultPage() {
  const router = useRouter();
  const [quote, setQuote] = useState<PricingQuoteView | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/pricing/form")
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/login?next=/pricing/result");
          return null;
        }
        return res.json();
      })
      .then((payload) => {
        if (!active || !payload) return;
        if (!payload.requirementSubmitted) {
          router.replace("/form");
          return;
        }
        // Nothing submitted yet, so send the customer back to fill the form.
        if (!payload.quote) {
          router.replace("/pricing");
          return;
        }
        setQuote(payload.quote);
      })
      .catch(() => {
        if (active) setError("دریافت نتیجه ممکن نشد. اتصال خود را بررسی کنید.");
      });
    return () => {
      active = false;
    };
  }, [router]);

  if (error) {
    return (
      <p className="rounded-3xl border border-rose-400/30 bg-rose-400/10 p-6 text-center text-sm text-rose-200">
        {error}
      </p>
    );
  }

  if (!quote) {
    return <p className="py-20 text-center text-white/60">در حال بارگذاری نتیجه...</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="rounded-3xl border border-white/10 bg-[#101826] p-5 sm:p-8">
        <p className="text-emerald-300">فرم قیمت‌گذاری ثبت شد</p>
        <h1 className="mt-2 text-3xl font-black">قیمت نهایی سایت شما</h1>
        <p className="mt-4 leading-8 text-white/70">
          امکاناتی که انتخاب کردید همراه با قیمت هر مورد ذخیره شد. تیم ما بر همین اساس پیشنهاد
          نهایی را آماده می‌کند.
        </p>
        <div className="mt-6">
          <PricingResult quote={quote} />
        </div>
      </section>
      <div className="lg:sticky lg:top-24 lg:self-start">
        <aside className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs tracking-wide text-amber-300">نیازمندی‌های ثبت‌شده</p>
          <p className="mt-3 text-sm leading-7 text-white/65">
            پاسخ‌های فرم نیازمندی‌ها را می‌توانید به‌صورت فقط‌خواندنی مرور کنید.
          </p>
          <Link
            href="/form"
            className="mt-4 inline-block rounded-2xl border border-white/15 px-4 py-2 text-sm font-bold"
          >
            مشاهده نیازمندی‌ها
          </Link>
        </aside>
      </div>
    </div>
  );
}
