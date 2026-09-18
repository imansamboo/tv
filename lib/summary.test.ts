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
  data.brandsToSell = ["samsung", "lg"];
  data.sizeRanges = ["medium", "large"];
  data.productVolume = "medium";
  data.inventorySource = "manual";
  data.buyerFeatures = ["configurator", "filters"];
  data.paymentGateways = ["zarinpal"];
  data.deliveryMethods = ["inhome"];
  data.adminFeatures = ["orders"];
  data.designStyle = "modern";
  const filled = summarizeRequirements(data);
  assert.ok(filled.completionPercent > empty.completionPercent);
  assert.ok(filled.featureCount > empty.featureCount);
  assert.ok(filled.highlights.some((item) => item.value.includes("فریمان")));
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

test("configurator selection appears in highlights", () => {
  const data = emptyRequirement();
  data.storeName = "تی‌وی‌لند";
  data.buyerFeatures = ["configurator"];
  const summary = summarizeRequirements(data);
  assert.ok(summary.highlights.some((item) => item.value.includes("پیکربندی")));
});
