export type RequirementData = {
  contactName: string;
  storeName: string;
  businessType: string;
  businessTypeOther: string;
  city: string;
  existingWebsite: string;
  existingWebsiteOther: string;
  storeDescription: string;
  brandsToSell: string[];
  brandsOther: string;
  sizeRanges: string[];
  sizeRangesOther: string;
  productVolume: string;
  productVolumeOther: string;
  inventorySource: string;
  inventorySourceOther: string;
  buyerFeatures: string[];
  buyerFeaturesOther: string;
  buyerNotes: string;
  paymentGateways: string[];
  paymentGatewaysOther: string;
  deliveryMethods: string[];
  deliveryMethodsOther: string;
  installationOnSite: boolean;
  warrantyDisplay: boolean;
  transparentCheckout: boolean;
  servicesNotes: string;
  adminFeatures: string[];
  adminFeaturesOther: string;
  adminNotes: string;
  designStyle: string;
  designStyleOther: string;
  referenceSites: string;
  hasLogo: boolean;
  hasBrandGuide: boolean;
  darkMode: boolean;
  mobileFirst: boolean;
  designNotes: string;
};

export const OTHER_ID = "other";

export const OPTIONAL_DESCRIPTION_HINT =
  "اختیاری — فقط توضیح تکمیلی است و جایگزین انتخاب گزینه نمی‌شود.";

export const MULTI_SELECT_HINT = "می‌توانید چند گزینه انتخاب کنید.";
export const SINGLE_SELECT_HINT = "یک گزینه را انتخاب کنید.";

export const FORM_SECTION_HINTS = {
  contactName: "نام کسی که درباره پروژه با ما هماهنگ می‌کند",
  storeName: "نامی که مشتریان شما می‌شناسند",
  businessType: "نوع فعالیت تعیین می‌کند سایت چقدر فروش حضوری و آنلاین را پوشش دهد",
  city: "شهر اصلی فعالیت برای تنظیم ارسال و پشتیبانی",
  existingWebsite: "اگر سایت دارید، زمان راه‌اندازی معمولاً کمتر می‌شود",
  storeDescription: OPTIONAL_DESCRIPTION_HINT,
  brands: "برندهایی که می‌خواهید در سایت بفروشید",
  sizeRanges: "بازه سایزهایی که می‌خواهید در کاتالوگ پوشش دهید",
  productVolume: "تعداد تقریبی مدل‌های تلویزیون در سایت",
  inventorySource: "محصولات چطور وارد سایت می‌شوند",
  buyerFeatures: "امکاناتی که مشتری نهایی در سایت می‌بیند — نه ابزارهای پنل شما",
  buyerNotes: OPTIONAL_DESCRIPTION_HINT,
  paymentGateways: "درگاه‌ها و روش‌های پرداختی که می‌خواهید فعال باشد.",
  deliveryMethods: "روش‌های ارسال برای مشتری.",
  serviceToggles: "خدمات اضافه‌ای که هنگام خرید به مشتری نشان داده می‌شود.",
  servicesNotes: OPTIONAL_DESCRIPTION_HINT,
  adminFeatures: "ابزارهایی که خودتان در پنل مدیریت به آن نیاز دارید.",
  adminNotes: OPTIONAL_DESCRIPTION_HINT,
  designStyle: "حس کلی ظاهر سایت.",
  referenceSites: "آدرس سایت‌هایی که از ظاهرشان الهام گرفته‌اید (اختیاری).",
  designAssets: "موارد برند و اولویت نمایش در موبایل.",
  designNotes: OPTIONAL_DESCRIPTION_HINT,
} as const;

export const emptyRequirement = (): RequirementData => ({
  contactName: "",
  storeName: "",
  businessType: "",
  businessTypeOther: "",
  city: "تهران",
  existingWebsite: "",
  existingWebsiteOther: "",
  storeDescription: "",
  brandsToSell: [],
  brandsOther: "",
  sizeRanges: [],
  sizeRangesOther: "",
  productVolume: "",
  productVolumeOther: "",
  inventorySource: "",
  inventorySourceOther: "",
  buyerFeatures: [],
  buyerFeaturesOther: "",
  buyerNotes: "",
  paymentGateways: [],
  paymentGatewaysOther: "",
  deliveryMethods: [],
  deliveryMethodsOther: "",
  installationOnSite: false,
  warrantyDisplay: false,
  transparentCheckout: true,
  servicesNotes: "",
  adminFeatures: [],
  adminFeaturesOther: "",
  adminNotes: "",
  designStyle: "",
  designStyleOther: "",
  referenceSites: "",
  hasLogo: false,
  hasBrandGuide: false,
  darkMode: false,
  mobileFirst: true,
  designNotes: "",
});

export function mergeRequirement(raw: unknown): RequirementData {
  const base = emptyRequirement();
  if (!raw || typeof raw !== "object") return base;
  const input = raw as Partial<RequirementData>;
  return {
    ...base,
    ...input,
    brandsToSell: Array.isArray(input.brandsToSell) ? input.brandsToSell : base.brandsToSell,
    sizeRanges: Array.isArray(input.sizeRanges) ? input.sizeRanges : base.sizeRanges,
    buyerFeatures: Array.isArray(input.buyerFeatures) ? input.buyerFeatures : base.buyerFeatures,
    paymentGateways: Array.isArray(input.paymentGateways)
      ? input.paymentGateways
      : base.paymentGateways,
    deliveryMethods: Array.isArray(input.deliveryMethods)
      ? input.deliveryMethods
      : base.deliveryMethods,
    adminFeatures: Array.isArray(input.adminFeatures) ? input.adminFeatures : base.adminFeatures,
  };
}

export function toggleInList(list: string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export function hasOtherSelected(value: string | string[]) {
  if (Array.isArray(value)) return value.includes(OTHER_ID);
  return value === OTHER_ID;
}

export const FORM_STEPS = [
  { title: "فروشگاه", desc: "معرفی کسب‌وکار و وضعیت فعلی" },
  { title: "کاتالوگ", desc: "چه محصولاتی باید در سایت باشد" },
  { title: "تجربه خرید", desc: "مشتری نهایی در سایت چه می‌بیند" },
  { title: "پرداخت و خدمات", desc: "درگاه، ارسال، نصب و گارانتی" },
  { title: "پنل مدیریت", desc: "ابزارهایی که شما به آن نیاز دارید" },
  { title: "طراحی", desc: "ظاهر، برند و سایت‌های الهام‌بخش" },
  { title: "بازبینی", desc: "تأیید نهایی نیازمندی‌ها" },
] as const;
