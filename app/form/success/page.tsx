"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RequirementsSummary } from "@/components/RequirementsSummary";
import { emptyRequirement, type RequirementData } from "@/lib/form";
import { summarizeRequirements } from "@/lib/summary";

export default function SuccessPage() {
  const [data, setData] = useState<RequirementData>(emptyRequirement());
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    fetch("/api/form")
      .then((res) => res.json())
      .then((payload) => {
        setData(payload.data || emptyRequirement());
        setLocked(payload.status === "SUBMITTED");
      });
  }, []);

  const summary = summarizeRequirements(data);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="rounded-3xl border border-white/10 bg-[#101826] p-8">
        <p className="text-emerald-300">نیازمندی‌های شما ثبت شد</p>
        <h1 className="mt-2 text-3xl font-black">فرم قفل شد و آماده بررسی است</h1>
        <p className="mt-4 leading-8 text-white/70">
          تیم طراحی سایت نیازمندی‌های فروشگاه شما را دریافت کرد. اگر دوباره وارد شوید همان پاسخ‌ها را به‌صورت فقط‌خواندنی می‌بینید.
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
        <Link
          href="/form"
          className="mt-6 inline-block rounded-2xl bg-amber-400 px-5 py-3 font-bold text-black"
        >
          مشاهده خلاصه ذخیره‌شده
        </Link>
      </section>
      <RequirementsSummary data={data} summary={summary} />
    </div>
  );
}
