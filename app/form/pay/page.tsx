"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toman } from "@/lib/format";
import { PrimaryButton } from "@/components/ui";

export default function PayPage() {
  const router = useRouter();
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/form")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.status !== "SUBMITTED") {
          router.replace("/form");
          return;
        }
        setTotal(payload.quote?.total || 0);
      });
  }, [router]);

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white p-8 text-black">
      <p className="text-center text-xs tracking-[0.3em] text-slate-500">SHAPARAK / TEST GATEWAY</p>
      <h1 className="mt-3 text-center text-2xl font-black">درگاه پرداخت آزمایشی</h1>
      <p className="mt-2 text-center text-sm text-slate-500">پذیرنده: فروشگاه پارس‌تی‌وی</p>
      <div className="mt-8 rounded-2xl bg-slate-100 p-5 text-center">
        <p className="text-sm text-slate-500">مبلغ قابل پرداخت</p>
        <p className="mt-2 text-3xl font-black">{toman(total)}</p>
      </div>
      <div className="mt-6 space-y-3">
        <PrimaryButton
          className="w-full"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            setTimeout(() => router.push("/form/success"), 700);
          }}
        >
          {busy ? "در حال اتصال به بانک..." : "پرداخت موفق (شبیه‌سازی)"}
        </PrimaryButton>
        <button
          type="button"
          className="w-full rounded-2xl border border-slate-200 py-3 text-sm"
          onClick={() => router.push("/form")}
        >
          انصراف و مشاهده درخواست ثبت‌شده
        </button>
      </div>
    </div>
  );
}
