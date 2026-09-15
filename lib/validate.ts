import { IRAN_PHONE, normalizePhone } from "./format";
import type { RequirementData } from "./form";

export function validateStep(step: number, data: RequirementData): string | null {
  if (step === 0) {
    if (data.fullName.trim().length < 3) return "نام و نام خانوادگی را کامل وارد کنید.";
    if (!IRAN_PHONE.test(normalizePhone(data.phone))) {
      return "شماره موبایل معتبر ایرانی وارد کنید (مثال: ۰۹۱۲۱۲۳۴۵۶۷).";
    }
    if (!data.city) return "شهر را انتخاب کنید.";
    if (data.address.trim().length < 8) return "آدرس تحویل را دقیق‌تر بنویسید.";
  }

  if (step === 1 && !data.sizeInches) return "سایز تلویزیون را انتخاب کنید.";
  if (step === 2) {
    if (!data.brand) return "برند مورد نظر را انتخاب کنید.";
    if (!data.panelType) return "نوع پنل را انتخاب کنید.";
  }
  if (step === 3) {
    if (!data.resolution) return "رزولوشن را انتخاب کنید.";
    if (!data.usage) return "کاربری اصلی را مشخص کنید.";
  }
  if (step === 4 && !data.installType) return "نحوه نصب را انتخاب کنید.";
  if (step === 5 && !data.shipmentType) {
    return "روش ارسال را انتخاب کنید تا هزینه قبل از درگاه مشخص شود.";
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
