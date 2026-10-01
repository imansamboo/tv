"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { RequirementFormBuilder, cleanForm } from "@/components/admin/RequirementFormBuilder";
import { RequirementFormPreview } from "@/components/admin/RequirementFormPreview";
import { Field, fieldClass, PrimaryButton } from "@/components/ui";
import type { BusinessDetail } from "@/lib/business";
import { blankRequirementForm } from "@/lib/business-seed";
import { cn } from "@/lib/cn";
import { faDate, toFaDigits } from "@/lib/format";
import { requirementFormSchema, type RequirementForm } from "@/lib/form";

type Result = { ok: boolean; payload: { business?: BusinessDetail; error?: string } };

function BusinessEditor({ id }: { id: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<BusinessDetail | null>(null);
  const [loadError, setLoadError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [form, setForm] = useState<RequirementForm>(blankRequirementForm);
  const [tab, setTab] = useState<"build" | "preview">("build");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const apply = useCallback((business: BusinessDetail) => {
    setDetail(business);
    setName(business.name);
    setDescription(business.description ?? "");
    setActive(business.active);
    setSortOrder(business.sortOrder);
    setForm(business.form ?? blankRequirementForm());
    setDirty(false);
  }, []);

  useEffect(() => {
    fetch(`/api/admin/businesses/${id}`)
      .then(async (res): Promise<Result> => ({ ok: res.ok, payload: await res.json().catch(() => ({})) }))
      .then(({ ok, payload }) => {
        if (!ok || !payload.business) {
          setLoadError(payload.error || "دریافت کسب‌وکار ممکن نشد.");
          return;
        }
        apply(payload.business);
      })
      .catch(() => setLoadError("ارتباط با سرور برقرار نشد."));
  }, [id, apply]);

  function edit<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setDirty(true);
      setMessage(null);
    };
  }

  async function save() {
    const cleaned = cleanForm(form);
    const checked = requirementFormSchema.safeParse(cleaned);
    if (!checked.success) {
      setMessage({ tone: "error", text: checked.error.issues[0]?.message || "فرم نامعتبر است." });
      return;
    }
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/admin/businesses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, active, sortOrder, form: cleaned }),
    });
    const payload = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMessage({ tone: "error", text: payload.error || "ذخیره ممکن نشد." });
      return;
    }
    apply(payload.business);
    setMessage({ tone: "ok", text: "کسب‌وکار و فرم نیازمندی ذخیره شد." });
  }

  async function remove() {
    if (!confirm(`کسب‌وکار «${detail?.name}» حذف شود؟`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/businesses/${id}`, { method: "DELETE" });
    const payload = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMessage({ tone: "error", text: payload.error || "حذف ممکن نشد." });
      return;
    }
    router.push("/admin/businesses");
  }

  if (loadError) {
    return (
      <AdminShell>
        <p className="text-rose-300">{loadError}</p>
        <Link className="text-amber-300" href="/admin/businesses">
          بازگشت به کسب‌وکارها
        </Link>
      </AdminShell>
    );
  }
  if (!detail) {
    return (
      <AdminShell>
        <p className="py-10 text-center text-white/45">در حال بارگذاری...</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className="text-sm text-amber-300" href="/admin/businesses">
          → همه کسب‌وکارها
        </Link>
        <p className="text-xs text-white/45">
          {toFaDigits(detail.userCount)} کاربر · {toFaDigits(detail.submittedCount)} نیازمندی ثبت‌شده ·
          آخرین ویرایش {faDate(detail.updatedAt)}
        </p>
      </div>

      {detail.form === null && (
        <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          فرم ذخیره‌شده این کسب‌وکار نامعتبر بود؛ یک فرم خالی جایگزین شده است. پس از ساخت فرم، ذخیره
          کنید.
        </p>
      )}

      <section className="grid gap-4 rounded-3xl border border-white/10 bg-[#101826]/80 p-5 sm:grid-cols-2">
        <Field label="نام کسب‌وکار" hint="در لیست ثبت‌نام نمایش داده می‌شود">
          <input
            className={fieldClass}
            value={name}
            onChange={(event) => edit(setName)(event.target.value)}
          />
        </Field>
        <Field label="توضیح کوتاه" hint="اختیاری">
          <input
            className={fieldClass}
            value={description}
            onChange={(event) => edit(setDescription)(event.target.value)}
          />
        </Field>
        <Field label="ترتیب نمایش">
          <input
            className={fieldClass}
            type="number"
            min={0}
            value={sortOrder}
            onChange={(event) => edit(setSortOrder)(Math.max(0, Math.floor(Number(event.target.value) || 0)))}
          />
        </Field>
        <label className="flex items-center gap-2 self-end pb-3 text-sm text-white/80">
          <input
            type="checkbox"
            className="size-4 accent-amber-400"
            checked={active}
            onChange={(event) => edit(setActive)(event.target.checked)}
          />
          فعال (قابل انتخاب هنگام ثبت‌نام)
        </label>
      </section>

      <p className="text-sm text-white/55">
        تغییر فرم فقط روی پیش‌نویس‌ها اثر دارد؛ نیازمندی‌های ثبت‌شده با همان فرمی که کاربر پر کرده
        نمایش داده می‌شوند.
      </p>

      <div className="sticky top-16 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0b111c]/95 p-3 backdrop-blur">
        <div className="flex gap-2">
          {(
            [
              ["build", "ساخت فرم"],
              ["preview", "پیش‌نمایش"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm",
                tab === value ? "bg-amber-400 text-black" : "bg-white/10",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {message && (
            <span
              className={cn("text-sm", message.tone === "ok" ? "text-emerald-300" : "text-rose-300")}
            >
              {message.text}
            </span>
          )}
          {dirty && !message && <span className="text-xs text-amber-200">تغییرات ذخیره نشده</span>}
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="rounded-2xl border border-rose-400/30 px-4 py-3 text-sm text-rose-300 disabled:opacity-50"
          >
            حذف کسب‌وکار
          </button>
          <PrimaryButton type="button" onClick={save} disabled={busy}>
            {busy ? "در حال ذخیره..." : "ذخیره"}
          </PrimaryButton>
        </div>
      </div>

      {tab === "build" ? (
        <RequirementFormBuilder form={form} onChange={edit(setForm)} />
      ) : (
        <RequirementFormPreview key={JSON.stringify(form)} form={cleanForm(form)} />
      )}
    </AdminShell>
  );
}

export default function AdminBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <BusinessEditor id={id} />;
}
