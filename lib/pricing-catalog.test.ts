import assert from "node:assert/strict";
import { test } from "node:test";
import { TV_REQUIREMENT_FORM } from "./business-seed";
import { emptyRequirement, normalizeRequirement } from "./form";
import {
  PRICING_ADDON_ENTRIES,
  PRICING_BASE_AMOUNT,
  PRICING_MAX_TOTAL,
  buildPricingSections,
} from "./pricing-catalog";
import { tvPricingCatalog } from "./pricing-catalog-tv";
import { calculatePricing } from "./pricing";

function sampleTvData() {
  const data = emptyRequirement(TV_REQUIREMENT_FORM);
  data.values.buyerFeatures = ["comparison", "filters", "installment"];
  data.values.paymentGateways = ["zarinpal", "installment"];
  data.values.deliveryMethods = ["express", "inhome"];
  data.values.adminFeatures = ["orders", "inventory", "sms"];
  data.values.inventorySources = ["excel", "api"];
  data.values.productVolume = "medium";
  data.values.designStyle = "modern";
  return data;
}

test("base package is 90 million toman for both businesses", () => {
  const sections = buildPricingSections("تلویزیون", tvPricingCatalog(), sampleTvData());
  const base = sections[0].items[0];
  assert.equal(base.kind, "BASE");
  assert.equal(base.price, PRICING_BASE_AMOUNT);
});

test("advanced addons are always included", () => {
  const minimal = emptyRequirement(TV_REQUIREMENT_FORM);
  minimal.values.buyerFeatures = ["comparison"];
  minimal.values.paymentGateways = ["zarinpal"];
  minimal.values.deliveryMethods = ["standard"];
  minimal.values.adminFeatures = ["orders"];
  minimal.values.inventorySources = ["manual"];
  minimal.values.productVolume = "small";
  minimal.values.designStyle = "modern";
  minimal.values.brandsToSell = ["samsung"];
  minimal.values.sizeRanges = ["medium"];

  const sections = buildPricingSections("تلویزیون", [...tvPricingCatalog(), ...PRICING_ADDON_ENTRIES], minimal);
  const titles = sections.flatMap((section) => section.items.map((item) => item.title));
  for (const addon of PRICING_ADDON_ENTRIES) {
    assert.ok(titles.includes(addon.title), `missing addon ${addon.title}`);
  }
});

test("optional items match requirement selections", () => {
  const data = sampleTvData();
  const sections = buildPricingSections("تلویزیون", [...tvPricingCatalog(), ...PRICING_ADDON_ENTRIES], data);
  const optionalTitles = sections
    .flatMap((section) => section.items)
    .filter((item) => item.kind === "OPTIONAL")
    .map((item) => item.title);

  assert.ok(optionalTitles.includes("مقایسه محصول"));
  assert.ok(optionalTitles.includes("فیلتر پیشرفته"));
  assert.ok(!optionalTitles.includes("مجله / راهنمای خرید"));
});

test("selecting every optional item stays within the 400 million cap", () => {
  const allOptions: Record<string, string | string[]> = {};
  for (const step of TV_REQUIREMENT_FORM.steps) {
    for (const field of step.fields) {
      if (field.type === "multi" && field.options.length > 0) {
        allOptions[field.key] = field.options.map((option) => option.id);
      }
      if (field.type === "single" && field.options.length > 0) {
        allOptions[field.key] = field.options[field.options.length - 1]!.id;
      }
    }
  }
  const data = normalizeRequirement({ values: allOptions, otherTexts: {} }, TV_REQUIREMENT_FORM);
  const sections = buildPricingSections(
    "تلویزیون",
    [...tvPricingCatalog(), ...PRICING_ADDON_ENTRIES],
    data,
  );
  const itemIds = sections.flatMap((section) => section.items.map((item) => item.id));
  const priced = sections.map((section) => ({
    id: section.id,
    title: section.title,
    subtitle: section.subtitle,
    sortOrder: 0,
    items: section.items.map((item, index) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      price: item.price,
      imageUrl: null,
      kind: item.kind,
      sortOrder: index,
    })),
  }));
  const { totals } = calculatePricing(priced, itemIds.filter((id) => id !== "item-base-package"));
  assert.ok(totals.totalPrice <= PRICING_MAX_TOTAL, `total ${totals.totalPrice} exceeds cap`);
  assert.equal(totals.basePrice, PRICING_BASE_AMOUNT);
});
