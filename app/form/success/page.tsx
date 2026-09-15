"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PriceBox } from "@/components/PriceBox";
import { emptyRequirement, type RequirementData } from "@/lib/form";
import { calculateQuote } from "@/lib/pricing";

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

  const quote = calculateQuote(data);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="rounded-3xl border border-white/10 bg-[#101826] p-8">
        <p className="text-emerald-300">درخواست شما ثبت شد</p>
        <h1 className="mt-2 text-3xl font-black">دیگر امکان پر کردن مجدد فرم نیست</h1>
        <p className="mt-4 leading-8 text-white/70">
          فروشگاه نیاز شما را دریافت کرده است. اگر وارد حساب شوید همان اطلاعات قبلی را به‌صورت فقط‌خواندنی می‌بینید. برای کمپین‌های بعدی می‌توانید از چت‌بات شماره بدهید.
        </p>
        {!locked && (
          <p className="mt-4 text-amber-200">
            هنوز ثبت نهایی نشده. از{" "}
            <Link className="underline" href="/form">
              فرم درخواست
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
      <PriceBox data={data} quote={quote} />
    </div>
  );
}
