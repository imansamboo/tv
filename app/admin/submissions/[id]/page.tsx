"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { PriceBox } from "@/components/PriceBox";
import { BRANDS, PANELS, SIZES, USAGES } from "@/lib/catalog";
import { emptyRequirement, type RequirementData } from "@/lib/form";
import { faDate, toman } from "@/lib/format";
import { calculateQuote } from "@/lib/pricing";

type Detail = {
  id: string;
  status: "DRAFT" | "SUBMITTED";
  data: RequirementData;
  totalPrice: number;
  submittedAt: string | null;
  updatedAt: string;
  user: { email: string; name: string | null };
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
  const quote = calculateQuote(data);

  return (
    <AdminShell>
      <Link href="/admin" className="text-sm text-amber-300">
        بازگشت به فهرست
      </Link>
      {!row ? (
        <p className="text-white/50">در حال بارگذاری...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="space-y-4 rounded-3xl border border-white/10 bg-[#101826] p-6">
            <div className="flex justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">{data.fullName || row.user.name}</h2>
                <p className="text-sm text-white/50">{row.user.email}</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm">
                {row.status === "SUBMITTED" ? "ثبت نهایی" : "پیش‌نویس"}
              </span>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <Item label="موبایل" value={data.phone} />
              <Item label="شهر" value={data.city} />
              <Item label="آدرس" value={data.address} />
              <Item
                label="تلویزیون"
                value={`${SIZES.find((item) => item.inches === data.sizeInches)?.label || "—"} / ${BRANDS.find((item) => item.id === data.brand)?.label || "—"} / ${PANELS.find((item) => item.id === data.panelType)?.label || "—"}`}
              />
              <Item
                label="کاربری"
                value={USAGES.find((item) => item.id === data.usage)?.label || "—"}
              />
              <Item label="ثبت" value={faDate(row.submittedAt || row.updatedAt)} />
            </dl>
            {quote.extras.length > 0 && (
              <ul className="rounded-2xl bg-white/5 p-4 text-sm">
                {quote.extras.map((line) => (
                  <li key={line.key} className="flex justify-between py-1">
                    <span>{line.label}</span>
                    <span>{toman(line.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <PriceBox data={data} quote={quote} />
        </div>
      )}
    </AdminShell>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <dt className="text-xs text-white/45">{label}</dt>
      <dd className="mt-1">{value || "—"}</dd>
    </div>
  );
}
