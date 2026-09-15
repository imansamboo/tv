/**
 * Catalog and extra fees are modeled after common TV retail flows:
 * Digikala / Technolife (size, brand, city shipping, official warranty),
 * Samsung delivery (55"+ in-home vs parcel, installation, adult at door),
 * Best Buy (size picker, haul-away, protection plan, scheduled delivery).
 */

export const CITIES = [
  { id: "تهران", label: "تهران", ship: 1 },
  { id: "کرج", label: "کرج", ship: 1.08 },
  { id: "اصفهان", label: "اصفهان", ship: 1.22 },
  { id: "مشهد", label: "مشهد", ship: 1.25 },
  { id: "شیراز", label: "شیراز", ship: 1.22 },
  { id: "تبریز", label: "تبریز", ship: 1.28 },
  { id: "اهواز", label: "اهواز", ship: 1.3 },
  { id: "قم", label: "قم", ship: 1.12 },
  { id: "رشت", label: "رشت", ship: 1.2 },
  { id: "کرمان", label: "کرمان", ship: 1.35 },
  { id: "یزد", label: "یزد", ship: 1.28 },
  { id: "ارومیه", label: "ارومیه", ship: 1.32 },
  { id: "کیش", label: "کیش", ship: 1.55 },
  { id: "سایر", label: "سایر شهرها", ship: 1.4 },
] as const;

export const SIZES = [
  {
    inches: 32,
    label: "۳۲ اینچ",
    hint: "اتاق خواب و فضاهای کوچک",
    viewing: "حدود ۱ تا ۱٫۵ متر",
    basePrice: 9_800_000,
  },
  {
    inches: 43,
    label: "۴۳ اینچ",
    hint: "اتاق نشیمن جمع‌وجور",
    viewing: "حدود ۱٫۵ تا ۲ متر",
    basePrice: 18_500_000,
  },
  {
    inches: 50,
    label: "۵۰ اینچ",
    hint: "تعادل قیمت و تصویر",
    viewing: "حدود ۲ متر",
    basePrice: 24_900_000,
  },
  {
    inches: 55,
    label: "۵۵ اینچ",
    hint: "پرفروش‌ترین سایز خانگی",
    viewing: "حدود ۲ تا ۲٫۵ متر",
    basePrice: 32_800_000,
  },
  {
    inches: 65,
    label: "۶۵ اینچ",
    hint: "سالن پذیرایی",
    viewing: "حدود ۲٫۵ تا ۳ متر",
    basePrice: 49_500_000,
  },
  {
    inches: 75,
    label: "۷۵ اینچ",
    hint: "سینمای خانگی",
    viewing: "حدود ۳ تا ۳٫۵ متر",
    basePrice: 78_000_000,
  },
  {
    inches: 85,
    label: "۸۵ اینچ",
    hint: "فضاهای بزرگ و ویلا",
    viewing: "حدود ۳٫۵ متر به بالا",
    basePrice: 112_000_000,
  },
] as const;

export const BRANDS = [
  { id: "samsung", label: "سامسونگ", hint: "Tizen، تنوع QLED", mult: 1.18 },
  { id: "lg", label: "ال‌جی", hint: "webOS و OLED", mult: 1.14 },
  { id: "sony", label: "سونی", hint: "پردازش تصویر سینمایی", mult: 1.28 },
  { id: "tcl", label: "تی‌سی‌ال", hint: "ارزش خرید بالا", mult: 0.88 },
  { id: "xvision", label: "ایکس‌ویژن", hint: "گارانتی داخلی", mult: 0.78 },
  { id: "snowa", label: "اسنوا", hint: "خدمات پس از فروش ایران", mult: 0.74 },
  { id: "hisense", label: "هایسنس", hint: "ULED و قیمت رقابتی", mult: 0.92 },
] as const;

export const PANELS = [
  { id: "led", label: "LED", hint: "اقتصادی و پرمصرف خانگی", mult: 1 },
  { id: "qled", label: "QLED", hint: "روشنایی و رنگ قوی‌تر", mult: 1.22 },
  { id: "miniled", label: "Mini-LED", hint: "کنتراست نزدیک به OLED", mult: 1.4 },
  { id: "oled", label: "OLED", hint: "سیاهی مطلق و زاویه دید عالی", mult: 1.85 },
] as const;

export const RESOLUTIONS = [
  { id: "fhd", label: "Full HD", hint: "مخصوص سایزهای کوچک‌تر", mult: 0.85 },
  { id: "uhd4k", label: "4K UHD", hint: "استاندارد امروز", mult: 1 },
  { id: "uhd8k", label: "8K", hint: "آینده‌نگر و گران‌تر", mult: 1.55 },
] as const;

export const SMART_OS = [
  { id: "google", label: "Google TV" },
  { id: "tizen", label: "Tizen (سامسونگ)" },
  { id: "webos", label: "webOS (ال‌جی)" },
  { id: "android", label: "Android TV" },
  { id: "any", label: "مهم نیست / پیشنهاد فروشگاه" },
] as const;

export const REFRESH_RATES = [
  { id: 60, label: "۶۰ هرتز", hint: "فیلم و سریال", mult: 1 },
  { id: 120, label: "۱۲۰ هرتز", hint: "ورزش و گیمینگ", mult: 1.12 },
  { id: 144, label: "۱۴۴ هرتز", hint: "گیمینگ رقابتی", mult: 1.18 },
] as const;

export const USAGES = [
  { id: "movie", label: "فیلم و سریال" },
  { id: "living", label: "پذیرایی خانواده" },
  { id: "gaming", label: "گیمینگ" },
  { id: "sports", label: "تماشای ورزش" },
  { id: "bedroom", label: "اتاق خواب" },
  { id: "office", label: "محیط اداری" },
] as const;

export const INSTALL_TYPES = [
  { id: "stand", label: "پایه رومیزی", hint: "روی میز TV" },
  { id: "wall", label: "نصب دیواری", hint: "نیاز به براکت و نصاب" },
] as const;

export const SHIPMENTS = [
  {
    id: "standard",
    label: "ارسال عادی",
    hint: "تحویل درب واحد / آستانه در",
    base: 280_000,
    perInch: 6_000,
  },
  {
    id: "express",
    label: "ارسال سریع",
    hint: "اولویت بسته‌بندی و زمان کوتاه‌تر",
    base: 550_000,
    perInch: 10_000,
  },
  {
    id: "inhome",
    label: "ارسال به داخل منزل",
    hint: "حمل تا اتاق مورد نظر (مناسب ۶۵ اینچ به بالا)",
    base: 1_100_000,
    perInch: 16_000,
  },
] as const;

export const COVER_BY_SIZE: Record<number, number> = {
  32: 280_000,
  43: 450_000,
  50: 520_000,
  55: 680_000,
  65: 890_000,
  75: 1_250_000,
  85: 1_650_000,
};

export const WARRANTY = [
  { id: "none", label: "فقط گارانتی شرکتی", hint: "بدون هزینه اضافه" },
  { id: "12", label: "گارانتی طلایی ۱۲ ماه", hint: "حدود ۶٪ قیمت تلویزیون" },
  { id: "24", label: "گارانتی طلایی ۲۴ ماه", hint: "حدود ۱۰٪ قیمت تلویزیون" },
] as const;

export function suggestedOs(brand: string) {
  if (brand === "samsung") return "tizen";
  if (brand === "lg") return "webos";
  if (brand === "sony") return "google";
  return "google";
}
