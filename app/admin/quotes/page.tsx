"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { faDate, toman } from "@/lib/format";

type Row = {
  id: string;
  email: string;
  contactName: string;
  storeName: string;
  selectedCount: number;
  basePrice: number;
  extrasPrice: number;
  totalPrice: number;
  submittedAt: string;
};

export default function AdminQuotesPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/admin/pricing/quotes")
      .then((res) => res.json())
      .then((payload) => setRows(payload.quotes || []))
      .catch(() => setRows([]));
  }, []);

  const filtered = useMemo(() => {
    const list = rows ?? [];
    const query = q.trim();
    if (!query) return list;
    return list.filter((row) =>
      [row.email, row.contactName, row.storeName].join(" ").includes(query),
    );
  }, [rows, q]);

  return (
    <AdminShell>
      <p className="text-white/60">
        فرم‌های قیمت‌گذاری ثبت‌شده. قیمت هر ردیف همان قیمت لحظه ثبت است.
      </p>
      <input
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="جستجو نام فروشگاه، رابط یا ایمیل"
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-amber-400"
      />
      <div className="overflow-x-auto rounded-3xl border border-white/10">
        <table className="w-full min-w-[720px] text-right text-sm">
          <thead className="bg-white/5 text-white/50">
            <tr>
              {["فروشگاه", "رابط", "امکانات", "قیمت پایه", "قیمت نهایی", "زمان ثبت", ""].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-t border-white/10">
                <td className="px-4 py-3 font-medium">{row.storeName || "—"}</td>
                <td className="px-4 py-3">
                  <div>{row.contactName || "—"}</div>
                  <div className="text-xs text-white/45">{row.email}</div>
                </td>
                <td className="px-4 py-3">{row.selectedCount}</td>
                <td className="px-4 py-3">{toman(row.basePrice)}</td>
                <td className="px-4 py-3 font-bold text-amber-300">{toman(row.totalPrice)}</td>
                <td className="px-4 py-3 text-xs text-white/45">{faDate(row.submittedAt)}</td>
                <td className="px-4 py-3">
                  <Link className="text-amber-300" href={`/admin/quotes/${row.id}`}>
                    جزئیات
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows !== null && filtered.length === 0 ? (
          <p className="p-6 text-center text-white/45">هنوز فرم قیمت‌گذاری ثبت نشده است.</p>
        ) : null}
        {rows === null ? <p className="p-6 text-center text-white/45">در حال بارگذاری...</p> : null}
      </div>
    </AdminShell>
  );
}
