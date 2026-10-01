"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RequirementsSummary } from "@/components/RequirementsSummary";
import { BusinessPicker } from "@/components/form/BusinessPicker";
import { ReviewPanel } from "@/components/form/ReviewPanel";
import { StepFields } from "@/components/form/StepFields";
import { PrimaryButton } from "@/components/ui";
import type { BusinessOption } from "@/lib/business";
import { cn } from "@/lib/cn";
import { REVIEW_STEP, type RequirementData, type RequirementForm } from "@/lib/form";
import { PRICING_FORM_PENDING_MESSAGE } from "@/lib/pricing";
import { summarizeRequirements } from "@/lib/summary";
import { validateStep } from "@/lib/validate";

type FormPayload =
  | { error: string }
  | { needsBusiness: true; businesses: BusinessOption[] }
  | {
      business: { id: string; name: string };
      form: RequirementForm;
      status: "DRAFT" | "SUBMITTED";
      currentStep: number;
      data: RequirementData;
      submittedAt: string | null;
      pricingFormAssigned: boolean;
    };

type Loaded = {
  business: { id: string; name: string };
  form: RequirementForm;
  pricingFormAssigned: boolean;
};

export function FormWizard() {
  const router = useRouter();
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [businesses, setBusinesses] = useState<BusinessOption[] | null>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "SUBMITTED">("DRAFT");
  const [step, setStep] = useState(0);
  const [data, setData] = useState<RequirementData>({ values: {}, other: {} });
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  const form = loaded?.form;
  const summary = useMemo(() => (form ? summarizeRequirements(form, data) : null), [form, data]);
  const locked = status === "SUBMITTED";
  const reviewStep = form?.steps.length ?? 0;

  useEffect(() => {
    fetch("/api/form")
      .then((res) => res.json())
      .then((payload: FormPayload) => {
        if ("error" in payload) {
          setLoadError(payload.error);
          return;
        }
        if ("needsBusiness" in payload) {
          setBusinesses(payload.businesses);
          setLoaded(null);
          return;
        }
        const submitted = payload.status === "SUBMITTED";
        setBusinesses(null);
        setLoaded({
          business: payload.business,
          form: payload.form,
          pricingFormAssigned: payload.pricingFormAssigned,
        });
        setStatus(payload.status);
        setStep(submitted ? payload.form.steps.length : (payload.currentStep ?? 0));
        setData(payload.data);
        setSubmittedAt(payload.submittedAt);
      })
      .catch(() => setLoadError("بارگذاری فرم ممکن نشد."))
      .finally(() => setLoading(false));
  }, [reloadKey]);

  useEffect(() => {
    if (loading || locked || !loaded) return;
    const timer = setTimeout(async () => {
      setSaving(true);
      const res = await fetch("/api/form", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, currentStep: step }),
      });
      if (res.ok) setSavedAt(new Date().toISOString());
      setSaving(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [data, step, loading, locked, loaded]);

  if (loading) {
    return <p className="py-20 text-center text-white/60">در حال بارگذاری فرم...</p>;
  }
  if (loadError) {
    return <p className="py-20 text-center text-rose-400">{loadError}</p>;
  }
  if (businesses) {
    return (
      <BusinessPicker
        businesses={businesses}
        onSelected={() => {
          setLoading(true);
          setReloadKey((key) => key + 1);
        }}
      />
    );
  }
  if (!loaded || !form || !summary) return null;

  const steps = [...form.steps.map((s) => ({ title: s.title, description: s.description })), REVIEW_STEP];
  const current = steps[step] ?? REVIEW_STEP;

  function goNext() {
    if (!form) return;
    const message = validateStep(form, step, data);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setStep((value) => Math.min(reviewStep, value + 1));
  }

  async function submit() {
    setError("");
    const saveRes = await fetch("/api/form", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, currentStep: step }),
    });
    if (!saveRes.ok) {
      const payload = await saveRes.json();
      setError(payload.error || "ذخیره ممکن نشد.");
      return;
    }
    const res = await fetch("/api/form/submit", { method: "POST" });
    const payload = await res.json();
    if (!res.ok) {
      setError(payload.error || "ثبت نهایی ممکن نشد.");
      if (typeof payload.step === "number") setStep(payload.step);
      return;
    }
    setStatus("SUBMITTED");
    setStep(reviewStep);
    if (payload.submittedAt) setSubmittedAt(payload.submittedAt);
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="rounded-3xl border border-white/10 bg-[#101826]/80 p-5 sm:p-8">
        {!locked && (
          <ol
            className="mb-8 grid gap-2"
            style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
          >
            {steps.map((item, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => setStep(index)}
                  className={cn(
                    "flex w-full flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px]",
                    index === step
                      ? "bg-amber-400 text-black"
                      : index < step
                        ? "bg-white/10 text-white"
                        : "text-white/35",
                  )}
                >
                  <span className="font-bold">{index + 1}</span>
                  <span className="hidden sm:block">{item.title}</span>
                </button>
              </li>
            ))}
          </ol>
        )}

        {locked && (
          <div className="mb-6 space-y-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            <p>
              این نیازمندی‌ها در {submittedAt ? new Date(submittedAt).toLocaleString("fa-IR") : "گذشته"} ثبت نهایی شده و دیگر قابل ویرایش نیست.
            </p>
            {loaded.pricingFormAssigned ? (
              <Link
                href="/pricing"
                className="inline-block rounded-2xl bg-amber-400 px-4 py-2 text-xs font-bold text-black"
              >
                مرحله بعد: انتخاب امکانات و تعیین قیمت
              </Link>
            ) : (
              <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-amber-200">
                {PRICING_FORM_PENDING_MESSAGE}
              </p>
            )}
          </div>
        )}

        <form onSubmit={(event) => event.preventDefault()}>
          <div className="mb-6">
            {current.description && <p className="text-amber-300">{current.description}</p>}
            <h2 className="mt-1 text-2xl font-black">{current.title}</h2>
          </div>

          {step < reviewStep ? (
            <StepFields step={form.steps[step]} data={data} disabled={locked} onChange={setData} />
          ) : (
            <ReviewPanel form={form} data={data} completionPercent={summary.completionPercent} />
          )}

          {error && <p className="mt-5 text-sm text-rose-400">{error}</p>}

          {!locked && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={step === 0}
                onClick={() => {
                  setError("");
                  setStep((value) => Math.max(0, value - 1));
                }}
                className="rounded-2xl border border-white/15 px-5 py-3 text-sm disabled:opacity-30"
              >
                مرحله قبل
              </button>
              <div className="text-xs text-white/40">
                {saving
                  ? "در حال ذخیره..."
                  : savedAt
                    ? "پیش‌نویس ذخیره شد؛ بعداً می‌توانید ادامه دهید."
                    : ""}
              </div>
              {step < reviewStep ? (
                <PrimaryButton type="button" onClick={goNext}>
                  ادامه
                </PrimaryButton>
              ) : (
                <PrimaryButton type="button" onClick={submit}>
                  ثبت نهایی نیازمندی‌ها
                </PrimaryButton>
              )}
            </div>
          )}
        </form>
      </section>
      <div className="lg:sticky lg:top-24 lg:self-start">
        <RequirementsSummary summary={summary} businessName={loaded.business.name} />
      </div>
    </div>
  );
}
