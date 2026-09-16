"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RequirementsSummary } from "@/components/RequirementsSummary";
import { Field, fieldClass, OptionButton, PrimaryButton } from "@/components/ui";
import {
  ADMIN_FEATURES,
  BRANDS,
  BUSINESS_TYPES,
  BUYER_FEATURES,
  CITIES,
  DELIVERY_METHODS,
  DESIGN_STYLES,
  EXISTING_WEBSITE,
  INVENTORY_SOURCE,
  PAYMENT_GATEWAYS,
  PRODUCT_VOLUME,
  SIZE_RANGES,
  labelOf,
  labelsFor,
} from "@/lib/catalog";
import { cn } from "@/lib/cn";
import {
  FORM_STEPS,
  emptyRequirement,
  toggleInList,
  type RequirementData,
} from "@/lib/form";
import { summarizeRequirements, type RequirementSummary } from "@/lib/summary";
import { validateStep } from "@/lib/validate";

type FormPayload = {
  status: "DRAFT" | "SUBMITTED";
  currentStep: number;
  data: RequirementData;
  summary: RequirementSummary;
  submittedAt: string | null;
  userName?: string;
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

  const formRef = useRef<HTMLFormElement>(null);
  const summary = useMemo(() => summarizeRequirements(data), [data]);
  const locked = status === "SUBMITTED";
  const lastStep = FORM_STEPS.length - 1;

  function collectFromDom(current: RequirementData): RequirementData {
    const form = formRef.current;
    if (!form) return current;
    const fd = new FormData(form);
    const next = { ...current };
    for (const key of [
      "contactName",
      "storeName",
      "storeDescription",
      "buyerNotes",
      "servicesNotes",
      "adminNotes",
      "referenceSites",
      "designNotes",
    ] as const) {
      const value = fd.get(key);
      if (typeof value === "string") next[key] = value;
    }
    return next;
  }

  const patch = useCallback((partial: Partial<RequirementData>) => {
    setData((current) => ({ ...current, ...partial }));
  }, []);

  useEffect(() => {
    fetch("/api/form")
      .then((res) => res.json())
      .then((payload: FormPayload) => {
        setStatus(payload.status);
        setStep(payload.currentStep ?? 0);
        const incoming = payload.data;
        if (!incoming.contactName && payload.userName) {
          incoming.contactName = payload.userName;
        }
        setData(incoming);
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
    const nextData = collectFromDom(data);
    setData(nextData);
    const message = validateStep(step, nextData);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setStep((value) => Math.min(lastStep, value + 1));
  }

  async function submit() {
    const nextData = collectFromDom(data);
    setData(nextData);
    const message = validateStep(step, nextData);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    const saveRes = await fetch("/api/form", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: nextData, currentStep: step }),
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
    router.push("/form/success");
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
            این نیازمندی‌ها در {submittedAt ? new Date(submittedAt).toLocaleString("fa-IR") : "گذشته"} ثبت نهایی شده و دیگر قابل ویرایش نیست.
          </div>
        )}

        <form ref={formRef} onSubmit={(event) => event.preventDefault()}>
          <div className="mb-6">
            <p className="text-amber-300">{FORM_STEPS[step].desc}</p>
            <h2 className="mt-1 text-2xl font-black">{FORM_STEPS[step].title}</h2>
          </div>

          {step === 0 && (
            <div className="grid gap-4">
              <Field label="نام رابط فروشگاه">
                <input
                  name="contactName"
                  className={fieldClass}
                  value={data.contactName}
                  disabled={locked}
                  placeholder="مثلاً علی محمدی"
                  onChange={(event) => patch({ contactName: event.target.value })}
                />
              </Field>
              <Field label="نام فروشگاه">
                <input
                  name="storeName"
                  className={fieldClass}
                  value={data.storeName}
                  disabled={locked}
                  placeholder="مثلاً پارس الکترونیک"
                  onChange={(event) => patch({ storeName: event.target.value })}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-3">
                {BUSINESS_TYPES.map((item) => (
                  <OptionButton
                    key={item.id}
                    selected={data.businessType === item.id}
                    title={item.label}
                    subtitle={item.hint}
                    onClick={() => !locked && patch({ businessType: item.id })}
                  />
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="شهر فعالیت">
                  <select
                    name="city"
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
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {EXISTING_WEBSITE.map((item) => (
                  <OptionButton
                    key={item.id}
                    selected={data.existingWebsite === item.id}
                    title={item.label}
                    subtitle={item.hint}
                    onClick={() => !locked && patch({ existingWebsite: item.id })}
                  />
                ))}
              </div>
              <Field label="توضیح کوتاه درباره فروشگاه">
                <textarea
                  name="storeDescription"
                  className={`${fieldClass} min-h-24`}
                  value={data.storeDescription}
                  disabled={locked}
                  placeholder="چند سال است فروش تلویزیون می‌کنید؟ مشتری‌های شما بیشتر حضوری می‌خرند یا آنلاین؟"
                  onChange={(event) => patch({ storeDescription: event.target.value })}
                />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <p className="text-sm text-white/55">برندهایی که می‌خواهید در سایت بفروشید:</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {BRANDS.map((brand) => (
                  <OptionButton
                    key={brand.id}
                    selected={data.brandsToSell.includes(brand.id)}
                    title={brand.label}
                    onClick={() =>
                      !locked &&
                      patch({ brandsToSell: toggleInList(data.brandsToSell, brand.id) })
                    }
                  />
                ))}
              </div>
              <p className="text-sm text-white/55">بازه سایزهایی که می‌خواهید پوشش دهید:</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {SIZE_RANGES.map((item) => (
                  <OptionButton
                    key={item.id}
                    selected={data.sizeRanges.includes(item.id)}
                    title={item.label}
                    subtitle={item.hint}
                    onClick={() =>
                      !locked && patch({ sizeRanges: toggleInList(data.sizeRanges, item.id) })
                    }
                  />
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {PRODUCT_VOLUME.map((item) => (
                  <OptionButton
                    key={item.id}
                    selected={data.productVolume === item.id}
                    title={item.label}
                    subtitle={item.hint}
                    onClick={() => !locked && patch({ productVolume: item.id })}
                  />
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {INVENTORY_SOURCE.map((item) => (
                  <OptionButton
                    key={item.id}
                    selected={data.inventorySource === item.id}
                    title={item.label}
                    subtitle={item.hint}
                    onClick={() => !locked && patch({ inventorySource: item.id })}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">
                این بخش برای مشتری نهایی سایت است؛ نه برای خود شما. چه تجربه‌ای می‌خواهید خریدار تلویزیون داشته باشد؟
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {BUYER_FEATURES.map((item) => (
                  <OptionButton
                    key={item.id}
                    selected={data.buyerFeatures.includes(item.id)}
                    title={item.label}
                    subtitle={item.hint}
                    onClick={() =>
                      !locked &&
                      patch({ buyerFeatures: toggleInList(data.buyerFeatures, item.id) })
                    }
                  />
                ))}
              </div>
              <Field label="توضیحات بیشتر درباره تجربه خرید">
                <textarea
                  name="buyerNotes"
                  className={`${fieldClass} min-h-24`}
                  value={data.buyerNotes}
                  disabled={locked}
                  placeholder="مثلاً می‌خواهم مشتری قبل از پرداخت هزینه ارسال و نصب را ببیند"
                  onChange={(event) => patch({ buyerNotes: event.target.value })}
                />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <p className="text-sm text-white/55">درگاه‌ها و روش‌های پرداختی که می‌خواهید فعال باشد:</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {PAYMENT_GATEWAYS.map((item) => (
                  <OptionButton
                    key={item.id}
                    selected={data.paymentGateways.includes(item.id)}
                    title={item.label}
                    onClick={() =>
                      !locked &&
                      patch({ paymentGateways: toggleInList(data.paymentGateways, item.id) })
                    }
                  />
                ))}
              </div>
              <p className="text-sm text-white/55">روش‌های ارسال برای مشتری:</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {DELIVERY_METHODS.map((item) => (
                  <OptionButton
                    key={item.id}
                    selected={data.deliveryMethods.includes(item.id)}
                    title={item.label}
                    subtitle={item.hint}
                    onClick={() =>
                      !locked &&
                      patch({ deliveryMethods: toggleInList(data.deliveryMethods, item.id) })
                    }
                  />
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <OptionButton
                  selected={data.installationOnSite}
                  title="سفارش نصب در محل"
                  subtitle="مشتری هنگام خرید نصب دیواری را انتخاب کند"
                  onClick={() => !locked && patch({ installationOnSite: !data.installationOnSite })}
                />
                <OptionButton
                  selected={data.warrantyDisplay}
                  title="نمایش گارانتی"
                  subtitle="گارانتی شرکتی و طلایی روی سایت"
                  onClick={() => !locked && patch({ warrantyDisplay: !data.warrantyDisplay })}
                />
                <OptionButton
                  selected={data.transparentCheckout}
                  title="شفافیت قبل از پرداخت"
                  subtitle="همه هزینه‌ها قبل از درگاه دیده شود"
                  onClick={() => !locked && patch({ transparentCheckout: !data.transparentCheckout })}
                />
              </div>
              <Field label="توضیحات خدمات و ارسال">
                <textarea
                  name="servicesNotes"
                  className={`${fieldClass} min-h-24`}
                  value={data.servicesNotes}
                  disabled={locked}
                  placeholder="مثلاً ارسال داخل منزل فقط برای ۶۵ اینچ به بالا"
                  onChange={(event) => patch({ servicesNotes: event.target.value })}
                />
              </Field>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {ADMIN_FEATURES.map((item) => (
                  <OptionButton
                    key={item.id}
                    selected={data.adminFeatures.includes(item.id)}
                    title={item.label}
                    subtitle={item.hint}
                    onClick={() =>
                      !locked &&
                      patch({ adminFeatures: toggleInList(data.adminFeatures, item.id) })
                    }
                  />
                ))}
              </div>
              <Field label="نیازهای دیگر در پنل مدیریت">
                <textarea
                  name="adminNotes"
                  className={`${fieldClass} min-h-24`}
                  value={data.adminNotes}
                  disabled={locked}
                  placeholder="مثلاً خروجی اکسل سفارش‌ها یا اتصال به پیامک"
                  onChange={(event) => patch({ adminNotes: event.target.value })}
                />
              </Field>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {DESIGN_STYLES.map((item) => (
                  <OptionButton
                    key={item.id}
                    selected={data.designStyle === item.id}
                    title={item.label}
                    subtitle={item.hint}
                    onClick={() => !locked && patch({ designStyle: item.id })}
                  />
                ))}
              </div>
              <Field label="سایت‌های مرجع (اختیاری)">
                <textarea
                  name="referenceSites"
                  className={`${fieldClass} min-h-20`}
                  value={data.referenceSites}
                  disabled={locked}
                  placeholder="مثلاً دیجی‌کالا، تکنولایف، سامسونگ ایران"
                  onChange={(event) => patch({ referenceSites: event.target.value })}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <OptionButton
                  selected={data.hasLogo}
                  title="لوگو آماده دارم"
                  onClick={() => !locked && patch({ hasLogo: !data.hasLogo })}
                />
                <OptionButton
                  selected={data.hasBrandGuide}
                  title="راهنمای برند دارم"
                  subtitle="رنگ، فونت یا هویت بصری"
                  onClick={() => !locked && patch({ hasBrandGuide: !data.hasBrandGuide })}
                />
                <OptionButton
                  selected={data.darkMode}
                  title="تم تیره"
                  onClick={() => !locked && patch({ darkMode: !data.darkMode })}
                />
                <OptionButton
                  selected={data.mobileFirst}
                  title="اولویت موبایل"
                  subtitle="بیشتر مشتریان از گوشی می‌خرند"
                  onClick={() => !locked && patch({ mobileFirst: !data.mobileFirst })}
                />
              </div>
              <Field label="توضیحات طراحی">
                <textarea
                  name="designNotes"
                  className={`${fieldClass} min-h-24`}
                  value={data.designNotes}
                  disabled={locked}
                  placeholder="هر نکته‌ای که برای ظاهر سایت مهم است"
                  onChange={(event) => patch({ designNotes: event.target.value })}
                />
              </Field>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4 text-sm leading-7">
              <div className="grid gap-3 sm:grid-cols-2">
                <Info label="فروشگاه" value={data.storeName} />
                <Info label="رابط" value={data.contactName} />
                <Info label="نوع فعالیت" value={labelOf(data.businessType, BUSINESS_TYPES)} />
                <Info label="شهر" value={data.city} />
                <Info label="برندها" value={labelsFor(data.brandsToSell, BRANDS).join("، ")} />
                <Info label="سایزها" value={labelsFor(data.sizeRanges, SIZE_RANGES).join("، ")} />
                <Info
                  label="تجربه خرید"
                  value={labelsFor(data.buyerFeatures, BUYER_FEATURES).join("، ")}
                />
                <Info
                  label="پرداخت"
                  value={labelsFor(data.paymentGateways, PAYMENT_GATEWAYS).join("، ")}
                />
                <Info
                  label="ارسال"
                  value={labelsFor(data.deliveryMethods, DELIVERY_METHODS).join("، ")}
                />
                <Info
                  label="پنل مدیریت"
                  value={labelsFor(data.adminFeatures, ADMIN_FEATURES).join("، ")}
                />
                <Info label="طراحی" value={labelOf(data.designStyle, DESIGN_STYLES)} />
                <Info label="پیشرفت" value={`${summary.completionPercent}%`} />
              </div>
              {data.storeDescription && (
                <p className="rounded-2xl bg-white/5 p-4">{data.storeDescription}</p>
              )}
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
            {step < lastStep ? (
              <PrimaryButton type="button" onClick={goNext} disabled={locked}>
                ادامه
              </PrimaryButton>
            ) : locked ? (
              <PrimaryButton type="button" onClick={() => router.push("/form/success")}>
                مشاهده خلاصه
              </PrimaryButton>
            ) : (
              <PrimaryButton type="button" onClick={submit}>
                ثبت نهایی نیازمندی‌ها
              </PrimaryButton>
            )}
          </div>
        </form>
      </section>
      <div className="lg:sticky lg:top-24 lg:self-start">
        <RequirementsSummary data={data} summary={summary} />
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
