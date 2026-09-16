export type RequirementData = {
  contactName: string;
  storeName: string;
  businessType: string;
  city: string;
  existingWebsite: string;
  storeDescription: string;
  brandsToSell: string[];
  sizeRanges: string[];
  productVolume: string;
  inventorySource: string;
  buyerFeatures: string[];
  buyerNotes: string;
  paymentGateways: string[];
  deliveryMethods: string[];
  installationOnSite: boolean;
  warrantyDisplay: boolean;
  transparentCheckout: boolean;
  servicesNotes: string;
  adminFeatures: string[];
  adminNotes: string;
  designStyle: string;
  referenceSites: string;
  hasLogo: boolean;
  hasBrandGuide: boolean;
  darkMode: boolean;
  mobileFirst: boolean;
  designNotes: string;
};

export const emptyRequirement = (): RequirementData => ({
  contactName: "",
  storeName: "",
  businessType: "",
  city: "تهران",
  existingWebsite: "",
  storeDescription: "",
  brandsToSell: [],
  sizeRanges: [],
  productVolume: "",
  inventorySource: "",
  buyerFeatures: [],
  buyerNotes: "",
  paymentGateways: [],
  deliveryMethods: [],
  installationOnSite: false,
  warrantyDisplay: false,
  transparentCheckout: true,
  servicesNotes: "",
  adminFeatures: [],
  adminNotes: "",
  designStyle: "",
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

export const FORM_STEPS = [
  { title: "فروشگاه", desc: "معرفی کسب‌وکار و وضعیت فعلی" },
  { title: "کاتالوگ", desc: "چه محصولاتی باید در سایت باشد" },
  { title: "تجربه خرید", desc: "مشتری نهایی در سایت چه می‌بیند" },
  { title: "پرداخت و خدمات", desc: "درگاه، ارسال، نصب و گارانتی" },
  { title: "پنل مدیریت", desc: "ابزارهایی که شما به آن نیاز دارید" },
  { title: "طراحی", desc: "ظاهر، برند و سایت‌های الهام‌بخش" },
  { title: "بازبینی", desc: "تأیید نهایی نیازمندی‌ها" },
] as const;
