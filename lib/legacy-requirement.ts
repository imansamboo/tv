import type { AnswerValue, RequirementData } from "./form";

/**
 * Converts answers saved by the old hard-coded TV form (one flat object with
 * `…Other` texts and boolean toggles) to the field-keyed shape. Only the seed
 * script uses this, to migrate existing rows once.
 */

const LEGACY_OTHER_KEYS: Record<string, string> = {
  businessType: "businessTypeOther",
  existingWebsite: "existingWebsiteOther",
  brandsToSell: "brandsOther",
  sizeRanges: "sizeRangesOther",
  productVolume: "productVolumeOther",
  inventorySources: "inventorySourceOther",
  buyerFeatures: "buyerFeaturesOther",
  paymentGateways: "paymentGatewaysOther",
  deliveryMethods: "deliveryMethodsOther",
  adminFeatures: "adminFeaturesOther",
  designStyle: "designStyleOther",
};

const LEGACY_TOGGLES: Record<string, string[]> = {
  purchaseServices: ["installationOnSite", "warrantyDisplay", "transparentCheckout"],
  designAssets: ["hasLogo", "hasBrandGuide", "darkMode", "mobileFirst"],
};

const LEGACY_TEXT_KEYS = [
  "contactName",
  "storeName",
  "businessType",
  "city",
  "existingWebsite",
  "storeDescription",
  "productVolume",
  "buyerNotes",
  "servicesNotes",
  "adminNotes",
  "designStyle",
  "referenceSites",
  "designNotes",
];

const LEGACY_LIST_KEYS = [
  "brandsToSell",
  "sizeRanges",
  "inventorySources",
  "buyerFeatures",
  "paymentGateways",
  "deliveryMethods",
  "adminFeatures",
];

export function isLegacyRequirement(raw: unknown): raw is Record<string, unknown> {
  return Boolean(raw) && typeof raw === "object" && !("values" in (raw as object));
}

export function convertLegacyRequirement(raw: Record<string, unknown>): RequirementData {
  const values: Record<string, AnswerValue> = {};
  const other: Record<string, string> = {};

  for (const key of LEGACY_TEXT_KEYS) {
    if (typeof raw[key] === "string") values[key] = raw[key];
  }
  for (const key of LEGACY_LIST_KEYS) {
    if (Array.isArray(raw[key])) values[key] = raw[key].filter((v) => typeof v === "string");
  }
  // The very first version stored a single `inventorySource` string.
  if (!values.inventorySources && typeof raw.inventorySource === "string" && raw.inventorySource) {
    values.inventorySources = [raw.inventorySource];
  }
  for (const [key, ids] of Object.entries(LEGACY_TOGGLES)) {
    values[key] = ids.filter((id) => raw[id] === true);
  }
  for (const [key, otherKey] of Object.entries(LEGACY_OTHER_KEYS)) {
    if (typeof raw[otherKey] === "string" && raw[otherKey]) other[key] = raw[otherKey];
  }
  return { values, other };
}
