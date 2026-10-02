import assert from "node:assert/strict";
import { test } from "node:test";
import { requirementFormSchema } from "./requirement-form-schema";
import { SPORTS_REQUIREMENT_FORM } from "./sports-business-seed";

test("sports requirement form matches hard-coded field keys", () => {
  const keys = SPORTS_REQUIREMENT_FORM.steps.flatMap((step) => step.fields.map((field) => field.key));
  assert.deepEqual(keys, [
    "contactName",
    "storeName",
    "businessType",
    "city",
    "existingWebsite",
    "storeDescription",
    "brandsToSell",
    "sizeRanges",
    "productVolume",
    "inventorySources",
    "buyerFeatures",
    "buyerNotes",
    "paymentGateways",
    "deliveryMethods",
    "purchaseServices",
    "servicesNotes",
    "adminFeatures",
    "adminNotes",
    "designStyle",
    "referenceSites",
    "designAssets",
    "designNotes",
  ]);
  assert.equal(requirementFormSchema.safeParse(SPORTS_REQUIREMENT_FORM).success, true);
});
