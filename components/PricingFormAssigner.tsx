"use client";

import Link from "next/link";
import { useState } from "react";
import { fieldClass, PrimaryButton } from "@/components/ui";
import { faDate, toman } from "@/lib/format";

export type AssignableForm = {
  id: string;
  title: string;
  basePrice: number;
  maxPrice: number;
  itemCount: number;
  configError: string | null;
};

/** Lets the admin pick, change or create the pricing form a customer will see. */
export function PricingFormAssigner({
  userId,
  current,
  forms,
  onChanged,
}: {
  userId: string;
  current: { id: string; title: string; assignedAt: string | null } | null;
  forms: AssignableForm[];
  onChanged: () => void;
}) {
  const usable = forms.filter((form) => !form.configError);
  const [formId, setFormId] = useState(current?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(nextFormId: string | null) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/pricing-form`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: nextFormId }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || "اختصاص فرم ممکن نشد.");
        return;
      }
      onChanged();
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={
        current
          ? "mb-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4"
          : "mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4"
      }
    >
      {current ? (
        <p className="text-sm text-emerald-200">
          فرم «{current.title}» در {faDate(current.assignedAt)} به این کاربر اختصاص داده شده و کاربر
          می‌تواند آن را تکمیل کند.{" "}
          <Link className="underline" href={`/admin/pricing-forms/${current.id}`}>
            ویرایش فرم
          </Link>
        </p>
      ) : (
        <p className="text-sm text-amber-200">
          این کاربر فرم نیازمندی‌ها را ثبت کرده و منتظر فرم قیمت‌گذاری است. یک فرم بسازید یا فرم
          آماده‌ای را به او اختصاص دهید.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          className={`${fieldClass} sm:max-w-sm`}
          value={formId}
          onChange={(event) => setFormId(event.target.value)}
          disabled={busy}
        >
          <option value="">انتخاب فرم قیمت‌گذاری...</option>
          {usable.map((form) => (
            <option key={form.id} value={form.id}>
              {form.title} — {toman(form.basePrice)} تا {toman(form.maxPrice)}
            </option>
          ))}
        </select>
        <PrimaryButton
          type="button"
          disabled={busy || !formId || formId === current?.id}
          onClick={() => save(formId)}
        >
          {current ? "تغییر فرم" : "اختصاص فرم"}
        </PrimaryButton>
        <Link
          href={`/admin/pricing-forms?assignTo=${encodeURIComponent(userId)}`}
          className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-bold"
        >
          ساخت فرم جدید برای این کاربر
        </Link>
        {current ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => save(null)}
            className="rounded-2xl px-3 py-3 text-sm text-rose-300 hover:bg-rose-400/10"
          >
            لغو اختصاص
          </button>
        ) : null}
      </div>
      {forms.length > usable.length ? (
        <p className="mt-2 text-xs text-white/45">
          فرم‌هایی که هنوز قابل استفاده نیستند (مثلاً بدون مورد پایه فعال) در این فهرست نمایش داده
          نمی‌شوند.
        </p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
