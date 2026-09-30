"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { ReviewPanel } from "@/components/form/ReviewPanel";
import { RequirementsSummary } from "@/components/RequirementsSummary";
import { emptyRequirement, type RequirementData } from "@/lib/form";
import { faDate, toman } from "@/lib/format";
import { summarizeRequirements } from "@/lib/summary";

type Detail = {
  id: string;
  status: "DRAFT" | "SUBMITTED";
  data: RequirementData;
  completionPercent: number;
  featureCount: number;
  submittedAt: string | null;
  updatedAt: string;
  user: { email: string; name: string | null };
  pricingQuote: {
    id: string;
    basePrice: number;
    totalPrice: number;
    submittedAt: string;
  } | null;
};

export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [row, setRow] = useState<Detail | null>(null);

  useEffect(() => {
    fetch(`/api/admin/submissions/${id}`)
      .then((res) => res.json())
      .then(setRow);
  }, [id]);

  const data = row?.data || emptyRequirement();
  const summary = summarizeRequirements(data);

  return (
    <AdminShell>
      <Link href="/admin" className="text-sm text-amber-300">
        بازگشت به فهرست
      </Link>
      {!row ? (
        <p className="text-white/50">در حال بارگذاری...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="rounded-3xl border border-white/10 bg-[#101826]/80 p-5 sm:p-8">
            <div className="mb-6 flex justify-between gap-3">
              <div>
                <p className="text-amber-300">جزئیات نیازمندی‌ها</p>
                <h2 className="mt-1 text-2xl font-black">{data.storeName || "بدون نام"}</h2>
                <p className="mt-1 text-sm text-white/50">
                  {data.contactName || row.user.name} · {row.user.email}
                </p>
              </div>
              <span className="h-fit rounded-full bg-white/10 px-3 py-1 text-sm">
                {row.status === "SUBMITTED" ? "ثبت نهایی" : "پیش‌نویس"}
              </span>
            </div>
            <p className="mb-4 text-xs text-white/40">
              آخرین بروزرسانی: {faDate(row.submittedAt || row.updatedAt)}
            </p>
            {row.pricingQuote ? (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
                <div>
                  <p className="text-xs text-amber-200">قیمت نهایی ثبت‌شده</p>
                  <p className="mt-1 text-xl font-black text-amber-300">
                    {toman(row.pricingQuote.totalPrice)}
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    پایه {toman(row.pricingQuote.basePrice)} ·{" "}
                    {faDate(row.pricingQuote.submittedAt)}
                  </p>
                </div>
                <Link
                  href={`/admin/quotes/${row.pricingQuote.id}`}
                  className="rounded-2xl bg-amber-400 px-4 py-2 text-sm font-bold text-black"
                >
                  جزئیات قیمت‌گذاری
                </Link>
              </div>
            ) : null}
            <ReviewPanel data={data} completionPercent={summary.completionPercent} />
          </section>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <RequirementsSummary data={data} summary={summary} />
          </div>
        </div>
      )}
    </AdminShell>
  );
}
