"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { faDate } from "@/lib/format";

type Lead = {
  id: string;
  phone: string;
  name: string;
  email: string;
  message: string | null;
  createdAt: string;
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    fetch("/api/admin/leads")
      .then((res) => res.json())
      .then((payload) => setLeads(payload.leads || []));
  }, []);

  return (
    <AdminShell>
      <p className="text-white/60">
        شماره‌هایی که چت‌بات برای کمپین آینده گرفته است.
      </p>
      <div className="overflow-x-auto rounded-3xl border border-white/10">
        <table className="w-full min-w-[560px] text-right text-sm">
          <thead className="bg-white/5 text-white/50">
            <tr>
              {["موبایل", "نام", "ایمیل", "زمان"].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-white/10">
                <td className="px-4 py-3 font-bold text-amber-200">{lead.phone}</td>
                <td className="px-4 py-3">{lead.name || "میهمان"}</td>
                <td className="px-4 py-3">{lead.email || "—"}</td>
                <td className="px-4 py-3">{faDate(lead.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && (
          <p className="p-6 text-center text-white/45">هنوز شماره‌ای ثبت نشده است.</p>
        )}
      </div>
    </AdminShell>
  );
}
