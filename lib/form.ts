export type RequirementData = {
  fullName: string;
  phone: string;
  city: string;
  address: string;
  postalCode: string;
  sizeInches: number | null;
  brand: string;
  panelType: string;
  resolution: string;
  smartOs: string;
  refreshRate: number | null;
  hdr: boolean;
  hdmi21: boolean;
  usage: string;
  installType: string;
  viewingDistance: string;
  roomNotes: string;
  professionalInstall: boolean;
  wallMountKit: boolean;
  oldTvHaulAway: boolean;
  shipmentType: string;
  coverProtection: boolean;
  transferInsurance: boolean;
  extendedWarranty: string;
};

export const emptyRequirement = (): RequirementData => ({
  fullName: "",
  phone: "",
  city: "تهران",
  address: "",
  postalCode: "",
  sizeInches: null,
  brand: "",
  panelType: "led",
  resolution: "uhd4k",
  smartOs: "",
  refreshRate: 60,
  hdr: true,
  hdmi21: false,
  usage: "",
  installType: "stand",
  viewingDistance: "",
  roomNotes: "",
  professionalInstall: false,
  wallMountKit: false,
  oldTvHaulAway: false,
  shipmentType: "",
  coverProtection: false,
  transferInsurance: false,
  extendedWarranty: "none",
});

export function mergeRequirement(raw: unknown): RequirementData {
  const base = emptyRequirement();
  if (!raw || typeof raw !== "object") return base;
  return { ...base, ...(raw as Partial<RequirementData>) };
}

export const FORM_STEPS = [
  { title: "مشخصات شما", desc: "نام، موبایل و آدرس تحویل" },
  { title: "سایز صفحه", desc: "انتخاب اینچ؛ قیمت فوری عوض می‌شود" },
  { title: "برند و پنل", desc: "سامسونگ، ال‌جی، سونی و نوع نمایشگر" },
  { title: "امکانات", desc: "سیستم‌عامل، گیمینگ، HDR و رزولوشن" },
  { title: "نصب و فضا", desc: "دیوارکوب، پایه و جمع‌آوری تلویزیون قبلی" },
  { title: "ارسال و بیمه", desc: "هزینه ارسال، کاور و بیمه حمل قبل از درگاه" },
  { title: "بازبینی و پرداخت", desc: "تأیید نهایی و انتقال به درگاه" },
] as const;
