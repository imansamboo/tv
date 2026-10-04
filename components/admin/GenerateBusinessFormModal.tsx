"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Field, fieldClass, PrimaryButton } from "@/components/ui";

type JobStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";

type JobView = {
  id: string;
  businessType: string;
  status: JobStatus;
  error: string | null;
  businessId: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
};

export function GenerateBusinessFormModal({ open, onClose, onComplete }: Props) {
  const [businessType, setBusinessType] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [job, setJob] = useState<JobView | null>(null);

  function resetForm() {
    setBusinessType("");
    setNotes("");
    setBusy(false);
    setError("");
    setJob(null);
  }

  function closeModal() {
    resetForm();
    onClose();
  }

  useEffect(() => {
    if (!job || job.status === "SUCCEEDED" || job.status === "FAILED") return;
    const timer = window.setInterval(async () => {
      const res = await fetch(`/api/admin/businesses/generate/${job.id}`, { cache: "no-store" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) return;
      const next = payload.job as JobView;
      setJob(next);
      if (next.status === "SUCCEEDED") {
        onComplete?.();
      }
    }, 4000);
    return () => window.clearInterval(timer);
  }, [job, onComplete]);

  if (!open) return null;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/businesses/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessType, notes: notes || undefined }),
    });
    const payload = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(payload.error || "شروع تولید فرم ممکن نشد.");
      return;
    }
    setJob({
      id: payload.jobId,
      businessType,
      status: "PENDING",
      error: null,
      businessId: null,
    });
  }

  const running = job?.status === "PENDING" || job?.status === "RUNNING";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg space-y-4 rounded-3xl border border-white/10 bg-[#101826] p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black">تولید فرم با هوش مصنوعی</h2>
            <p className="mt-2 text-sm leading-7 text-white/60">
              نوع کسب‌وکار را بنویسید تا فرم نیازمندی اختصاصی با Cursor API ساخته شود. کسب‌وکار جدید
              ابتدا غیرفعال ذخیره می‌شود تا در فرم‌ساز بازبینی کنید.
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm text-white/50 hover:text-white"
            onClick={closeModal}
            aria-label="بستن"
          >
            ✕
          </button>
        </div>

        {!job ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="نوع کسب‌وکار" hint="مثلاً فروشگاه آنلاین داروخانه">
              <input
                className={fieldClass}
                value={businessType}
                onChange={(event) => setBusinessType(event.target.value)}
                placeholder="فروشگاه آنلاین داروخانه"
                required
                minLength={2}
                maxLength={100}
              />
            </Field>
            <Field label="توضیحات اضافه" hint="اختیاری">
              <textarea
                className={`${fieldClass} min-h-24`}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={1000}
                placeholder="مثلاً تمرکز روی نسخه الکترونیک و ارسال سرد"
              />
            </Field>
            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
            <div className="flex flex-wrap gap-3">
              <PrimaryButton type="submit" disabled={busy}>
                {busy ? "در حال ارسال..." : "شروع تولید"}
              </PrimaryButton>
              <button
                type="button"
                className="rounded-2xl border border-white/15 px-5 py-3 text-sm text-white/70"
                onClick={closeModal}
              >
                انصراف
              </button>
            </div>
          </form>
        ) : running ? (
          <div className="space-y-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
            <p className="text-sm font-medium text-amber-100">در حال تولید فرم «{job.businessType}»…</p>
            <p className="text-xs leading-6 text-white/55">
              این کار ممکن است چند دقیقه طول بکشد. پنجره را باز نگه دارید یا بعداً از لیست کسب‌وکارها
              وضعیت را بررسی کنید.
            </p>
          </div>
        ) : job.status === "SUCCEEDED" && job.businessId ? (
          <div className="space-y-4">
            <p className="text-sm text-emerald-300">فرم آماده است. کسب‌وکار به‌صورت غیرفعال ذخیره شد.</p>
            <Link
              className="inline-block rounded-2xl bg-amber-400 px-5 py-3 text-sm font-bold text-black"
              href={`/admin/businesses/${job.businessId}`}
              onClick={closeModal}
            >
              بازبینی در فرم‌ساز
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-rose-400">ناموفق: {job.error || "خطای نامشخص"}</p>
            <button
              type="button"
              className="rounded-2xl border border-white/15 px-5 py-3 text-sm text-white/70"
              onClick={() => setJob(null)}
            >
              دوباره تلاش
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
