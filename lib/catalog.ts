export const CITIES = [
  { id: "تهران", label: "تهران" },
  { id: "کرج", label: "کرج" },
  { id: "اصفهان", label: "اصفهان" },
  { id: "مشهد", label: "مشهد" },
  { id: "شیراز", label: "شیراز" },
  { id: "تبریز", label: "تبریز" },
  { id: "اهواز", label: "اهواز" },
  { id: "قم", label: "قم" },
  { id: "رشت", label: "رشت" },
  { id: "کرمان", label: "کرمان" },
  { id: "یزد", label: "یزد" },
  { id: "ارومیه", label: "ارومیه" },
  { id: "کیش", label: "کیش" },
  { id: "سایر", label: "سایر شهرها" },
] as const;

export const BUSINESS_TYPES = [
  { id: "physical", label: "فروشگاه حضوری", hint: "شعبه یا ویترین فیزیکی دارید" },
  { id: "online", label: "فقط آنلاین", hint: "الان هم بدون حضوری می‌فروشید" },
  { id: "both", label: "حضوری + آنلاین", hint: "می‌خواهید سایت مکمل فروشگاه باشد" },
] as const;

export const EXISTING_WEBSITE = [
  { id: "none", label: "سایت ندارم", hint: "از صفر می‌خواهیم بسازیم" },
  { id: "have", label: "سایت دارم", hint: "می‌خواهیم ارتقا یا جایگزین شود" },
  { id: "redesign", label: "نیاز به بازطراحی", hint: "سایت فعلی جواب نمی‌دهد" },
] as const;

export const BRANDS = [
  { id: "samsung", label: "سامسونگ" },
  { id: "lg", label: "ال‌جی" },
  { id: "sony", label: "سونی" },
  { id: "tcl", label: "تی‌سی‌ال" },
  { id: "xvision", label: "ایکس‌ویژن" },
  { id: "snowa", label: "اسنوا" },
  { id: "hisense", label: "هایسنس" },
  { id: "other", label: "برندهای دیگر" },
] as const;

export const SIZE_RANGES = [
  { id: "small", label: "۳۲ تا ۴۳ اینچ", hint: "اتاق خواب و فضاهای کوچک" },
  { id: "medium", label: "۵۰ تا ۵۵ اینچ", hint: "پرفروش‌ترین بازه خانگی" },
  { id: "large", label: "۶۵ تا ۷۵ اینچ", hint: "پذیرایی و سینمای خانگی" },
  { id: "xlarge", label: "۸۵ اینچ و بالاتر", hint: "فضاهای بزرگ و لوکس" },
  { id: "all", label: "همه سایزها", hint: "کاتالوگ کامل می‌خواهم" },
] as const;

export const PRODUCT_VOLUME = [
  { id: "small", label: "کمتر از ۵۰ مدل", hint: "فروشگاه تخصصی و محدود" },
  { id: "medium", label: "۵۰ تا ۲۰۰ مدل", hint: "تنوع متوسط محصول" },
  { id: "large", label: "بیش از ۲۰۰ مدل", hint: "کاتالوگ گسترده مثل مارکت‌پلیس" },
] as const;

export const INVENTORY_SOURCE = [
  { id: "manual", label: "ثبت دستی", hint: "محصولات را در پنل وارد می‌کنیم" },
  { id: "excel", label: "اکسل / CSV", hint: "ورود گروهی از فایل" },
  { id: "api", label: "API تأمین‌کننده", hint: "اتصال به سیستم توزیع‌کننده" },
  { id: "erp", label: "نرم‌افزار حسابداری", hint: "یکپارچه با موجودی فعلی" },
] as const;

export const PAYMENT_GATEWAYS = [
  { id: "zarinpal", label: "زرین‌پال" },
  { id: "idpay", label: "آیدی‌پی" },
  { id: "snappay", label: "اسنپ‌پی" },
  { id: "card", label: "کارت‌به‌کارت + تأیید دستی" },
  { id: "installment", label: "اقساط / اعتباری" },
] as const;

export const DELIVERY_METHODS = [
  { id: "standard", label: "ارسال عادی", hint: "تحویل درب واحد" },
  { id: "express", label: "ارسال سریع", hint: "بازه زمانی کوتاه‌تر" },
  { id: "inhome", label: "تحویل داخل منزل", hint: "مناسب تلویزیون‌های بزرگ" },
  { id: "pickup", label: "تحویل حضوری", hint: "مشتری از فروشگاه می‌برد" },
] as const;

export const DESIGN_STYLES = [
  { id: "modern", label: "مدرن و مینیمال", hint: "تمیز، سریع، موبایل‌محور" },
  { id: "premium", label: "لوکس و حرفه‌ای", hint: "حس برند سطح بالا" },
  { id: "budget", label: "اقتصادی و پرمعامله", hint: "تخفیف و قیمت در مرکز" },
  { id: "custom", label: "طراحی سفارشی", hint: "الهام از سایت‌های مرجع خودم" },
] as const;

export const BUYER_FEATURES = [
  { id: "configurator", label: "پیکربندی مرحله‌ای", hint: "مشتری سایز، برند و خدمات را قدم‌به‌قدم انتخاب کند" },
  { id: "comparison", label: "مقایسه محصول", hint: "کنار هم گذاشتن چند مدل" },
  { id: "filters", label: "فیلتر پیشرفته", hint: "اینچ، برند، پنل، قیمت و ..." },
  { id: "wishlist", label: "لیست علاقه‌مندی", hint: "ذخیره برای بعد" },
  { id: "installment", label: "خرید اقساطی", hint: "نمایش طرح‌های پرداخت" },
  { id: "chat", label: "چت با فروشگاه", hint: "پشتیبانی آنلاین مشتری" },
  { id: "reviews", label: "نظرات مشتریان", hint: "امتیاز و دیدگاه روی محصول" },
  { id: "blog", label: "مجله / راهنما", hint: "مقاله انتخاب تلویزیون و اخبار" },
] as const;

export const ADMIN_FEATURES = [
  { id: "orders", label: "مدیریت سفارش", hint: "پیگیری وضعیت و پرداخت" },
  { id: "leads", label: "ثبت سرنخ", hint: "درخواست‌های ناتمام و تماس" },
  { id: "inventory", label: "گزارش موجودی", hint: "کالاهای کم‌موجود و پرفروش" },
  { id: "sms", label: "پیامک کمپین", hint: "اطلاع‌رسانی تخفیف و موجودی" },
  { id: "staff", label: "چند کاربره", hint: "دسترسی جدا برای کارکنان" },
] as const;

export function labelsFor(
  ids: string[],
  catalog: ReadonlyArray<{ id: string; label: string }>,
) {
  return ids
    .map((id) => catalog.find((item) => item.id === id)?.label)
    .filter(Boolean) as string[];
}

export function labelOf(
  id: string,
  catalog: ReadonlyArray<{ id: string; label: string }>,
) {
  return catalog.find((item) => item.id === id)?.label ?? "—";
}
