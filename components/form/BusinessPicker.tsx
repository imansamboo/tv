"use client";

import { useState } from "react";
import { Field, fieldClass, PrimaryButton } from "@/components/ui";
import type { BusinessOption } from "@/lib/business";

/** Shown to accounts that have no business yet, before the requirements form. */
export function BusinessPicker({
  businesses,
  onSelected,
}: {
  businesses: BusinessOption[];
  onSelected: () => void;
}) {
  const [businessId, setBusinessId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!businessId) {
      setError("کسب‌وکار خود را انتخاب کنید.");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/form/business", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId }),
    });
    const payload = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(payload.error || "ذخیره ممکن نشد.");
      return;
    }
    onSelected();
  }

  const selected = businesses.find((business) => business.id === businessId);

  return (
    <section className="mx-auto max-w-lg space-y-5 rounded-3xl border border-white/10 bg-[#101826]/80 p-6 sm:p-8">
      <div>
        <h2 className="text-xl font-black">کسب‌وکار شما چیست؟</h2>
        <p className="mt-2 text-sm text-white/55">
          فرم نیازمندی‌ها بر اساس نوع کسب‌وکار شما آماده می‌شود.
        </p>
      </div>
      {businesses.length === 0 ? (
        <p className="text-sm text-amber-200">فعلاً کسب‌وکاری برای انتخاب تعریف نشده است.</p>
      ) : (
        <>
          <Field label="کسب‌وکار *" hint={selected?.description || undefined}>
            <select
              className={fieldClass}
              value={businessId}
              onChange={(event) => setBusinessId(event.target.value)}
            >
              <option value="">انتخاب کنید</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
          </Field>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <PrimaryButton type="button" onClick={save} disabled={saving}>
            {saving ? "در حال ذخیره..." : "ادامه به فرم نیازمندی‌ها"}
          </PrimaryButton>
        </>
      )}
    </section>
  );
}
