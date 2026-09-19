import { OTHER_ID } from "./form";
import type { RequirementData } from "./form";

function otherTextError(label: string, text: string) {
  if (text.trim().length < 2) {
    return `برای گزینه «سایر» در ${label}، توضیح کوتاه بنویسید.`;
  }
  return null;
}

function validateOtherSingle(value: string, otherText: string, label: string) {
  if (value === OTHER_ID) return otherTextError(label, otherText);
  return null;
}

function validateOtherMulti(values: string[], otherText: string, label: string) {
  if (values.includes(OTHER_ID)) return otherTextError(label, otherText);
  return null;
}

export function validateStep(step: number, data: RequirementData): string | null {
  if (step === 0) {
    if (data.contactName.trim().length < 3) return "نام رابط فروشگاه را کامل وارد کنید.";
    if (data.storeName.trim().length < 2) return "نام فروشگاه را وارد کنید.";
    if (!data.businessType) return "نوع فعالیت فروشگاه را انتخاب کنید.";
    const businessOther = validateOtherSingle(
      data.businessType,
      data.businessTypeOther,
      "نوع فعالیت",
    );
    if (businessOther) return businessOther;
    if (!data.city) return "شهر فعالیت را انتخاب کنید.";
    if (!data.existingWebsite) return "وضعیت سایت فعلی را مشخص کنید.";
    const websiteOther = validateOtherSingle(
      data.existingWebsite,
      data.existingWebsiteOther,
      "وضعیت سایت",
    );
    if (websiteOther) return websiteOther;
  }

  if (step === 1) {
    if (data.brandsToSell.length === 0) return "حداقل یک برند برای فروش انتخاب کنید.";
    const brandsOther = validateOtherMulti(data.brandsToSell, data.brandsOther, "برندها");
    if (brandsOther) return brandsOther;
    if (data.sizeRanges.length === 0) return "حداقل یک بازه سایز انتخاب کنید.";
    const sizeOther = validateOtherMulti(data.sizeRanges, data.sizeRangesOther, "بازه سایز");
    if (sizeOther) return sizeOther;
    if (!data.productVolume) return "حجم تقریبی کاتالوگ را مشخص کنید.";
    const volumeOther = validateOtherSingle(
      data.productVolume,
      data.productVolumeOther,
      "حجم کاتالوگ",
    );
    if (volumeOther) return volumeOther;
    if (data.inventorySources.length === 0) return "نحوه ورود محصولات را انتخاب کنید.";
    const inventoryOther = validateOtherMulti(
      data.inventorySources,
      data.inventorySourceOther,
      "ورود محصولات",
    );
    if (inventoryOther) return inventoryOther;
  }

  if (step === 2) {
    if (data.buyerFeatures.length === 0) {
      return "حداقل یک امکانات برای تجربه خرید مشتری انتخاب کنید.";
    }
    const buyerOther = validateOtherMulti(
      data.buyerFeatures,
      data.buyerFeaturesOther,
      "تجربه خرید",
    );
    if (buyerOther) return buyerOther;
  }

  if (step === 3) {
    if (data.paymentGateways.length === 0) return "حداقل یک روش پرداخت انتخاب کنید.";
    const paymentOther = validateOtherMulti(
      data.paymentGateways,
      data.paymentGatewaysOther,
      "پرداخت",
    );
    if (paymentOther) return paymentOther;
    if (data.deliveryMethods.length === 0) return "حداقل یک روش ارسال انتخاب کنید.";
    const deliveryOther = validateOtherMulti(
      data.deliveryMethods,
      data.deliveryMethodsOther,
      "ارسال",
    );
    if (deliveryOther) return deliveryOther;
  }

  if (step === 4) {
    if (data.adminFeatures.length === 0) {
      return "حداقل یک ابزار مدیریتی برای پنل خود انتخاب کنید.";
    }
    const adminOther = validateOtherMulti(
      data.adminFeatures,
      data.adminFeaturesOther,
      "پنل مدیریت",
    );
    if (adminOther) return adminOther;
  }

  if (step === 5) {
    if (!data.designStyle) return "سبک طراحی مورد نظر را انتخاب کنید.";
    const designOther = validateOtherSingle(
      data.designStyle,
      data.designStyleOther,
      "طراحی",
    );
    if (designOther) return designOther;
  }

  return null;
}

export function firstInvalidStep(data: RequirementData) {
  for (let step = 0; step <= 5; step += 1) {
    const error = validateStep(step, data);
    if (error) return { step, error };
  }
  return null;
}
