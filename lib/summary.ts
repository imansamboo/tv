import {
  BRANDS,
  DELIVERY_METHODS,
  DESIGN_STYLES,
  PAYMENT_GATEWAYS,
  SIZE_RANGES,
  labelsFor,
  labelOf,
} from "./catalog";
import type { RequirementData } from "./form";

export type RequirementSummary = {
  featureCount: number;
  completionPercent: number;
  highlights: string[];
};

const TRACKED_FIELDS: Array<(data: RequirementData) => boolean> = [
  (data) => data.storeName.trim().length > 0,
  (data) => data.businessType.length > 0,
  (data) => data.brandsToSell.length > 0,
  (data) => data.sizeRanges.length > 0,
  (data) => data.productVolume.length > 0,
  (data) => data.inventorySource.length > 0,
  (data) => data.buyerFeatures.length > 0,
  (data) => data.paymentGateways.length > 0,
  (data) => data.deliveryMethods.length > 0,
  (data) => data.adminFeatures.length > 0,
  (data) => data.designStyle.length > 0,
  (data) => data.installationOnSite,
  (data) => data.warrantyDisplay,
  (data) => data.transparentCheckout,
  (data) => data.hasLogo,
  (data) => data.hasBrandGuide,
  (data) => data.mobileFirst,
];

export function summarizeRequirements(data: RequirementData): RequirementSummary {
  const filled = TRACKED_FIELDS.filter((check) => check(data)).length;
  const featureCount =
    data.buyerFeatures.length +
    data.adminFeatures.length +
    data.paymentGateways.length +
    data.deliveryMethods.length +
    Number(data.installationOnSite) +
    Number(data.warrantyDisplay) +
    Number(data.transparentCheckout);

  const highlights: string[] = [];
  if (data.storeName) highlights.push(data.storeName);
  if (data.brandsToSell.length) {
    highlights.push(labelsFor(data.brandsToSell, BRANDS).slice(0, 3).join("، "));
  }
  if (data.buyerFeatures.includes("configurator")) {
    highlights.push("پیکربندی مرحله‌ای برای مشتری");
  }
  if (data.designStyle) {
    highlights.push(labelOf(data.designStyle, DESIGN_STYLES));
  }
  if (data.paymentGateways.length) {
    highlights.push(labelsFor(data.paymentGateways, PAYMENT_GATEWAYS).join(" / "));
  }
  if (data.deliveryMethods.length) {
    highlights.push(labelsFor(data.deliveryMethods, DELIVERY_METHODS).join(" / "));
  }
  if (data.sizeRanges.length) {
    highlights.push(labelsFor(data.sizeRanges, SIZE_RANGES).join("، "));
  }
  if (data.adminFeatures.length) {
    highlights.push(`${data.adminFeatures.length} ابزار مدیریتی`);
  }

  return {
    featureCount,
    completionPercent: Math.round((filled / TRACKED_FIELDS.length) * 100),
    highlights: highlights.slice(0, 6),
  };
}
