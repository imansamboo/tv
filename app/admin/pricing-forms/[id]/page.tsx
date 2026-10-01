"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, use, useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { PricingConfigManager } from "@/components/pricing/PricingConfigManager";
import { Field, fieldClass, PrimaryButton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { faDate, toFaDigits, toman } from "@/lib/format";
import type { PricingFormUser } from "@/lib/pricing-forms";

type Customer = PricingFormUser & { pricingFormId: string | null };

type Detail = {
  form: {
    id: string;
    title: string;
    note: string | null;
    itemCount: number;
    basePrice: number;
    maxPrice: number;
    configError: string | null;
    users: PricingFormUser[];
  };
  customers: Customer[];
};

type Result = { ok: boolean; payload: Detail & { error?: string } };

function customerLabel(user: PricingFormUser) {
  return user.storeName || user.contactName || user.email;
}

function PricingFormEditor({ id }: { id: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [loadError, setLoadError] = useState("");

  const fetchDetail = useCallback(
    (): Promise<Result> =>
      fetch(`/api/admin/pricing-forms/${id}`).then(async (res) => ({
        ok: res.ok,
        payload: await res.json().catch(() => ({})),
      })),
    [id],
  );

  /** Refreshes the summary and lists; `resetFields` also reloads title and note. */
  const load = useCallback(
    (options: { preferCustomer?: string | null; resetFields?: boolean } = {}) =>
      fetchDetail()
        .then(({ ok, payload }) => {
          if (!ok) {
            setLoadError(payload.error || "دریافت فرم ممکن نشد.");
            return;
          }
          setDetail(payload);
          if (options.resetFields) {
            setTitle(payload.form.title);
            setNote(payload.form.note ?? "");
          }
          const assignable = payload.customers.filter((c) => c.pricingFormId !== id);
          setCustomerId((current) => {
            const wanted = options.preferCustomer ?? current;
            return assignable.some((customer) => customer.id === wanted) ? wanted : "";
          });
        })
        .catch(() => setLoadError("ارتباط با سرور برقرار نشد.")),
    [fetchDetail, id],
  );

  useEffect(() => {
    void load({ preferCustomer: search.get("assignTo"), resetFields: true });
  }, [load, search]);

  const refreshSummary = useCallback(() => void load(), [load]);

  async function request(url: string, init: RequestInit, success: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(url, {
        ...init,
        headers: init.body ? { "Content-Type": "application/json" } : undefined,
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

  async function saveInfo() {
    const ok = await request(
      `/api/admin/pricing-forms/${id}`,
      { method: "PATCH", body: JSON.stringify({ title, note: note || null }) },
      "مشخصات فرم ذخیره شد.",
    );
    if (ok) await load({ resetFields: true });
  }

  async function assign(userId: string, formId: string | null) {
    const ok = await request(
      `/api/admin/users/${userId}/pricing-form`,
      { method: "PUT", body: JSON.stringify({ formId }) },
      formId
        ? "فرم به کاربر اختصاص داده شد؛ کاربر از همین حالا می‌تواند آن را تکمیل کند."
        : "اختصاص فرم لغو شد.",
    );
    if (ok) await load({ preferCustomer: null });
  }

  async function remove() {
    if (!window.confirm("این فرم و همه بخش‌ها و موردهایش حذف شود؟")) return;
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

  if (!detail) {
    return (
      <AdminShell>
        <p className="text-white/50">در حال بارگذاری...</p>
      </AdminShell>
    );
  }

  const { form } = detail;
  const assignable = detail.customers.filter((customer) => customer.pricingFormId !== id);
  const infoDirty = title !== form.title || note !== (form.note ?? "");

  return (
    <AdminShell>
      <Link href="/admin/pricing-forms" className="text-sm text-amber-300">
        بازگشت به فرم‌های اختصاصی
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-3xl border border-white/10 bg-[#101826]/80 p-5">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
              <Field label="عنوان فرم">
                <input
                  className={fieldClass}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </Field>
              <Field label="یادداشت داخلی" hint="فقط مدیر می‌بیند">
                <input
                  className={fieldClass}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </Field>
              <PrimaryButton type="button" onClick={saveInfo} disabled={busy || !infoDirty}>
                ذخیره مشخصات
              </PrimaryButton>
            </div>
            <p className="mt-4 text-sm leading-7 text-white/55">
              بخش‌ها و موردهای این فرم فقط مخصوص همین فرم هستند: هر مورد عنوان، قیمت، تصویر و توضیح
              خودش را دارد و تغییرات آن روی قالب پیش‌فرض یا فرم‌های دیگر اثری ندارد. تغییرات بلافاصله
              برای کاربرانی که این فرم را دارند و هنوز ثبتش نکرده‌اند اعمال می‌شود.
            </p>
          </section>

          <PricingConfigManager formId={id} onChange={refreshSummary} />
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm">
            <p className="text-xs tracking-wide text-amber-300">خلاصه فرم برای کاربر</p>
            <p className="mt-3">امکانات فعال: {toFaDigits(form.itemCount)}</p>
            <p className="mt-1">حداقل قیمت (فقط پایه): {toman(form.basePrice)}</p>
            <p className="mt-1">حداکثر قیمت (همه موارد): {toman(form.maxPrice)}</p>
            {form.configError ? (
              <p className="mt-3 text-xs text-rose-300">{form.configError}</p>
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
                  disabled={busy || !customerId || Boolean(form.configError)}
                  onClick={() => assign(customerId, id)}
                >
                  اختصاص این فرم به کاربر
                </PrimaryButton>
                {form.configError ? (
                  <p className="text-xs text-rose-300">
                    ابتدا مشکل فرم را برطرف کنید، سپس آن را اختصاص دهید.
                  </p>
                ) : null}
              </div>
            )}

            {form.users.length > 0 ? (
              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="text-xs text-white/45">کاربرانی که این فرم را دارند</p>
                <ul className="mt-2 space-y-2">
                  {form.users.map((user) => (
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

          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="w-full rounded-2xl border border-rose-400/20 px-4 py-2 text-sm text-rose-300 hover:bg-rose-400/10"
          >
            حذف فرم
          </button>
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
