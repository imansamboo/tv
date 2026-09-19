import {
  ADMIN_FEATURES,
  BRANDS,
  BUSINESS_TYPES,
  BUYER_FEATURES,
  DELIVERY_METHODS,
  DESIGN_STYLES,
  EXISTING_WEBSITE,
  INVENTORY_SOURCE,
  PAYMENT_GATEWAYS,
  PRODUCT_VOLUME,
  SIZE_RANGES,
  labelWithOther,
  labelsWithOther,
} from "@/lib/catalog";
import type { RequirementData } from "@/lib/form";

function Info({ label, value }: { label: string; value: string }) {
  if (!value || value === "—") return null;
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function serviceToggleLabels(data: RequirementData): string {
  const items: string[] = [];
  if (data.installationOnSite) items.push("نصب در محل");
  if (data.warrantyDisplay) items.push("نمایش گارانتی");
  if (data.transparentCheckout) items.push("شفافیت قبل از پرداخت");
  return items.join("، ");
}

function designAssetLabels(data: RequirementData): string {
  const items: string[] = [];
  if (data.hasLogo) items.push("لوگو آماده");
  if (data.hasBrandGuide) items.push("راهنمای برند");
  if (data.darkMode) items.push("تم تیره");
  if (data.mobileFirst) items.push("اولویت موبایل");
  return items.join("، ");
}

export function ReviewPanel({
  data,
  completionPercent,
}: {
  data: RequirementData;
  completionPercent: number;
}) {
  return (
    <div className="space-y-4 text-sm leading-7">
      <div className="grid gap-3 sm:grid-cols-2">
        <Info label="فروشگاه" value={data.storeName} />
        <Info label="رابط" value={data.contactName} />
        <Info
          label="نوع فعالیت"
          value={labelWithOther(data.businessType, BUSINESS_TYPES, data.businessTypeOther)}
        />
        <Info label="شهر" value={data.city} />
        <Info
          label="وب‌سایت فعلی"
          value={labelWithOther(data.existingWebsite, EXISTING_WEBSITE, data.existingWebsiteOther)}
        />
        <Info
          label="برندها"
          value={labelsWithOther(data.brandsToSell, BRANDS, data.brandsOther).join("، ")}
        />
        <Info
          label="سایزها"
          value={labelsWithOther(data.sizeRanges, SIZE_RANGES, data.sizeRangesOther).join("، ")}
        />
        <Info
          label="تعداد مدل"
          value={labelWithOther(data.productVolume, PRODUCT_VOLUME, data.productVolumeOther)}
        />
        <Info
          label="ورود محصولات"
          value={labelWithOther(data.inventorySource, INVENTORY_SOURCE, data.inventorySourceOther)}
        />
        <Info
          label="تجربه خرید"
          value={labelsWithOther(data.buyerFeatures, BUYER_FEATURES, data.buyerFeaturesOther).join(
            "، ",
          )}
        />
        <Info
          label="درگاه پرداخت"
          value={labelsWithOther(
            data.paymentGateways,
            PAYMENT_GATEWAYS,
            data.paymentGatewaysOther,
          ).join("، ")}
        />
        <Info
          label="روش ارسال"
          value={labelsWithOther(
            data.deliveryMethods,
            DELIVERY_METHODS,
            data.deliveryMethodsOther,
          ).join("، ")}
        />
        <Info label="خدمات خرید" value={serviceToggleLabels(data)} />
        <Info
          label="پنل مدیریت"
          value={labelsWithOther(data.adminFeatures, ADMIN_FEATURES, data.adminFeaturesOther).join(
            "، ",
          )}
        />
        <Info
          label="طراحی"
          value={labelWithOther(data.designStyle, DESIGN_STYLES, data.designStyleOther)}
        />
        <Info label="دارایی‌های طراحی" value={designAssetLabels(data)} />
        <Info label="سایت‌های مرجع" value={data.referenceSites} />
        <Info label="پیشرفت" value={`${completionPercent}%`} />
      </div>
      <Info label="توضیح کوتاه درباره فروشگاه" value={data.storeDescription} />
      <Info label="توضیحات تجربه خرید" value={data.buyerNotes} />
      <Info label="توضیحات خدمات و ارسال" value={data.servicesNotes} />
      <Info label="نیازهای پنل مدیریت" value={data.adminNotes} />
      <Info label="توضیحات طراحی" value={data.designNotes} />
    </div>
  );
}
