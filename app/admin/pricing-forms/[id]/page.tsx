"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, use, useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Field, fieldClass, PrimaryButton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { faDate, toFaDigits, toman } from "@/lib/format";
import {
  PRICING_KIND_LABELS,
  applyPricingForm,
  calculatePricing,
  parseItemPrice,
  pricingConfigError,
  type PricingSectionView,
} from "@/lib/pricing";
import type { PricingFormUser } from "@/lib/pricing-forms";
import type { AdminPricingSection } from "@/lib/pricing-service";

type Customer = PricingFormUser & { pricingFormId: string | null };

type Detail = {
  form: {
    id: string;
    title: string;
    note: string | null;
    items: { itemId: string; price: number | null }[];
    users: PricingFormUser[];
  };
  catalogue: AdminPricingSection[];
  customers: Customer[];
};

/** itemId -> typed price override ("" keeps the catalogue price). */
type Selection = Record<string, string>;

function selectionFrom(detail: Detail): Selection {
  const selection: Selection = {};
  for (const entry of detail.form.items) {
    selection[entry.itemId] = entry.price === null ? "" : String(entry.price);
  }
  for (const section of detail.catalogue) {
    for (const item of section.items) {
      if (item.kind === "BASE" && !(item.id in selection)) selection[item.id] = "";
    }
  }
  return selection;
}

/** What the customer would actually see: active rows only. */
function activeCatalogue(catalogue: AdminPricingSection[]): PricingSectionView[] {
  return catalogue
    .filter((section) => section.active)
    .map((section) => ({
      id: section.id,
      title: section.title,
      subtitle: section.subtitle,
      sortOrder: section.sortOrder,
      items: section.items
        .filter((item) => item.active)
        .map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          price: item.price,
          imageUrl: item.imageUrl,
          kind: item.kind,
          sortOrder: item.sortOrder,
        })),
    }));
}

function customerLabel(user: PricingFormUser) {
  return user.storeName || user.contactName || user.email;
}

function PricingFormEditor({ id }: { id: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [selection, setSelection] = useState<Selection>({});
  const [dirty, setDirty] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [loadError, setLoadError] = useState("");

  const apply = useCallback(
    (
      { ok, payload }: { ok: boolean; payload: Detail & { error?: string } },
      preferCustomer?: string | null,
    ) => {
      if (!ok) {
        setLoadError(payload.error || "دریافت فرم ممکن نشد.");
        return;
      }
      const next = payload;
      setDetail(next);
      setTitle(next.form.title);
      setNote(next.form.note ?? "");
      setSelection(selectionFrom(next));
      setDirty(false);
      const assignable = next.customers.filter((customer) => customer.pricingFormId !== id);
      setCustomerId((current) => {
        const wanted = preferCustomer ?? current;
        return assignable.some((customer) => customer.id === wanted) ? wanted : "";
      });
    },
    [id],
  );

  const fetchDetail = useCallback(
    () =>
      fetch(`/api/admin/pricing-forms/${id}`).then(async (res) => ({
        ok: res.ok,
        payload: await res.json().catch(() => ({})),
      })),
    [id],
  );

  const load = useCallback(
    (preferCustomer?: string | null) =>
      fetchDetail()
        .then((result) => apply(result, preferCustomer))
        .catch(() => setLoadError("ارتباط با سرور برقرار نشد.")),
    [apply, fetchDetail],
  );

  useEffect(() => {
    void load(search.get("assignTo"));
  }, [load, search]);

  const preview = useMemo(() => {
    if (!detail) return null;
    const entries = Object.entries(selection).map(([itemId, text]) => {
      const parsed = text.trim() ? parseItemPrice(text) : null;
      return { itemId, price: parsed && "price" in parsed ? parsed.price : null };
    });
    const sections = applyPricingForm(activeCatalogue(detail.catalogue), entries);
    const allIds = sections.flatMap((section) => section.items.map((item) => item.id));
    return {
      sections,
      configError: pricingConfigError(sections),
      basePrice: calculatePricing(sections, []).totals.totalPrice,
      maxPrice: calculatePricing(sections, allIds).totals.totalPrice,
      itemCount: allIds.length,
    };
  }, [detail, selection]);

  const priceErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    for (const [itemId, text] of Object.entries(selection)) {
      if (!text.trim()) continue;
      const parsed = parseItemPrice(text);
      if ("error" in parsed) errors[itemId] = parsed.error;
    }
    return errors;
  }, [selection]);

  function toggle(itemId: string) {
    setDirty(true);
    setSelection((current) => {
      const next = { ...current };
      if (itemId in next) delete next[itemId];
      else next[itemId] = "";
      return next;
    });
  }

  function setPrice(itemId: string, value: string) {
    setDirty(true);
    setSelection((current) => ({ ...current, [itemId]: value }));
  }

  async function request(url: string, init: RequestInit, success: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(url, {
        ...init,
        headers: { "Content-Type": "application/json" },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ tone: "error", text: payload.error || "عملیات انجام نشد." });
        return false;
      }
      setMessage({ tone: "ok", text: success });
      return true;
    } catch {
      setMessage({ tone: "error", text: "ارتباط با سرور برقرار نشد." });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    const ok = await request(
      `/api/admin/pricing-forms/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          title,
          note: note || null,
          items: Object.entries(selection).map(([itemId, price]) => ({ itemId, price })),
        }),
      },
      "فرم ذخیره شد.",
    );
    if (ok) await load();
  }

  async function assign(userId: string, formId: string | null) {
    const ok = await request(
      `/api/admin/users/${userId}/pricing-form`,
      { method: "PUT", body: JSON.stringify({ formId }) },
      formId
        ? "فرم به کاربر اختصاص داده شد؛ کاربر از همین حالا می‌تواند آن را تکمیل کند."
        : "اختصاص فرم لغو شد.",
    );
    if (ok) await load(null);
  }

  async function remove() {
    if (!window.confirm("این فرم حذف شود؟")) return;
    const ok = await request(`/api/admin/pricing-forms/${id}`, { method: "DELETE" }, "فرم حذف شد.");
    if (ok) router.push("/admin/pricing-forms");
  }

  if (loadError) {
    return (
      <AdminShell>
        <Link href="/admin/pricing-forms" className="text-sm text-amber-300">
          بازگشت به فرم‌های اختصاصی
        </Link>
        <p className="text-sm text-rose-300">{loadError}</p>
      </AdminShell>
    );
  }

  if (!detail || !preview) {
    return (
      <AdminShell>
        <p className="text-white/50">در حال بارگذاری...</p>
      </AdminShell>
    );
  }

  const assignable = detail.customers.filter((customer) => customer.pricingFormId !== id);
  const hasPriceErrors = Object.keys(priceErrors).length > 0;
  const assignBlocked = dirty || Boolean(preview.configError) || !customerId;

  return (
    <AdminShell>
      <Link href="/admin/pricing-forms" className="text-sm text-amber-300">
        بازگشت به فرم‌های اختصاصی
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-6 rounded-3xl border border-white/10 bg-[#101826]/80 p-5 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="عنوان فرم">
              <input
                className={fieldClass}
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setDirty(true);
                }}
              />
            </Field>
            <Field label="یادداشت داخلی" hint="فقط مدیر می‌بیند">
              <input
                className={fieldClass}
                value={note}
                onChange={(event) => {
                  setNote(event.target.value);
                  setDirty(true);
                }}
              />
            </Field>
          </div>

          <p className="text-sm leading-7 text-white/60">
            امکاناتی را که می‌خواهید کاربر ببیند تیک بزنید. مورد پایه همیشه در فرم است. اگر قیمت
            ویژه وارد نکنید، قیمت فهرست امکانات استفاده می‌شود. موردها و بخش‌های غیرفعال به کاربر
            نمایش داده نمی‌شوند.
          </p>

          {detail.catalogue.length === 0 ? (
            <p className="rounded-2xl border border-white/10 p-4 text-sm text-white/50">
              فهرست امکانات خالی است. ابتدا از{" "}
              <Link className="text-amber-300 underline" href="/admin/pricing">
                تنظیم فرم قیمت
              </Link>{" "}
              بخش و مورد بسازید.
            </p>
          ) : null}

          {detail.catalogue.map((section) => (
            <div key={section.id} className="space-y-2">
              <h2 className="text-lg font-black">
                {section.title}
                {!section.active ? (
                  <span className="mr-2 text-xs font-normal text-rose-300">(بخش غیرفعال)</span>
                ) : null}
              </h2>
              {section.items.length === 0 ? (
                <p className="text-xs text-white/45">این بخش موردی ندارد.</p>
              ) : null}
              {section.items.map((item) => {
                const isBase = item.kind === "BASE";
                const included = item.id in selection;
                const hidden = !item.active || !section.active;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "grid gap-3 rounded-2xl border p-3 sm:grid-cols-[minmax(0,1fr)_200px] sm:items-center",
                      included ? "border-amber-400/40 bg-amber-400/5" : "border-white/10",
                    )}
                  >
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 accent-amber-400"
                        checked={included}
                        disabled={isBase || busy}
                        onChange={() => toggle(item.id)}
                      />
                      <span className="min-w-0">
                        <span className="font-medium">{item.title}</span>
                        <span className="mr-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/60">
                          {PRICING_KIND_LABELS[item.kind]}
                        </span>
                        {hidden ? (
                          <span className="mr-1 text-[11px] text-rose-300">غیرفعال</span>
                        ) : null}
                        <span className="block text-xs text-white/45">
                          قیمت فهرست: {toman(item.price)}
                        </span>
                      </span>
                    </label>
                    {included ? (
                      <div>
                        <input
                          className={cn(fieldClass, "py-2")}
                          inputMode="numeric"
                          value={selection[item.id]}
                          onChange={(event) => setPrice(item.id, event.target.value)}
                          placeholder="قیمت ویژه (اختیاری)"
                          aria-label={`قیمت ویژه ${item.title}`}
                        />
                        {priceErrors[item.id] ? (
                          <p className="mt-1 text-xs text-rose-300">{priceErrors[item.id]}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="rounded-2xl px-4 py-2 text-sm text-rose-300 hover:bg-rose-400/10"
            >
              حذف فرم
            </button>
            <PrimaryButton type="button" onClick={save} disabled={busy || hasPriceErrors}>
              {busy ? "در حال ذخیره..." : "ذخیره فرم"}
            </PrimaryButton>
          </div>
        </section>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm">
            <p className="text-xs tracking-wide text-amber-300">پیش‌نمایش برای کاربر</p>
            <p className="mt-3">امکانات قابل انتخاب: {toFaDigits(preview.itemCount)}</p>
            <p className="mt-1">حداقل قیمت (فقط پایه): {toman(preview.basePrice)}</p>
            <p className="mt-1">حداکثر قیمت (همه موارد): {toman(preview.maxPrice)}</p>
            {preview.configError ? (
              <p className="mt-3 text-xs text-rose-300">{preview.configError}</p>
            ) : null}
            {dirty ? (
              <p className="mt-3 text-xs text-amber-200">تغییرات ذخیره نشده دارید.</p>
            ) : null}
          </aside>

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm">
            <p className="text-xs tracking-wide text-amber-300">اختصاص به کاربر</p>
            {assignable.length === 0 ? (
              <p className="mt-3 text-xs text-white/50">
                کاربری در انتظار فرم قیمت‌گذاری نیست. کاربران بعد از ثبت نهایی فرم نیازمندی‌ها اینجا
                نمایش داده می‌شوند.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                <select
                  className={fieldClass}
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                >
                  <option value="">انتخاب کاربر...</option>
                  {assignable.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customerLabel(customer)} — {customer.email}
                      {customer.pricingFormId ? " (فرم دیگری دارد)" : " (در انتظار فرم)"}
                    </option>
                  ))}
                </select>
                <PrimaryButton
                  type="button"
                  className="w-full"
                  disabled={busy || assignBlocked}
                  onClick={() => assign(customerId, id)}
                >
                  اختصاص این فرم به کاربر
                </PrimaryButton>
                {dirty ? (
                  <p className="text-xs text-amber-200">ابتدا تغییرات فرم را ذخیره کنید.</p>
                ) : null}
              </div>
            )}

            {detail.form.users.length > 0 ? (
              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="text-xs text-white/45">کاربرانی که این فرم را دارند</p>
                <ul className="mt-2 space-y-2">
                  {detail.form.users.map((user) => (
                    <li
                      key={user.id}
                      className="flex items-center justify-between gap-2 rounded-2xl bg-white/5 p-2"
                    >
                      <span className="min-w-0">
                        <span className="block truncate">{customerLabel(user)}</span>
                        <span className="block text-[11px] text-white/45">
                          {user.quoteId ? "فرم را ثبت کرده" : `اختصاص: ${faDate(user.assignedAt)}`}
                        </span>
                      </span>
                      {user.quoteId ? (
                        <Link
                          href={`/admin/quotes/${user.quoteId}`}
                          className="shrink-0 text-xs text-amber-300"
                        >
                          قیمت‌گذاری
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => assign(user.id, null)}
                          className="shrink-0 text-xs text-rose-300"
                        >
                          لغو اختصاص
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>

          {message ? (
            <p
              className={cn(
                "rounded-2xl border px-4 py-3 text-sm",
                message.tone === "ok"
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                  : "border-rose-400/30 bg-rose-400/10 text-rose-200",
              )}
            >
              {message.text}
            </p>
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}

export default function AdminPricingFormDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <Suspense>
      <PricingFormEditor id={id} />
    </Suspense>
  );
}
