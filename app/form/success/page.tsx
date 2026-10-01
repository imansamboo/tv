"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RequirementsSummary } from "@/components/RequirementsSummary";
import { PRICING_FORM_PENDING_MESSAGE } from "@/lib/pricing";
import type { RequirementSummary } from "@/lib/summary";

export default function SuccessPage() {
  const [summary, setSummary] = useState<RequirementSummary | null>(null);
  const [businessName, setBusinessName] = useState<string>();
  const [locked, setLocked] = useState(false);
  const [pricingFormAssigned, setPricingFormAssigned] = useState(false);

  useEffect(() => {
    fetch("/api/form")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.summary) setSummary(payload.summary);
        setBusinessName(payload.business?.name);
        setLocked(payload.status === "SUBMITTED");
        setPricingFormAssigned(Boolean(payload.pricingFormAssigned));
      });
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="rounded-3xl border border-white/10 bg-[#101826] p-8">
        <p className="text-emerald-300">نیازمندی‌های شما ثبت شد</p>
        <h1 className="mt-2 text-3xl font-black">فرم قفل شد و آماده بررسی است</h1>
        <p className="mt-4 leading-8 text-white/70">
          تیم طراحی سایت نیازمندی‌های فروشگاه شما را دریافت کرد. اگر دوباره وارد شوید همان پاسخ‌ها را
          به‌صورت فقط‌خواندنی می‌بینید.
        </p>
        {!locked && (
          <p className="mt-4 text-amber-200">
            هنوز ثبت نهایی نشده. از{" "}
            <Link className="underline" href="/form">
              فرم نیازمندی‌ها
            </Link>{" "}
            ادامه دهید.
          </p>
        )}
        {locked && !pricingFormAssigned && (
          <p className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm leading-7 text-amber-200">
            {PRICING_FORM_PENDING_MESSAGE}
          </p>
        )}
        {locked && (
          <div className="mt-6 flex flex-wrap gap-3">
            {pricingFormAssigned && (
              <Link
                href="/pricing"
                className="inline-block rounded-2xl bg-amber-400 px-5 py-3 font-bold text-black"
              >
                انتخاب امکانات و تعیین قیمت
              </Link>
            )}
            <Link
              href="/form"
              className="inline-block rounded-2xl border border-white/15 px-5 py-3 font-bold"
            >
              مشاهده بازبینی
            </Link>
          </div>
        )}
      </section>
      {summary && <RequirementsSummary summary={summary} businessName={businessName} />}
    </div>
  );
}
