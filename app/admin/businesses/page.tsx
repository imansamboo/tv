"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Field, fieldClass, PrimaryButton } from "@/components/ui";
import type { BusinessSummary } from "@/lib/business";
import { faDate, toFaDigits } from "@/lib/format";

export default function AdminBusinessesPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<BusinessSummary[] | null>(null);
  const [name, setName] = useState("");
  const [copyFromId, setCopyFromId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/businesses")
      .then((res) => res.json())
      .then((payload) => setBusinesses(payload.businesses || []))
      .catch(() => setBusinesses([]));
  }, []);

  async function create(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, copyFromId: copyFromId || undefined }),
    });
    const payload = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(payload.error || "ساخت کسب‌وکار ممکن نشد.");
      return;
    }
    router.push(`/admin/businesses/${payload.id}`);
  }

  return (
    <AdminShell>
      <p className="text-white/60">
        هر کسب‌وکار فرم نیازمندی‌های خودش را دارد. کاربر هنگام ثبت‌نام کسب‌وکارش را انتخاب می‌کند و
        بعد از ورود همان فرم برایش باز می‌شود. مرحله‌ها، فیلدها و گزینه‌های هر فرم را در صفحه ویرایش
        کسب‌وکار بسازید؛ همه حالت‌های فرم قبلی (متن کوتاه و بلند، لیست کشویی، تک‌انتخابی، چندانتخابی و
        گزینه «سایر») در دسترس است.
      </p>

      <form
        onSubmit={create}
        className="grid gap-4 rounded-3xl border border-white/10 bg-[#101826]/80 p-5 sm:grid-cols-[minmax(0,1fr)_240px_auto] sm:items-end"
      >
        <Field label="نام کسب‌وکار جدید">
          <input
            className={fieldClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="مثلاً لوازم خانگی - یخچال"
            required
            minLength={2}
          />
        </Field>
        <Field label="فرم نیازمندی">
          <select
            className={fieldClass}
            value={copyFromId}
            onChange={(event) => setCopyFromId(event.target.value)}
          >
            <option value="">فرم خالی</option>
            {(businesses ?? []).map((business) => (
              <option key={business.id} value={business.id}>
                کپی از: {business.name}
              </option>
            ))}
          </select>
        </Field>
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? "در حال ساخت..." : "ساخت کسب‌وکار"}
        </PrimaryButton>
        {error ? <p className="text-sm text-rose-300 sm:col-span-3">{error}</p> : null}
      </form>

      <div className="overflow-x-auto rounded-3xl border border-white/10">
        <table className="w-full min-w-[720px] text-right text-sm">
          <thead className="bg-white/5 text-white/50">
            <tr>
              {["کسب‌وکار", "وضعیت", "فرم", "کاربران", "آخرین ویرایش", ""].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(businesses ?? []).map((business) => (
              <tr key={business.id} className="border-t border-white/10 align-top">
                <td className="px-4 py-3">
                  <div className="font-medium">{business.name}</div>
                  {business.description ? (
                    <div className="mt-1 text-xs text-white/45">{business.description}</div>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  {business.active ? (
                    <span className="text-emerald-300">فعال</span>
                  ) : (
                    <span className="text-white/45">غیرفعال</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">
                  {business.formError ? (
                    <span className="text-rose-300">فرم نامعتبر است</span>
                  ) : (
                    <>
                      {toFaDigits(business.stepCount)} مرحله
                      <div className="text-white/45">{toFaDigits(business.fieldCount)} فیلد</div>
                    </>
                  )}
                </td>
                <td className="px-4 py-3">{toFaDigits(business.userCount)}</td>
                <td className="px-4 py-3 text-xs text-white/45">{faDate(business.updatedAt)}</td>
                <td className="px-4 py-3">
                  <Link className="text-amber-300" href={`/admin/businesses/${business.id}`}>
                    ویرایش فرم
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {businesses !== null && businesses.length === 0 ? (
          <p className="p-6 text-center text-white/45">هنوز کسب‌وکاری تعریف نشده است.</p>
        ) : null}
        {businesses === null ? (
          <p className="p-6 text-center text-white/45">در حال بارگذاری...</p>
        ) : null}
      </div>
    </AdminShell>
  );
}
