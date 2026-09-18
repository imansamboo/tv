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

export type RequirementSummary = {
  featureCount: number;
  completionPercent: number;
  highlights: string[];
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

  const highlights: string[] = [];
  if (data.storeName) highlights.push(data.storeName);
  if (data.brandsToSell.length) {
    highlights.push(
      labelsWithOther(data.brandsToSell, BRANDS, data.brandsOther).slice(0, 3).join("، "),
    );
  }
  if (data.buyerFeatures.includes("configurator")) {
    highlights.push("پیکربندی مرحله‌ای برای مشتری");
  }
  if (data.designStyle) {
    highlights.push(labelWithOther(data.designStyle, DESIGN_STYLES, data.designStyleOther));
  }
  if (data.paymentGateways.length) {
    highlights.push(
      labelsWithOther(data.paymentGateways, PAYMENT_GATEWAYS, data.paymentGatewaysOther).join(
        " / ",
      ),
    );
  }
  if (data.deliveryMethods.length) {
    highlights.push(
      labelsWithOther(data.deliveryMethods, DELIVERY_METHODS, data.deliveryMethodsOther).join(
        " / ",
      ),
    );
  }
  if (data.sizeRanges.length) {
    highlights.push(
      labelsWithOther(data.sizeRanges, SIZE_RANGES, data.sizeRangesOther).join("، "),
    );
  }
  if (data.adminFeatures.length) {
    highlights.push(`${data.adminFeatures.length} ابزار مدیریتی`);
  }

  return {
    featureCount,
    completionPercent: Math.round((completedSteps / FORM_INPUT_STEPS) * 100),
    highlights: highlights.slice(0, 6),
  };
}
