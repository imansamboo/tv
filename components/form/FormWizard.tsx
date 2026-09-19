"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RequirementsSummary } from "@/components/RequirementsSummary";
import { ReviewPanel } from "@/components/form/ReviewPanel";
import {
  Field,
  fieldClass,
  optionGridClass,
  OptionButton,
  PrimaryButton,
} from "@/components/ui";
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
  OTHER_OPTION,
  PAYMENT_GATEWAYS,
  PRODUCT_VOLUME,
  SIZE_RANGES,
} from "@/lib/catalog";
import { cn } from "@/lib/cn";
import {
  FORM_SECTION_HINTS,
  FORM_STEPS,
  MULTI_SELECT_HINT,
  OTHER_ID,
  SINGLE_SELECT_HINT,
  emptyRequirement,
  hasOtherSelected,
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

const OTHER_TEXT_FIELDS = [
  "businessTypeOther",
  "existingWebsiteOther",
  "brandsOther",
  "sizeRangesOther",
  "productVolumeOther",
  "inventorySourceOther",
  "buyerFeaturesOther",
  "paymentGatewaysOther",
  "deliveryMethodsOther",
  "adminFeaturesOther",
  "designStyleOther",
  "contactName",
  "storeName",
  "storeDescription",
  "buyerNotes",
  "servicesNotes",
  "adminNotes",
  "referenceSites",
  "designNotes",
] as const;

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
    for (const key of OTHER_TEXT_FIELDS) {
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
        const submitted = payload.status === "SUBMITTED";
        setStep(submitted ? FORM_STEPS.length - 1 : (payload.currentStep ?? 0));
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
    setStatus("SUBMITTED");
    setStep(lastStep);
    if (payload.submittedAt) setSubmittedAt(payload.submittedAt);
    router.refresh();
  }

  if (loading) {
    return <p className="py-20 text-center text-white/60">در حال بارگذاری فرم...</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="rounded-3xl border border-white/10 bg-[#101826]/80 p-5 sm:p-8">
        {!locked && (
          <ol className="mb-8 grid grid-cols-7 gap-2">
            {FORM_STEPS.map((item, index) => (
              <li key={item.title}>
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
            <div className="grid gap-6">
              <Field label="نام رابط فروشگاه *" hint={FORM_SECTION_HINTS.contactName}>
                <input
                  name="contactName"
                  className={fieldClass}
                  value={data.contactName}
                  disabled={locked}
                  placeholder="مثلاً علی محمدی"
                  onChange={(event) => patch({ contactName: event.target.value })}
                />
              </Field>
              <Field label="نام فروشگاه *" hint={FORM_SECTION_HINTS.storeName}>
                <input
                  name="storeName"
                  className={fieldClass}
                  value={data.storeName}
                  disabled={locked}
                  placeholder="مثلاً فریمان الکترونیک"
                  onChange={(event) => patch({ storeName: event.target.value })}
                />
              </Field>
              <OptionSection
                label="نوع فعالیت *"
                hint={FORM_SECTION_HINTS.businessType}
                selectionHint={SINGLE_SELECT_HINT}
              />
              <div className={optionGridClass}>
                {BUSINESS_TYPES.map((item) => (
                  <OptionButton
                    key={item.id}
                    selected={data.businessType === item.id}
                    title={item.label}
                    subtitle={"hint" in item ? item.hint : undefined}
                    onClick={() => !locked && patch({ businessType: item.id })}
                  />
                ))}
              </div>
              {data.businessType === OTHER_ID && (
                <OtherTextField
                  name="businessTypeOther"
                  value={data.businessTypeOther}
                  disabled={locked}
                  placeholder="نوع فعالیت خود را بنویسید"
                  onChange={(value) => patch({ businessTypeOther: value })}
                />
              )}
              <Field label="شهر فعالیت *" hint={FORM_SECTION_HINTS.city}>
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
              <OptionSection
                label="وضعیت وب‌سایت فعلی *"
                hint={FORM_SECTION_HINTS.existingWebsite}
                selectionHint={SINGLE_SELECT_HINT}
              />
              <div className={optionGridClass}>
                {EXISTING_WEBSITE.map((item) => (
                  <OptionButton
                    key={item.id}
                    selected={data.existingWebsite === item.id}
                    title={item.label}
                    subtitle={"hint" in item ? item.hint : undefined}
                    onClick={() => !locked && patch({ existingWebsite: item.id })}
                  />
                ))}
              </div>
              {data.existingWebsite === OTHER_ID && (
                <OtherTextField
                  name="existingWebsiteOther"
                  value={data.existingWebsiteOther}
                  disabled={locked}
                  placeholder="وضعیت سایت فعلی خود را توضیح دهید"
                  onChange={(value) => patch({ existingWebsiteOther: value })}
                />
              )}
              <Field label="توضیح کوتاه درباره فروشگاه" hint={FORM_SECTION_HINTS.storeDescription}>
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
              <OptionSection
                label="برندها *"
                hint={FORM_SECTION_HINTS.brands}
                selectionHint={MULTI_SELECT_HINT}
              />
              <div className={optionGridClass}>
                {BRANDS.map((brand) => (
                  <OptionButton
                    key={brand.id}
                    selected={data.brandsToSell.includes(brand.id)}
                    title={brand.label}
                    subtitle={"hint" in brand ? brand.hint : undefined}
                    onClick={() =>
                      !locked &&
                      patch({ brandsToSell: toggleInList(data.brandsToSell, brand.id) })
                    }
                  />
                ))}
              </div>
              {hasOtherSelected(data.brandsToSell) && (
                <OtherTextField
                  name="brandsOther"
                  value={data.brandsOther}
                  disabled={locked}
                  placeholder="برندهای دیگری که می‌فروشید"
                  onChange={(value) => patch({ brandsOther: value })}
                />
              )}
              <OptionSection
                label="بازه سایز *"
                hint={FORM_SECTION_HINTS.sizeRanges}
                selectionHint={MULTI_SELECT_HINT}
              />
              <div className={optionGridClass}>
                {SIZE_RANGES.map((item) => (
                  <OptionButton
                    key={item.id}
                    selected={data.sizeRanges.includes(item.id)}
                    title={item.label}
                    subtitle={"hint" in item ? item.hint : undefined}
                    onClick={() =>
                      !locked && patch({ sizeRanges: toggleInList(data.sizeRanges, item.id) })
                    }
                  />
                ))}
              </div>
              {hasOtherSelected(data.sizeRanges) && (
                <OtherTextField
                  name="sizeRangesOther"
                  value={data.sizeRangesOther}
                  disabled={locked}
                  placeholder="بازه سایز دلخواه خود را بنویسید"
                  onChange={(value) => patch({ sizeRangesOther: value })}
                />
              )}
              <OptionSection
                label="تعداد مدل *"
                hint={FORM_SECTION_HINTS.productVolume}
                selectionHint={SINGLE_SELECT_HINT}
              />
              <div className={optionGridClass}>
                {PRODUCT_VOLUME.map((item) => (
                  <OptionButton
                    key={item.id}
                    selected={data.productVolume === item.id}
                    title={item.label}
                    subtitle={"hint" in item ? item.hint : undefined}
                    onClick={() => !locked && patch({ productVolume: item.id })}
                  />
                ))}
              </div>
              {data.productVolume === OTHER_ID && (
                <OtherTextField
                  name="productVolumeOther"
                  value={data.productVolumeOther}
                  disabled={locked}
                  placeholder="حجم تقریبی کاتالوگ خود را بنویسید"
                  onChange={(value) => patch({ productVolumeOther: value })}
                />
              )}
              <OptionSection
                label="ورود محصولات *"
                hint={FORM_SECTION_HINTS.inventorySource}
                selectionHint={MULTI_SELECT_HINT}
              />
              <div className={optionGridClass}>
                {INVENTORY_SOURCE.map((item) => (
                  <OptionButton
                    key={item.id}
                    selected={data.inventorySources.includes(item.id)}
                    title={item.label}
                    subtitle={"hint" in item ? item.hint : undefined}
                    onClick={() =>
                      !locked &&
                      patch({
                        inventorySources: toggleInList(data.inventorySources, item.id),
                      })
                    }
                  />
                ))}
              </div>
              {hasOtherSelected(data.inventorySources) && (
                <OtherTextField
                  name="inventorySourceOther"
                  value={data.inventorySourceOther}
                  disabled={locked}
                  placeholder="نحوه ورود محصولات را توضیح دهید"
                  onChange={(value) => patch({ inventorySourceOther: value })}
                />
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <OptionSection
                label="امکانات تجربه خرید *"
                hint={FORM_SECTION_HINTS.buyerFeatures}
                selectionHint={MULTI_SELECT_HINT}
              />
              <div className={optionGridClass}>
                {BUYER_FEATURES.map((item) => (
                  <OptionButton
                    key={item.id}
                    selected={data.buyerFeatures.includes(item.id)}
                    title={item.label}
                    subtitle={"hint" in item ? item.hint : undefined}
                    onClick={() =>
                      !locked &&
                      patch({ buyerFeatures: toggleInList(data.buyerFeatures, item.id) })
                    }
                  />
                ))}
              </div>
              {hasOtherSelected(data.buyerFeatures) && (
                <OtherTextField
                  name="buyerFeaturesOther"
                  value={data.buyerFeaturesOther}
                  disabled={locked}
                  placeholder="امکانات دیگری که برای مشتری می‌خواهید"
                  onChange={(value) => patch({ buyerFeaturesOther: value })}
                />
              )}
              <Field label="توضیحات بیشتر درباره تجربه خرید" hint={FORM_SECTION_HINTS.buyerNotes}>
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
              <OptionSection
                label="درگاه پرداخت *"
                hint={FORM_SECTION_HINTS.paymentGateways}
                selectionHint={MULTI_SELECT_HINT}
              />
              <div className={optionGridClass}>
                {PAYMENT_GATEWAYS.map((item) => (
                  <OptionButton
                    key={item.id}
                    selected={data.paymentGateways.includes(item.id)}
                    title={item.label}
                    subtitle={"hint" in item ? item.hint : undefined}
                    onClick={() =>
                      !locked &&
                      patch({ paymentGateways: toggleInList(data.paymentGateways, item.id) })
                    }
                  />
                ))}
              </div>
              {hasOtherSelected(data.paymentGateways) && (
                <OtherTextField
                  name="paymentGatewaysOther"
                  value={data.paymentGatewaysOther}
                  disabled={locked}
                  placeholder="روش پرداخت دیگری که می‌خواهید"
                  onChange={(value) => patch({ paymentGatewaysOther: value })}
                />
              )}
              <OptionSection
                label="روش ارسال *"
                hint={FORM_SECTION_HINTS.deliveryMethods}
                selectionHint={MULTI_SELECT_HINT}
              />
              <div className={optionGridClass}>
                {DELIVERY_METHODS.map((item) => (
                  <OptionButton
                    key={item.id}
                    selected={data.deliveryMethods.includes(item.id)}
                    title={item.label}
                    subtitle={"hint" in item ? item.hint : undefined}
                    onClick={() =>
                      !locked &&
                      patch({ deliveryMethods: toggleInList(data.deliveryMethods, item.id) })
                    }
                  />
                ))}
              </div>
              {hasOtherSelected(data.deliveryMethods) && (
                <OtherTextField
                  name="deliveryMethodsOther"
                  value={data.deliveryMethodsOther}
                  disabled={locked}
                  placeholder="روش ارسال دیگری که می‌خواهید"
                  onChange={(value) => patch({ deliveryMethodsOther: value })}
                />
              )}
              <OptionSection
                label="خدمات هنگام خرید"
                hint={FORM_SECTION_HINTS.serviceToggles}
                selectionHint={MULTI_SELECT_HINT}
              />
              <div className={optionGridClass}>
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
              <Field label="توضیحات خدمات و ارسال" hint={FORM_SECTION_HINTS.servicesNotes}>
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
              <OptionSection
                label="ابزارهای پنل مدیریت *"
                hint={FORM_SECTION_HINTS.adminFeatures}
                selectionHint={MULTI_SELECT_HINT}
              />
              <div className={optionGridClass}>
                {ADMIN_FEATURES.map((item) => (
                  <OptionButton
                    key={item.id}
                    selected={data.adminFeatures.includes(item.id)}
                    title={item.label}
                    subtitle={"hint" in item ? item.hint : undefined}
                    onClick={() =>
                      !locked &&
                      patch({ adminFeatures: toggleInList(data.adminFeatures, item.id) })
                    }
                  />
                ))}
              </div>
              {hasOtherSelected(data.adminFeatures) && (
                <OtherTextField
                  name="adminFeaturesOther"
                  value={data.adminFeaturesOther}
                  disabled={locked}
                  placeholder="ابزار مدیریتی دیگری که نیاز دارید"
                  onChange={(value) => patch({ adminFeaturesOther: value })}
                />
              )}
              <Field label="نیازهای دیگر در پنل مدیریت" hint={FORM_SECTION_HINTS.adminNotes}>
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
              <OptionSection
                label="سبک طراحی *"
                hint={FORM_SECTION_HINTS.designStyle}
                selectionHint={SINGLE_SELECT_HINT}
              />
              <div className={optionGridClass}>
                {DESIGN_STYLES.map((item) => (
                  <OptionButton
                    key={item.id}
                    selected={data.designStyle === item.id}
                    title={item.label}
                    subtitle={"hint" in item ? item.hint : undefined}
                    onClick={() => !locked && patch({ designStyle: item.id })}
                  />
                ))}
              </div>
              {data.designStyle === OTHER_ID && (
                <OtherTextField
                  name="designStyleOther"
                  value={data.designStyleOther}
                  disabled={locked}
                  placeholder="سبک طراحی دلخواه خود را بنویسید"
                  onChange={(value) => patch({ designStyleOther: value })}
                />
              )}
              <Field label="سایت‌های مرجع" hint={FORM_SECTION_HINTS.referenceSites}>
                <textarea
                  name="referenceSites"
                  className={`${fieldClass} min-h-20`}
                  value={data.referenceSites}
                  disabled={locked}
                  placeholder="مثلاً دیجی‌کالا، تکنولایف، سامسونگ ایران"
                  onChange={(event) => patch({ referenceSites: event.target.value })}
                />
              </Field>
              <OptionSection
                label="دارایی‌های برند"
                hint={FORM_SECTION_HINTS.designAssets}
                selectionHint={MULTI_SELECT_HINT}
              />
              <div className={optionGridClass}>
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
              <Field label="توضیحات طراحی" hint={FORM_SECTION_HINTS.designNotes}>
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
            <ReviewPanel data={data} completionPercent={summary.completionPercent} />
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
              {step < lastStep ? (
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
        <RequirementsSummary data={data} summary={summary} />
      </div>
    </div>
  );
}

function OptionSection({
  label,
  hint,
  selectionHint,
}: {
  label: string;
  hint: string;
  selectionHint: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-white/85">
        {label}
        <span className="font-normal text-white/45"> ({hint})</span>
      </p>
      <p className="text-xs text-white/40">{selectionHint}</p>
    </div>
  );
}

function OtherTextField({
  name,
  value,
  disabled,
  placeholder,
  onChange,
}: {
  name: string;
  value: string;
  disabled: boolean;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={`${OTHER_OPTION.label} *`} hint={OTHER_OPTION.hint}>
      <input
        name={name}
        className={fieldClass}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

