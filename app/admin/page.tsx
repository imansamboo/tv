"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { BRANDS, SIZES } from "@/lib/catalog";
import { faDate, toman } from "@/lib/format";

type Row = {
  id: string;
  status: "DRAFT" | "SUBMITTED";
  email: string;
  name: string;
  phone: string;
  city: string;
  sizeInches: number | null;
  brand: string;
  totalPrice: number;
  submittedAt: string | null;
  updatedAt: string;
};

type Payload = {
  stats: { users: number; drafts: number; submitted: number; leads: number };
  submissions: Row[];
};

export default function AdminPage() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/admin/submissions")
      .then((res) => res.json())
      .then(setPayload);
  }, []);

  const rows = useMemo(() => {
    const list = payload?.submissions ?? [];
    const query = q.trim();
    if (!query) return list;
    return list.filter((row) =>
      [row.email, row.name, row.phone, row.city].join(" ").includes(query),
    );
  }, [payload, q]);

  return (
    <AdminShell>
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["مشتریان", payload?.stats.users],
          ["پیش‌نویس", payload?.stats.drafts],
          ["ثبت نهایی", payload?.stats.submitted],
          ["شماره کمپین", payload?.stats.leads],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/45">{label}</p>
            <p className="mt-2 text-2xl font-black text-amber-300">{value ?? "—"}</p>
          </div>
        ))}
      </div>
      <input
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="جستجو نام، ایمیل یا موبایل"
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-amber-400"
      />
      <div className="overflow-x-auto rounded-3xl border border-white/10">
        <table className="w-full min-w-[720px] text-right text-sm">
          <thead className="bg-white/5 text-white/50">
            <tr>
              {["مشتری", "تماس", "تلویزیون", "مبلغ", "وضعیت", ""].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-white/10">
                <td className="px-4 py-3">
                  <div className="font-medium">{row.name || "—"}</div>
                  <div className="text-xs text-white/45">{row.email}</div>
                </td>
                <td className="px-4 py-3">
                  {row.phone || "—"}
                  <div className="text-xs text-white/45">{row.city}</div>
                </td>
                <td className="px-4 py-3">
                  {SIZES.find((item) => item.inches === row.sizeInches)?.label || "نامشخص"}
                  <div className="text-xs text-white/45">
                    {BRANDS.find((item) => item.id === row.brand)?.label || "—"}
                  </div>
                </td>
                <td className="px-4 py-3">{row.totalPrice ? toman(row.totalPrice) : "—"}</td>
                <td className="px-4 py-3">
                  {row.status === "SUBMITTED" ? "ثبت نهایی" : "پیش‌نویس"}
                  <div className="text-xs text-white/45">
                    {faDate(row.submittedAt || row.updatedAt)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Link className="text-amber-300" href={`/admin/submissions/${row.id}`}>
                    جزئیات
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-6 text-center text-white/45">هنوز درخواستی ثبت نشده است.</p>
        )}
      </div>
    </AdminShell>
  );
}
