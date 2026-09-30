"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { PricingResult } from "@/components/pricing/PricingResult";
import { faDate, toman } from "@/lib/format";
import type { PricingQuoteView } from "@/lib/pricing-service";

type Detail = {
  quote: PricingQuoteView;
  user: {
    email: string;
    name: string | null;
    createdAt: string;
    contactName: string;
    storeName: string;
    city: string;
    requirementId: string | null;
    requirementSubmittedAt: string | null;
  };
};

function Info({ label, value }: { label: string; value: string }) {
  if (!value || value === "—") return null;
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

export default function AdminQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/pricing/quotes/${id}`)
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) {
          setError(payload.error || "دریافت اطلاعات ممکن نشد.");
          return;
        }
        setDetail(payload);
      })
      .catch(() => setError("ارتباط با سرور برقرار نشد."));
  }, [id]);

  const notSelected = detail?.quote.items.filter((item) => !item.selected) ?? [];

  return (
    <AdminShell>
      <Link href="/admin/quotes" className="text-sm text-amber-300">
        بازگشت به فهرست قیمت‌گذاری‌ها
      </Link>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      {!detail ? (
        error ? null : (
          <p className="text-white/50">در حال بارگذاری...</p>
        )
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="rounded-3xl border border-white/10 bg-[#101826]/80 p-5 sm:p-8">
            <div className="mb-6">
              <p className="text-amber-300">جزئیات فرم قیمت‌گذاری</p>
              <h2 className="mt-1 text-2xl font-black">
                {detail.user.storeName || "بدون نام فروشگاه"}
              </h2>
              <p className="mt-1 text-sm text-white/50">
                {detail.user.contactName || detail.user.name} · {detail.user.email}
              </p>
              <p className="mt-1 text-xs text-white/40">
                زمان ثبت: {faDate(detail.quote.submittedAt)}
              </p>
            </div>

            <PricingResult quote={detail.quote} />

            {notSelected.length > 0 ? (
              <div className="mt-8">
                <p className="text-xs tracking-wide text-white/45">
                  امکاناتی که در همان زمان پیشنهاد شد ولی انتخاب نشد
                </p>
                <ul className="mt-3 space-y-2">
                  {notSelected.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 p-3 text-sm text-white/50"
                    >
                      <span className="min-w-0">
                        {item.title}
                        <span className="mr-2 text-xs text-white/35">{item.sectionTitle}</span>
                      </span>
                      <span className="shrink-0 text-xs">{toman(item.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
            <aside className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs tracking-wide text-amber-300">اطلاعات فروشگاه</p>
              <div className="mt-4 grid gap-3 text-sm">
                <Info label="فروشگاه" value={detail.user.storeName} />
                <Info label="رابط" value={detail.user.contactName || detail.user.name || ""} />
                <Info label="ایمیل" value={detail.user.email} />
                <Info label="شهر" value={detail.user.city} />
                <Info label="عضویت" value={faDate(detail.user.createdAt)} />
                <Info
                  label="ثبت نیازمندی‌ها"
                  value={faDate(detail.user.requirementSubmittedAt)}
                />
              </div>
              {detail.user.requirementId ? (
                <Link
                  href={`/admin/submissions/${detail.user.requirementId}`}
                  className="mt-4 inline-block rounded-2xl border border-white/15 px-4 py-2 text-sm font-bold"
                >
                  مشاهده نیازمندی‌ها
                </Link>
              ) : null}
            </aside>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
