import assert from "node:assert/strict";
import { test } from "node:test";
import { TV_REQUIREMENT_FORM as form, blankRequirementForm } from "./business-seed";
import {
  customerInfo,
  emptyRequirement,
  formatAnswer,
  normalizeRequirement,
  requirementFormSchema,
  type RequirementData,
} from "./form";
import { convertLegacyRequirement, isLegacyRequirement } from "./legacy-requirement";
import { summarizeRequirements } from "./summary";
import { firstInvalidStep, validateStep } from "./validate";

function withValues(values: RequirementData["values"], other: RequirementData["other"] = {}) {
  const data = emptyRequirement(form);
  return { values: { ...data.values, ...values }, other };
}

const STORE_STEP = {
  contactName: "علی محمدی",
  storeName: "دُکون بازار الکترونیک",
  businessType: "both",
  existingWebsite: "none",
};

test("more completed steps increase completion and feature count", () => {
  const empty = summarizeRequirements(form, emptyRequirement(form));
  const data = withValues({
    ...STORE_STEP,
    brandsToSell: ["samsung", "lg", "sony", "tcl"],
    sizeRanges: ["medium", "large"],
    productVolume: "medium",
    inventorySources: ["manual"],
    buyerFeatures: ["configurator", "filters"],
    paymentGateways: ["zarinpal"],
    deliveryMethods: ["inhome"],
    adminFeatures: ["orders", "inventory"],
    designStyle: "modern",
  });
  const filled = summarizeRequirements(form, data);
  assert.ok(filled.completionPercent > empty.completionPercent);
  assert.ok(filled.featureCount > empty.featureCount);
  assert.ok(filled.highlights.some((item) => item.value.includes("دُکون بازار")));
  const brands = filled.highlights.find((item) => item.label === "برندها");
  assert.ok(brands?.value.includes("سونی"));
  assert.ok(brands?.value.includes("تی‌سی‌ال"));
  const admin = filled.highlights.find((item) => item.label === "پنل مدیریت");
  assert.ok(admin?.value.includes("مدیریت سفارش"));
  assert.ok(admin?.value.includes("گزارش موجودی"));
  const volume = filled.highlights.find((item) => item.label === "تعداد مدل");
  assert.ok(volume?.value.includes("۵۰"));
});

test("description text does not affect completion percent", () => {
  const base = withValues(STORE_STEP);
  const withoutNotes = summarizeRequirements(form, base);
  const withNotes = summarizeRequirements(
    form,
    withValues({
      ...STORE_STEP,
      storeDescription: "توضیح طولانی درباره فروشگاه که نباید درصد را تغییر دهد",
      buyerNotes: "توضیحات بیشتر",
      servicesNotes: "توضیحات خدمات",
      adminNotes: "نیازهای پنل",
      designNotes: "توضیحات طراحی",
    }),
  );
  assert.equal(withNotes.completionPercent, withoutNotes.completionPercent);
});

test("empty form does not show default service or design highlights", () => {
  const summary = summarizeRequirements(form, emptyRequirement(form));
  assert.ok(!summary.highlights.some((item) => item.label === "خدمات خرید"));
  assert.ok(!summary.highlights.some((item) => item.label === "دارایی‌های طراحی"));
});

test("buyer features appear in highlights", () => {
  const data = withValues({ storeName: "تی‌وی‌لند", buyerFeatures: ["configurator", "comparison"] });
  const summary = summarizeRequirements(form, data);
  const buyer = summary.highlights.find((item) => item.label === "تجربه خرید");
  assert.ok(buyer?.value.includes("پیکربندی"));
  assert.ok(buyer?.value.includes("مقایسه"));
});

test("the TV form keeps every step and field type of the original form", () => {
  assert.equal(form.steps.length, 6);
  const types = new Set(form.steps.flatMap((step) => step.fields.map((field) => field.type)));
  assert.deepEqual([...types].sort(), ["multi", "select", "single", "text", "textarea"]);
  assert.equal(emptyRequirement(form).values.city, "تهران");
});

test("selecting «other» requires a description", () => {
  const data = withValues({ ...STORE_STEP, businessType: "other" });
  assert.match(validateStep(form, 0, data) ?? "", /توضیح کوتاه/);
  data.other.businessType = "فروش عمده";
  assert.equal(validateStep(form, 0, data), null);
  const field = form.steps[0].fields.find((f) => f.key === "businessType")!;
  assert.equal(formatAnswer(field, data), "سایر (فروش عمده)");
});

test("required fields block submission at the first invalid step", () => {
  const invalid = firstInvalidStep(form, withValues(STORE_STEP));
  assert.equal(invalid?.step, 1);
});

test("normalize drops unknown keys and options", () => {
  const data = normalizeRequirement(
    { values: { brandsToSell: ["samsung", "nope"], unknown: "x", city: "atlantis" }, other: {} },
    form,
  );
  assert.deepEqual(data.values.brandsToSell, ["samsung"]);
  assert.equal("unknown" in data.values, false);
  assert.equal(data.values.city, "تهران");
});

test("form schema rejects duplicate keys and empty choice fields", () => {
  const blank = blankRequirementForm();
  const duplicate = structuredClone(blank);
  duplicate.steps[0].fields[1].key = duplicate.steps[0].fields[0].key;
  assert.equal(requirementFormSchema.safeParse(duplicate).success, false);

  const noOptions = structuredClone(blank);
  noOptions.steps[0].fields.push({ ...noOptions.steps[0].fields[0], key: "pick", type: "multi", role: undefined });
  assert.equal(requirementFormSchema.safeParse(noOptions).success, false);
  assert.equal(requirementFormSchema.safeParse(blank).success, true);
});

test("legacy flat answers convert to the TV form", () => {
  const legacy = {
    contactName: "سارا",
    storeName: "تلویزیون سارا",
    businessType: "other",
    businessTypeOther: "عمده‌فروشی",
    city: "مشهد",
    brandsToSell: ["lg", "other"],
    brandsOther: "شیائومی",
    inventorySource: "excel",
    installationOnSite: true,
    warrantyDisplay: false,
    hasLogo: true,
    darkMode: true,
  };
  assert.ok(isLegacyRequirement(legacy));
  const data = normalizeRequirement(convertLegacyRequirement(legacy), form);
  assert.deepEqual(data.values.brandsToSell, ["lg", "other"]);
  assert.equal(data.other.brandsToSell, "شیائومی");
  assert.equal(data.other.businessType, "عمده‌فروشی");
  assert.deepEqual(data.values.purchaseServices, ["installationOnSite"]);
  assert.deepEqual(data.values.designAssets, ["hasLogo", "darkMode"]);
  assert.deepEqual(customerInfo(form, data), {
    contactName: "سارا",
    storeName: "تلویزیون سارا",
    city: "مشهد",
  });
  assert.equal(isLegacyRequirement(data), false);
});
