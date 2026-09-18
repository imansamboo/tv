import {
  BRANDS,
  DELIVERY_METHODS,
  DESIGN_STYLES,
  PAYMENT_GATEWAYS,
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
  if (data.brandsToSell.length) {
    highlights.push({
      label: "برندها",
      value: labelsWithOther(data.brandsToSell, BRANDS, data.brandsOther).slice(0, 3).join("، "),
    });
  }
  if (data.buyerFeatures.includes("configurator")) {
    highlights.push({
      label: "پیکربندی",
      value: "پیکربندی مرحله‌ای برای مشتری",
    });
  }
  if (data.designStyle) {
    highlights.push({
      label: "سبک طراحی",
      value: labelWithOther(data.designStyle, DESIGN_STYLES, data.designStyleOther),
    });
  }
  if (data.paymentGateways.length) {
    highlights.push({
      label: "درگاه پرداخت",
      value: labelsWithOther(data.paymentGateways, PAYMENT_GATEWAYS, data.paymentGatewaysOther).join(
        " / ",
      ),
    });
  }
  if (data.deliveryMethods.length) {
    highlights.push({
      label: "روش ارسال",
      value: labelsWithOther(data.deliveryMethods, DELIVERY_METHODS, data.deliveryMethodsOther).join(
        " / ",
      ),
    });
  }
  if (data.sizeRanges.length) {
    highlights.push({
      label: "سایز تلویزیون",
      value: labelsWithOther(data.sizeRanges, SIZE_RANGES, data.sizeRangesOther).join("، "),
    });
  }
  if (data.adminFeatures.length) {
    highlights.push({
      label: "مدیریت",
      value: `${data.adminFeatures.length} ابزار مدیریتی`,
    });
  }

  return {
    featureCount,
    completionPercent: Math.round((completedSteps / FORM_INPUT_STEPS) * 100),
    highlights: highlights.slice(0, 6),
  };
}
