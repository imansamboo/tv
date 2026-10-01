"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PriceSummary } from "@/components/pricing/PriceSummary";
import { BaseItemCard, OptionalItemCard } from "@/components/pricing/PricingItemCard";
import { PricingResult } from "@/components/pricing/PricingResult";
import { PrimaryButton } from "@/components/ui";
import {
  PRICING_FORM_PENDING_MESSAGE,
  calculatePricing,
  type PricingSectionView,
} from "@/lib/pricing";
import type { PricingQuoteView } from "@/lib/pricing-service";

type FormPayload = {
  requirementSubmitted: boolean;
  formAssigned: boolean;
  configError: string | null;
  sections: PricingSectionView[];
  quote: PricingQuoteView | null;
};

/** Keeps the tick boxes through an accidental refresh before submitting. */
const DRAFT_KEY = "fariman:pricing-selection";

function readDraft(): string[] {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeDraft(ids: string[]) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(ids));
  } catch {
    // A full or blocked sessionStorage only costs the refresh convenience.
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing to recover from.
  }
}

function Notice({ tone, children }: { tone: "info" | "warn"; children: React.ReactNode }) {
  const toneClass =
    tone === "warn"
      ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
      : "border-amber-400/30 bg-amber-400/10 text-amber-200";
  return <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClass}`}>{children}</div>;
}

export function PricingFormPending() {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#101826]/80 p-5 sm:p-8">
      <Notice tone="info">{PRICING_FORM_PENDING_MESSAGE}</Notice>
      <p className="mt-4 text-sm leading-7 text-white/60">
        تیم ما در حال بررسی نیازمندی‌های فروشگاه شماست تا فرم قیمت‌گذاری مخصوص شما را آماده کند.
        لطفاً بعداً دوباره به این صفحه سر بزنید.
      </p>
      <Link
        href="/form"
        className="mt-4 inline-block rounded-2xl border border-white/15 px-4 py-2 text-sm font-bold"
      >
        مشاهده نیازمندی‌های ثبت‌شده
      </Link>
    </section>
  );
}

export function PricingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<FormPayload | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/pricing/form")
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/login?next=/pricing");
          return null;
        }
        return (await res.json()) as FormPayload;
      })
      .then((data) => {
        if (!active || !data) return;
        if (!data.requirementSubmitted) {
          router.replace("/form");
          return;
        }
        setPayload(data);
        if (!data.quote) setSelectedIds(readDraft());
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError("دریافت فرم قیمت‌گذاری ممکن نشد. اتصال خود را بررسی کنید.");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  const sections = useMemo(() => payload?.sections ?? [], [payload]);
  const quote = payload?.quote ?? null;

  const { lines, selectedLines, totals } = useMemo(
    () => calculatePricing(sections, selectedIds),
    [sections, selectedIds],
  );

  const baseLine = lines.find((line) => line.kind === "BASE") ?? null;
  const extraLines = selectedLines.filter((line) => line.kind === "OPTIONAL");

  function toggle(itemId: string) {
    setSelectedIds((current) => {
      const next = current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId];
      writeDraft(next);
      return next;
    });
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/pricing/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedItemIds: selectedIds }),
      });
      const result = await res.json();

      if (!res.ok) {
        // A quote already exists (another tab, or a double click that raced).
        if (result.alreadySubmitted && result.quote) {
          clearDraft();
          setPayload((current) => (current ? { ...current, quote: result.quote } : current));
          router.push("/pricing/result");
          return;
        }
        if (result.requirementSubmitted === false) {
          router.replace("/form");
          return;
        }
        if (result.formAssigned === false) {
          setPayload((current) => (current ? { ...current, formAssigned: false } : current));
          return;
        }
        setError(result.error || "ثبت فرم قیمت‌گذاری ممکن نشد.");
        return;
      }

      clearDraft();
      setPayload((current) => (current ? { ...current, quote: result.quote } : current));
      router.push("/pricing/result");
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="py-20 text-center text-white/60">در حال بارگذاری فرم قیمت‌گذاری...</p>;
  }

  if (quote) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="rounded-3xl border border-white/10 bg-[#101826]/80 p-5 sm:p-8">
          <div className="mb-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            فرم قیمت‌گذاری شما ثبت شده و دیگر قابل ویرایش نیست.
          </div>
          <PricingResult quote={quote} />
        </section>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs tracking-wide text-amber-300">مرحله بعد</p>
            <p className="mt-3 text-sm leading-7 text-white/65">
              تیم ما بر اساس امکانات انتخابی شما پیشنهاد نهایی را آماده می‌کند.
            </p>
            <Link
              href="/pricing/result"
              className="mt-4 inline-block rounded-2xl bg-amber-400 px-4 py-2 text-sm font-bold text-black"
            >
              مشاهده صفحه نتیجه
            </Link>
          </aside>
        </div>
      </div>
    );
  }

  if (payload && !payload.formAssigned) {
    return <PricingFormPending />;
  }

  if (payload?.configError) {
    return (
      <section className="rounded-3xl border border-white/10 bg-[#101826]/80 p-5 sm:p-8">
        <Notice tone="warn">{payload.configError}</Notice>
        <p className="mt-4 text-sm leading-7 text-white/60">
          به‌محض آماده شدن فهرست امکانات، این صفحه قابل استفاده می‌شود. در صورت نیاز با پشتیبانی
          تماس بگیرید.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="space-y-6 rounded-3xl border border-white/10 bg-[#101826]/80 p-5 sm:p-8">
        <Notice tone="info">
          مورد پایه همیشه انتخاب‌شده است و قابل حذف نیست. با تیک زدن هر امکان اختیاری، قیمت آن به
          مجموع اضافه و با برداشتن تیک، از مجموع کم می‌شود.
        </Notice>

        {sections.map((section) => (
          <div key={section.id} className="space-y-3">
            <div>
              <h2 className="text-lg font-black">{section.title}</h2>
              {section.subtitle ? (
                <p className="mt-1 text-xs text-white/45">{section.subtitle}</p>
              ) : null}
            </div>
            {section.items.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/45">
                این بخش فعلاً موردی ندارد.
              </p>
            ) : (
              <div className="space-y-3">
                {section.items.map((item) =>
                  item.kind === "BASE" ? (
                    <BaseItemCard key={item.id} item={item} />
                  ) : (
                    <OptionalItemCard
                      key={item.id}
                      item={item}
                      selected={selectedIds.includes(item.id)}
                      disabled={submitting}
                      onToggle={() => toggle(item.id)}
                    />
                  ),
                )}
              </div>
            )}
          </div>
        ))}

        {error ? <Notice tone="warn">{error}</Notice> : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
          <p className="text-sm text-white/60">
            قیمت نهایی پس از ثبت، توسط سرور و بر اساس قیمت‌های همان لحظه محاسبه و ذخیره می‌شود.
          </p>
          <PrimaryButton type="button" onClick={submit} disabled={submitting}>
            {submitting ? "در حال ثبت..." : "ثبت نهایی و مشاهده قیمت"}
          </PrimaryButton>
        </div>
      </section>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <PriceSummary baseLine={baseLine} extraLines={extraLines} totals={totals} />
      </div>
    </div>
  );
}
