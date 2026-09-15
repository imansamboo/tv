"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PriceBox } from "@/components/PriceBox";
import { Field, fieldClass, OptionButton, PrimaryButton } from "@/components/ui";
import {
  BRANDS,
  CITIES,
  COVER_BY_SIZE,
  INSTALL_TYPES,
  PANELS,
  REFRESH_RATES,
  RESOLUTIONS,
  SHIPMENTS,
  SIZES,
  SMART_OS,
  USAGES,
  WARRANTY,
  suggestedOs,
} from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { FORM_STEPS, emptyRequirement, type RequirementData } from "@/lib/form";
import { toman } from "@/lib/format";
import { calculateQuote, shipmentPrice, type Quote } from "@/lib/pricing";
import { validateStep } from "@/lib/validate";

type FormPayload = {
  status: "DRAFT" | "SUBMITTED";
  currentStep: number;
  data: RequirementData;
  quote: Quote;
  submittedAt: string | null;
};

export function FormWizard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "SUBMITTED">("DRAFT");
  const [step, setStep] = useState(0);
  const [data, setData] = useState<RequirementData>(emptyRequirement);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  const quote = useMemo(() => calculateQuote(data), [data]);
  const locked = status === "SUBMITTED";

  const patch = useCallback((partial: Partial<RequirementData>) => {
    setData((current) => ({ ...current, ...partial }));
  }, []);

  useEffect(() => {
    fetch("/api/form")
      .then((res) => res.json())
      .then((payload: FormPayload) => {
        setStatus(payload.status);
        setStep(payload.currentStep ?? 0);
        setData(payload.data);
        setSubmittedAt(payload.submittedAt);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || locked) return;
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
  }, [data, step, loading, locked]);

  function goNext() {
    const message = validateStep(step, data);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setStep((value) => Math.min(6, value + 1));
  }

  async function submit() {
    const message = validateStep(step, data);
    if (message) {
      setError(message);
      return;
    }
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
    router.push("/form/pay");
  }

  if (loading) {
    return <p className="py-20 text-center text-white/60">در حال بارگذاری فرم...</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="rounded-3xl border border-white/10 bg-[#101826]/80 p-5 sm:p-8">
        <ol className="mb-8 grid grid-cols-7 gap-2">
          {FORM_STEPS.map((item, index) => (
            <li key={item.title}>
              <button
                type="button"
                onClick={() => !locked && setStep(index)}
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

        {locked && (
          <div className="mb-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            این درخواست در {submittedAt ? new Date(submittedAt).toLocaleString("fa-IR") : "گذشته"} ثبت نهایی شده و دیگر قابل ویرایش نیست.
          </div>
        )}

        <div className="mb-6">
          <p className="text-amber-300">{FORM_STEPS[step].desc}</p>
          <h2 className="mt-1 text-2xl font-black">{FORM_STEPS[step].title}</h2>
        </div>

        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نام و نام خانوادگی">
              <input
                className={fieldClass}
                value={data.fullName}
                disabled={locked}
                onChange={(event) => patch({ fullName: event.target.value })}
              />
            </Field>
            <Field label="موبایل" hint="برای هماهنگی ارسال و نصب">
              <input
                className={fieldClass}
                value={data.phone}
                disabled={locked}
                onChange={(event) => patch({ phone: event.target.value })}
                placeholder="0912xxxxxxx"
              />
            </Field>
            <Field label="شهر">
              <select
                className={fieldClass}
                value={data.city}
                disabled={locked}
                onChange={(event) => patch({ city: event.target.value })}
              >
                {CITIES.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="کد پستی (اختیاری)">
              <input
                className={fieldClass}
                value={data.postalCode}
                disabled={locked}
                onChange={(event) => patch({ postalCode: event.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="آدرس کامل تحویل">
                <textarea
                  className={`${fieldClass} min-h-24`}
                  value={data.address}
                  disabled={locked}
                  onChange={(event) => patch({ address: event.target.value })}
                />
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SIZES.map((size) => (
              <OptionButton
                key={size.inches}
                selected={data.sizeInches === size.inches}
                title={size.label}
                subtitle={`${size.hint} · فاصله دید ${size.viewing}`}
                meta={toman(
                  calculateQuote({ ...data, sizeInches: size.inches }).tvPrice ||
                    size.basePrice,
                )}
                onClick={() => !locked && patch({ sizeInches: size.inches })}
              />
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {BRANDS.map((brand) => (
                <OptionButton
                  key={brand.id}
                  selected={data.brand === brand.id}
                  title={brand.label}
                  subtitle={brand.hint}
                  meta={
                    data.sizeInches
                      ? toman(calculateQuote({ ...data, brand: brand.id }).tvPrice)
                      : undefined
                  }
                  onClick={() =>
                    !locked &&
                    patch({
                      brand: brand.id,
                      smartOs: data.smartOs || suggestedOs(brand.id),
                    })
                  }
                />
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {PANELS.map((panel) => (
                <OptionButton
                  key={panel.id}
                  selected={data.panelType === panel.id}
                  title={panel.label}
                  subtitle={panel.hint}
                  onClick={() => !locked && patch({ panelType: panel.id })}
                />
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {RESOLUTIONS.map((item) => (
                <OptionButton
                  key={item.id}
                  selected={data.resolution === item.id}
                  title={item.label}
                  subtitle={item.hint}
                  onClick={() => !locked && patch({ resolution: item.id })}
                />
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SMART_OS.map((item) => (
                <OptionButton
                  key={item.id}
                  selected={data.smartOs === item.id}
                  title={item.label}
                  onClick={() => !locked && patch({ smartOs: item.id })}
                />
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {REFRESH_RATES.map((item) => (
                <OptionButton
                  key={item.id}
                  selected={data.refreshRate === item.id}
                  title={item.label}
                  subtitle={item.hint}
                  onClick={() => !locked && patch({ refreshRate: item.id })}
                />
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {USAGES.map((item) => (
                <OptionButton
                  key={item.id}
                  selected={data.usage === item.id}
                  title={item.label}
                  onClick={() => !locked && patch({ usage: item.id })}
                />
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <OptionButton
                selected={data.hdr}
                title="HDR / Dolby Vision"
                subtitle="رنگ و کنتراست بهتر برای فیلم"
                onClick={() => !locked && patch({ hdr: !data.hdr })}
              />
              <OptionButton
                selected={data.hdmi21}
                title="HDMI 2.1 برای کنسول"
                subtitle="مناسب PS5 و Xbox Series"
                onClick={() => !locked && patch({ hdmi21: !data.hdmi21 })}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {INSTALL_TYPES.map((item) => (
                <OptionButton
                  key={item.id}
                  selected={data.installType === item.id}
                  title={item.label}
                  subtitle={item.hint}
                  onClick={() => !locked && patch({ installType: item.id })}
                />
              ))}
            </div>
            <Field label="فاصله تقریبی نشستن تا تلویزیون">
              <input
                className={fieldClass}
                disabled={locked}
                value={data.viewingDistance}
                placeholder="مثلاً ۲٫۵ متر"
                onChange={(event) => patch({ viewingDistance: event.target.value })}
              />
            </Field>
            <Field label="توضیح مسیر حمل و فضای نصب">
              <textarea
                className={`${fieldClass} min-h-24`}
                disabled={locked}
                value={data.roomNotes}
                placeholder="آسانسور، راهرو باریک، دیوار گچی و ..."
                onChange={(event) => patch({ roomNotes: event.target.value })}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <OptionButton
                selected={data.professionalInstall}
                title="نصب توسط تکنسین"
                subtitle={data.installType === "wall" ? toman(1_800_000) : toman(450_000)}
                onClick={() => !locked && patch({ professionalInstall: !data.professionalInstall })}
              />
              <OptionButton
                selected={data.wallMountKit}
                title="براکت دیواری"
                subtitle={toman(980_000)}
                onClick={() => !locked && patch({ wallMountKit: !data.wallMountKit })}
              />
              <OptionButton
                selected={data.oldTvHaulAway}
                title="جمع‌آوری تلویزیون قبلی"
                subtitle={toman(650_000)}
                onClick={() => !locked && patch({ oldTvHaulAway: !data.oldTvHaulAway })}
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">
              این مرحله هزینه‌های قبل از درگاه پرداخت است: ارسال، کاور محافظ صفحه، و بیمه حمل. با انتخاب هر گزینه مبلغ نهایی همان لحظه به‌روز می‌شود.
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {SHIPMENTS.map((item) => (
                <OptionButton
                  key={item.id}
                  selected={data.shipmentType === item.id}
                  title={item.label}
                  subtitle={item.hint}
                  meta={
                    data.sizeInches
                      ? toman(shipmentPrice(data.sizeInches, item.id, data.city))
                      : "ابتدا سایز را انتخاب کنید"
                  }
                  onClick={() => !locked && patch({ shipmentType: item.id })}
                />
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <OptionButton
                selected={data.coverProtection}
                title="کاور محافظ (Covering)"
                subtitle="محافظ صفحه و لبه‌ها هنگام حمل و نصب"
                meta={
                  data.sizeInches
                    ? toman(COVER_BY_SIZE[data.sizeInches] ?? 680_000)
                    : undefined
                }
                onClick={() => !locked && patch({ coverProtection: !data.coverProtection })}
              />
              <OptionButton
                selected={data.transferInsurance}
                title="بیمه حمل و نقل"
                subtitle="خسارت احتمالی در مسیر تا محل شما"
                meta={data.sizeInches ? "۲٫۵٪ قیمت تلویزیون (حداقل ۳۵۰ هزار)" : undefined}
                onClick={() => !locked && patch({ transferInsurance: !data.transferInsurance })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {WARRANTY.map((item) => (
                <OptionButton
                  key={item.id}
                  selected={data.extendedWarranty === item.id}
                  title={item.label}
                  subtitle={item.hint}
                  onClick={() => !locked && patch({ extendedWarranty: item.id })}
                />
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4 text-sm leading-7">
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="نام" value={data.fullName} />
              <Info label="موبایل" value={data.phone} />
              <Info label="شهر" value={data.city} />
              <Info label="آدرس" value={data.address} />
              <Info
                label="تلویزیون"
                value={`${SIZES.find((item) => item.inches === data.sizeInches)?.label || "—"} / ${BRANDS.find((item) => item.id === data.brand)?.label || "—"} / ${PANELS.find((item) => item.id === data.panelType)?.label || "—"}`}
              />
              <Info
                label="کاربری"
                value={USAGES.find((item) => item.id === data.usage)?.label || "—"}
              />
            </div>
            <ul className="rounded-2xl bg-white/5 p-4">
              <li className="flex justify-between py-1">
                <span>قیمت تلویزیون</span>
                <span>{toman(quote.tvPrice)}</span>
              </li>
              {quote.extras.map((line) => (
                <li key={line.key} className="flex justify-between py-1 text-amber-200">
                  <span>{line.label}</span>
                  <span>{toman(line.amount)}</span>
                </li>
              ))}
              <li className="mt-2 flex justify-between border-t border-white/10 pt-2 text-base font-bold">
                <span>مبلغ نهایی قبل از درگاه</span>
                <span>{toman(quote.total)}</span>
              </li>
            </ul>
          </div>
        )}

        {error && <p className="mt-5 text-sm text-rose-400">{error}</p>}

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
            {saving ? "در حال ذخیره..." : savedAt ? "پیش‌نویس ذخیره شد؛ بعداً می‌توانید ادامه دهید." : ""}
          </div>
          {step < 6 ? (
            <PrimaryButton type="button" onClick={goNext} disabled={locked && step === 6}>
              ادامه
            </PrimaryButton>
          ) : locked ? (
            <PrimaryButton type="button" onClick={() => router.push("/form/success")}>
              مشاهده رسید
            </PrimaryButton>
          ) : (
            <PrimaryButton type="button" onClick={submit}>
              ثبت نهایی و ورود به درگاه
            </PrimaryButton>
          )}
        </div>
      </section>
      <div className="lg:sticky lg:top-24 lg:self-start">
        <PriceBox data={data} quote={quote} />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-1 font-medium">{value || "—"}</p>
    </div>
  );
}
