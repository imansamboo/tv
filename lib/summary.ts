import {
  ADMIN_FEATURES,
  BRANDS,
  BUYER_FEATURES,
  DELIVERY_METHODS,
  DESIGN_STYLES,
  INVENTORY_SOURCE,
  PAYMENT_GATEWAYS,
  PRODUCT_VOLUME,
  SIZE_RANGES,
  labelWithOther,
  labelsWithOther,
} from "./catalog";
import type { RequirementData } from "./form";
import { validateStep } from "./validate";

export type SummaryItem = {
  label: string;
  value: string;
};

export type RequirementSummary = {
  featureCount: number;
  completionPercent: number;
  highlights: SummaryItem[];
};

const FORM_INPUT_STEPS = 6;

function serviceToggleLabels(data: RequirementData): string[] {
  const items: string[] = [];
  if (data.installationOnSite) items.push("نصب در محل");
  if (data.warrantyDisplay) items.push("نمایش گارانتی");
  if (data.transparentCheckout) items.push("شفافیت قبل از پرداخت");
  return items;
}

function designAssetLabels(data: RequirementData): string[] {
  const items: string[] = [];
  if (data.hasLogo) items.push("لوگو آماده");
  if (data.hasBrandGuide) items.push("راهنمای برند");
  if (data.darkMode) items.push("تم تیره");
  if (data.mobileFirst) items.push("اولویت موبایل");
  return items;
}

export function summarizeRequirements(data: RequirementData): RequirementSummary {
  let completedSteps = 0;
  for (let step = 0; step < FORM_INPUT_STEPS; step += 1) {
    if (validateStep(step, data) === null) completedSteps += 1;
  }

  const featureCount =
    data.buyerFeatures.length +
    data.adminFeatures.length +
    data.paymentGateways.length +
    data.deliveryMethods.length +
    Number(data.installationOnSite) +
    Number(data.warrantyDisplay) +
    Number(data.transparentCheckout);

  const highlights: SummaryItem[] = [];

  if (data.storeName) highlights.push({ label: "فروشگاه", value: data.storeName });
  if (data.contactName) highlights.push({ label: "رابط", value: data.contactName });
  if (data.brandsToSell.length) {
    highlights.push({
      label: "برندها",
      value: labelsWithOther(data.brandsToSell, BRANDS, data.brandsOther).join("، "),
    });
  }
  if (data.sizeRanges.length) {
    highlights.push({
      label: "سایز تلویزیون",
      value: labelsWithOther(data.sizeRanges, SIZE_RANGES, data.sizeRangesOther).join("، "),
    });
  }
  if (data.productVolume) {
    highlights.push({
      label: "تعداد مدل",
      value: labelWithOther(data.productVolume, PRODUCT_VOLUME, data.productVolumeOther),
    });
  }
  if (data.inventorySource) {
    highlights.push({
      label: "ورود محصولات",
      value: labelWithOther(data.inventorySource, INVENTORY_SOURCE, data.inventorySourceOther),
    });
  }
  if (data.buyerFeatures.length) {
    highlights.push({
      label: "تجربه خرید",
      value: labelsWithOther(data.buyerFeatures, BUYER_FEATURES, data.buyerFeaturesOther).join(
        "، ",
      ),
    });
  }
  if (data.paymentGateways.length) {
    highlights.push({
      label: "درگاه پرداخت",
      value: labelsWithOther(data.paymentGateways, PAYMENT_GATEWAYS, data.paymentGatewaysOther).join(
        "، ",
      ),
    });
  }
  if (data.deliveryMethods.length) {
    highlights.push({
      label: "روش ارسال",
      value: labelsWithOther(data.deliveryMethods, DELIVERY_METHODS, data.deliveryMethodsOther).join(
        "، ",
      ),
    });
  }
  const services = serviceToggleLabels(data);
  if (services.length) {
    highlights.push({ label: "خدمات خرید", value: services.join("، ") });
  }
  if (data.adminFeatures.length) {
    highlights.push({
      label: "پنل مدیریت",
      value: labelsWithOther(data.adminFeatures, ADMIN_FEATURES, data.adminFeaturesOther).join(
        "، ",
      ),
    });
  }
  if (data.designStyle) {
    highlights.push({
      label: "سبک طراحی",
      value: labelWithOther(data.designStyle, DESIGN_STYLES, data.designStyleOther),
    });
  }
  const assets = designAssetLabels(data);
  if (assets.length) {
    highlights.push({ label: "دارایی‌های طراحی", value: assets.join("، ") });
  }

  return {
    featureCount,
    completionPercent: Math.round((completedSteps / FORM_INPUT_STEPS) * 100),
    highlights,
  };
}
