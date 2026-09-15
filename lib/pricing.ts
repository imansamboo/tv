import {
  BRANDS,
  CITIES,
  COVER_BY_SIZE,
  PANELS,
  REFRESH_RATES,
  RESOLUTIONS,
  SHIPMENTS,
  SIZES,
} from "./catalog";
import type { RequirementData } from "./form";

export type ExtraLine = {
  key: string;
  label: string;
  amount: number;
};

export type Quote = {
  tvPrice: number;
  extras: ExtraLine[];
  extrasPrice: number;
  total: number;
};

function roundToman(value: number) {
  return Math.round(value / 10_000) * 10_000;
}

export function shipmentPrice(
  sizeInches: number,
  shipmentType: string,
  city: string,
) {
  const method = SHIPMENTS.find((item) => item.id === shipmentType);
  if (!method) return 0;
  const cityMult = CITIES.find((item) => item.id === city)?.ship ?? 1.4;
  return roundToman((method.base + sizeInches * method.perInch) * cityMult);
}

export function calculateQuote(data: RequirementData): Quote {
  if (!data.sizeInches) {
    return { tvPrice: 0, extras: [], extrasPrice: 0, total: 0 };
  }

  const size = SIZES.find((item) => item.inches === data.sizeInches);
  if (!size) return { tvPrice: 0, extras: [], extrasPrice: 0, total: 0 };

  let tv: number = size.basePrice;
  tv *= BRANDS.find((item) => item.id === data.brand)?.mult ?? 1;
  tv *= PANELS.find((item) => item.id === data.panelType)?.mult ?? 1;
  tv *= RESOLUTIONS.find((item) => item.id === data.resolution)?.mult ?? 1;
  tv *= REFRESH_RATES.find((item) => item.id === data.refreshRate)?.mult ?? 1;
  if (data.hdr) tv *= 1.04;
  if (data.hdmi21) tv *= 1.03;
  tv = roundToman(tv);

  const extras: ExtraLine[] = [];

  if (data.professionalInstall) {
    extras.push({
      key: "install",
      label:
        data.installType === "wall"
          ? "نصب حرفه‌ای روی دیوار"
          : "راه‌اندازی و تنظیم پایه",
      amount: data.installType === "wall" ? 1_800_000 : 450_000,
    });
  }

  if (data.wallMountKit) {
    extras.push({
      key: "mount",
      label: "براکت دیواری استاندارد",
      amount: 980_000,
    });
  }

  if (data.oldTvHaulAway) {
    extras.push({
      key: "haul",
      label: "جمع‌آوری تلویزیون قبلی",
      amount: 650_000,
    });
  }

  if (data.shipmentType) {
    extras.push({
      key: "shipment",
      label: "هزینه ارسال / حمل",
      amount: shipmentPrice(data.sizeInches, data.shipmentType, data.city),
    });
  }

  if (data.coverProtection) {
    extras.push({
      key: "cover",
      label: "کاور محافظ صفحه و بدنه",
      amount: COVER_BY_SIZE[data.sizeInches] ?? 680_000,
    });
  }

  if (data.transferInsurance) {
    extras.push({
      key: "insurance",
      label: "بیمه حمل و نقل",
      amount: Math.max(350_000, roundToman(tv * 0.025)),
    });
  }

  if (data.extendedWarranty === "12") {
    extras.push({
      key: "warranty",
      label: "گارانتی طلایی ۱۲ ماه",
      amount: roundToman(tv * 0.06),
    });
  }

  if (data.extendedWarranty === "24") {
    extras.push({
      key: "warranty",
      label: "گارانتی طلایی ۲۴ ماه",
      amount: roundToman(tv * 0.1),
    });
  }

  const extrasPrice = extras.reduce((sum, line) => sum + line.amount, 0);
  return { tvPrice: tv, extras, extrasPrice, total: tv + extrasPrice };
}
