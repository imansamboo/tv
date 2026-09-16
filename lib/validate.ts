import type { RequirementData } from "./form";

export function validateStep(step: number, data: RequirementData): string | null {
  if (step === 0) {
    if (data.contactName.trim().length < 3) return "نام رابط فروشگاه را کامل وارد کنید.";
    if (data.storeName.trim().length < 2) return "نام فروشگاه را وارد کنید.";
    if (!data.businessType) return "نوع فعالیت فروشگاه را انتخاب کنید.";
    if (!data.city) return "شهر فعالیت را انتخاب کنید.";
    if (!data.existingWebsite) return "وضعیت سایت فعلی را مشخص کنید.";
  }

  if (step === 1) {
    if (data.brandsToSell.length === 0) return "حداقل یک برند برای فروش انتخاب کنید.";
    if (data.sizeRanges.length === 0) return "حداقل یک بازه سایز انتخاب کنید.";
    if (!data.productVolume) return "حجم تقریبی کاتالوگ را مشخص کنید.";
    if (!data.inventorySource) return "نحوه ورود محصولات را انتخاب کنید.";
  }

  if (step === 2 && data.buyerFeatures.length === 0) {
    return "حداقل یک امکانات برای تجربه خرید مشتری انتخاب کنید.";
  }

  if (step === 3) {
    if (data.paymentGateways.length === 0) return "حداقل یک روش پرداخت انتخاب کنید.";
    if (data.deliveryMethods.length === 0) return "حداقل یک روش ارسال انتخاب کنید.";
  }

  if (step === 4 && data.adminFeatures.length === 0) {
    return "حداقل یک ابزار مدیریتی برای پنل خود انتخاب کنید.";
  }

  if (step === 5 && !data.designStyle) {
    return "سبک طراحی مورد نظر را انتخاب کنید.";
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
