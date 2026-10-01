"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Field, fieldClass, PrimaryButton } from "@/components/ui";
import { faDate, toFaDigits, toman } from "@/lib/format";
import type { PricingFormSummary } from "@/lib/pricing-forms";

function PricingFormsList() {
  const router = useRouter();
  const search = useSearchParams();
  const assignTo = search.get("assignTo");
  const [forms, setForms] = useState<PricingFormSummary[] | null>(null);
  const [title, setTitle] = useState("");
  const [copyFromId, setCopyFromId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/pricing-forms")
      .then((res) => res.json())
      .then((payload) => setForms(payload.forms || []))
      .catch(() => setForms([]));
  }, []);

  async function create(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/pricing-forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, copyFromId: copyFromId || undefined }),
    });
    const payload = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(payload.error || "ساخت فرم ممکن نشد.");
      return;
    }
    const query = assignTo ? `?assignTo=${encodeURIComponent(assignTo)}` : "";
    router.push(`/admin/pricing-forms/${payload.id}${query}`);
  }

  return (
    <AdminShell>
      <p className="text-white/60">
        برای هر کاربر یک فرم قیمت‌گذاری اختصاصی بسازید: امکانات مناسب نیازمندی‌هایش را از فهرست
        امکانات انتخاب کنید، در صورت نیاز قیمت را برای همان فرم تغییر دهید و در پایان فرم را به کاربر
        اختصاص دهید. تا زمان اختصاص فرم، کاربر پیام «فرم قیمت‌گذاری شما به‌زودی آماده می‌شود» را
        می‌بیند.
      </p>

      {assignTo ? (
        <p className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          فرم جدید بسازید یا یکی از فرم‌های موجود را باز کنید؛ در صفحه ویرایش، کاربر انتخاب‌شده برای
          اختصاص آماده است.
        </p>
      ) : null}

      <form
        onSubmit={create}
        className="grid gap-4 rounded-3xl border border-white/10 bg-[#101826]/80 p-5 sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:items-end"
      >
        <Field label="عنوان فرم جدید">
          <input
            className={fieldClass}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="مثلاً فروشگاه تلویزیون آریا — پکیج کامل"
            required
            minLength={2}
          />
        </Field>
        <Field label="شروع از روی">
          <select
            className={fieldClass}
            value={copyFromId}
            onChange={(event) => setCopyFromId(event.target.value)}
          >
            <option value="">فرم خالی (فقط مورد پایه)</option>
            {(forms ?? []).map((form) => (
              <option key={form.id} value={form.id}>
                کپی از: {form.title}
              </option>
            ))}
          </select>
        </Field>
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? "در حال ساخت..." : "ساخت فرم"}
        </PrimaryButton>
        {error ? <p className="text-sm text-rose-300 sm:col-span-3">{error}</p> : null}
      </form>

      <div className="overflow-x-auto rounded-3xl border border-white/10">
        <table className="w-full min-w-[720px] text-right text-sm">
          <thead className="bg-white/5 text-white/50">
            <tr>
              {["فرم", "امکانات", "بازه قیمت", "کاربران", "آخرین ویرایش", ""].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(forms ?? []).map((form) => (
              <tr key={form.id} className="border-t border-white/10 align-top">
                <td className="px-4 py-3">
                  <div className="font-medium">{form.title}</div>
                  {form.configError ? (
                    <div className="mt-1 text-xs text-rose-300">{form.configError}</div>
                  ) : null}
                </td>
                <td className="px-4 py-3">{toFaDigits(form.itemCount)}</td>
                <td className="px-4 py-3 text-xs">
                  {toman(form.basePrice)}
                  <div className="text-white/45">تا {toman(form.maxPrice)}</div>
                </td>
                <td className="px-4 py-3">
                  {form.users.length === 0 ? (
                    <span className="text-white/45">اختصاص داده نشده</span>
                  ) : (
                    <ul className="space-y-1 text-xs">
                      {form.users.map((user) => (
                        <li key={user.id}>
                          {user.storeName || user.contactName || user.email}
                          <span className="mr-1 text-white/45">
                            {user.quoteId ? "· ثبت کرده" : "· در انتظار ثبت"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-white/45">{faDate(form.updatedAt)}</td>
                <td className="px-4 py-3">
                  <Link
                    className="text-amber-300"
                    href={`/admin/pricing-forms/${form.id}${
                      assignTo ? `?assignTo=${encodeURIComponent(assignTo)}` : ""
                    }`}
                  >
                    {assignTo ? "انتخاب و اختصاص" : "ویرایش و اختصاص"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {forms !== null && forms.length === 0 ? (
          <p className="p-6 text-center text-white/45">هنوز فرم اختصاصی ساخته نشده است.</p>
        ) : null}
        {forms === null ? <p className="p-6 text-center text-white/45">در حال بارگذاری...</p> : null}
      </div>
    </AdminShell>
  );
}

export default function AdminPricingFormsPage() {
  return (
    <Suspense>
      <PricingFormsList />
    </Suspense>
  );
}
