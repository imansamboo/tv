import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyRequirement } from "./form";
import { summarizeRequirements } from "./summary";

test("more completed steps increase completion and feature count", () => {
  const empty = summarizeRequirements(emptyRequirement());
  const data = emptyRequirement();
  data.contactName = "علی محمدی";
  data.storeName = "فریمان الکترونیک";
  data.businessType = "both";
  data.existingWebsite = "none";
  data.brandsToSell = ["samsung", "lg", "sony", "tcl"];
  data.sizeRanges = ["medium", "large"];
  data.productVolume = "medium";
  data.inventorySources = ["manual"];
  data.buyerFeatures = ["configurator", "filters"];
  data.paymentGateways = ["zarinpal"];
  data.deliveryMethods = ["inhome"];
  data.adminFeatures = ["orders", "inventory"];
  data.designStyle = "modern";
  const filled = summarizeRequirements(data);
  assert.ok(filled.completionPercent > empty.completionPercent);
  assert.ok(filled.featureCount > empty.featureCount);
  assert.ok(filled.highlights.some((item) => item.value.includes("فریمان")));
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
  const base = emptyRequirement();
  base.contactName = "علی محمدی";
  base.storeName = "فریمان الکترونیک";
  base.businessType = "both";
  base.existingWebsite = "none";
  const withoutNotes = summarizeRequirements(base);

  const withNotes = summarizeRequirements({
    ...base,
    storeDescription: "توضیح طولانی درباره فروشگاه که نباید درصد را تغییر دهد",
    buyerNotes: "توضیحات بیشتر",
    servicesNotes: "توضیحات خدمات",
    adminNotes: "نیازهای پنل",
    designNotes: "توضیحات طراحی",
  });

  assert.equal(withNotes.completionPercent, withoutNotes.completionPercent);
});

test("empty form does not show default service or design highlights", () => {
  const summary = summarizeRequirements(emptyRequirement());
  assert.ok(!summary.highlights.some((item) => item.label === "خدمات خرید"));
  assert.ok(!summary.highlights.some((item) => item.label === "دارایی‌های طراحی"));
});

test("buyer features appear in highlights", () => {
  const data = emptyRequirement();
  data.storeName = "تی‌وی‌لند";
  data.buyerFeatures = ["configurator", "comparison"];
  const summary = summarizeRequirements(data);
  const buyer = summary.highlights.find((item) => item.label === "تجربه خرید");
  assert.ok(buyer?.value.includes("پیکربندی"));
  assert.ok(buyer?.value.includes("مقایسه"));
});
