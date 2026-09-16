import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyRequirement } from "./form";
import { summarizeRequirements } from "./summary";

test("more selections increase completion and feature count", () => {
  const empty = summarizeRequirements(emptyRequirement());
  const data = emptyRequirement();
  data.storeName = "پارس الکترونیک";
  data.businessType = "both";
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
  assert.ok(filled.highlights.some((item) => item.includes("پارس")));
});

test("configurator selection appears in highlights", () => {
  const data = emptyRequirement();
  data.storeName = "تی‌وی‌لند";
  data.buyerFeatures = ["configurator"];
  const summary = summarizeRequirements(data);
  assert.ok(summary.highlights.some((item) => item.includes("پیکربندی")));
});
