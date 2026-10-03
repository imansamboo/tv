import type { PricingItemKind } from "@prisma/client";
import type { RequirementData } from "./form";
import { textValue } from "./form";

/** Prices are in تومان (Iranian toman), not million-unit shorthand. */
export const PRICING_BASE_AMOUNT = 90_000_000;
export const PRICING_MAX_TOTAL = 400_000_000;

export type GeneratedPricingItem = {
  id: string;
  title: string;
  description: string;
  price: number;
  kind: PricingItemKind;
};

export type GeneratedPricingSection = {
  id: string;
  title: string;
  subtitle: string;
  items: GeneratedPricingItem[];
};

export type CatalogEntry = {
  id: string;
  sectionId: string;
  sectionTitle: string;
  sectionSubtitle: string;
  title: string;
  description: string;
  /** Relative weight when scaling prices to fit the budget cap. */
  weight: number;
  match: (data: RequirementData) => boolean;
};

export function hasOption(data: RequirementData, fieldKey: string, optionId: string) {
  const value = data.values[fieldKey];
  if (Array.isArray(value)) return value.includes(optionId);
  return value === optionId;
}

export function hasAnyOption(data: RequirementData, fieldKey: string, optionIds: string[]) {
  return optionIds.some((id) => hasOption(data, fieldKey, id));
}

export function fieldHasSelection(data: RequirementData, fieldKey: string) {
  const value = data.values[fieldKey];
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(textValue(data, fieldKey));
}

type CatalogEntryInput = Omit<CatalogEntry, "match">;

/** Maps one multi/single-select answer to a priced optional item. */
export function catalogEntry(
  input: CatalogEntryInput & { fieldKey: string; optionId: string },
): CatalogEntry {
  const { fieldKey, optionId, ...rest } = input;
  return { ...rest, match: (data) => hasOption(data, fieldKey, optionId) };
}

/** Includes the item whenever the customer picked any option on the field. */
export function catalogEntryWhenFieldSelected(
  input: CatalogEntryInput & { fieldKey: string },
): CatalogEntry {
  const { fieldKey, ...rest } = input;
  return { ...rest, match: (data) => fieldHasSelection(data, fieldKey) };
}

/** Always-offered upsells, independent of the requirements form answers. */
export const PRICING_ADDON_ENTRIES: CatalogEntry[] = [
  {
    id: "addon-support-chatbot",
    sectionId: "advanced",
    sectionTitle: "امکانات پیشرفته",
    sectionSubtitle: "افزونه‌های هوشمند و رصد بازار",
    title: "چت‌بات پشتیبانی",
    description: "ویجت گفت‌وگوی زنده با اپراتور برای پاسخ به سؤالات مشتری در سایت.",
    weight: 3,
    match: () => true,
  },
  {
    id: "addon-ai-chatbot",
    sectionId: "advanced",
    sectionTitle: "امکانات پیشرفته",
    sectionSubtitle: "افزونه‌های هوشمند و رصد بازار",
    title: "چت‌بات هوشمند",
    description: "دستیار هوش مصنوعی برای راهنمای خرید، پیشنهاد محصول و پاسخ خودکار.",
    weight: 5,
    match: () => true,
  },
  {
    id: "addon-tgju-fx",
    sectionId: "advanced",
    sectionTitle: "امکانات پیشرفته",
    sectionSubtitle: "افزونه‌های هوشمند و رصد بازار",
    title: "مانیتور قیمت دلار (TGJU)",
    description: "به‌روزرسانی خودکار قیمت کالاها بر اساس نرخ دلار از TGJU یا منبع دلخواه.",
    weight: 3,
    match: () => true,
  },
  {
    id: "addon-competitor-monitor",
    sectionId: "advanced",
    sectionTitle: "امکانات پیشرفته",
    sectionSubtitle: "افزونه‌های هوشمند و رصد بازار",
    title: "رصد قیمت رقبا از URL",
    description: "ثبت آدرس صفحه محصول رقبا و اعلان هنگام تغییر قیمت یا موجودی.",
    weight: 4,
    match: () => true,
  },
];

export function basePricingSection(businessLabel: string): GeneratedPricingSection {
  return {
    id: "section-base",
    title: "سایت پایه",
    subtitle: "صفحات اصلی فروشگاه آنلاین",
    items: [
      {
        id: "item-base-package",
        kind: "BASE",
        title: `پکیج پایه ${businessLabel}`,
        description:
          "شامل: صفحه اصلی، طراحی صفحه اصلی، صفحه محصول، لیست محصولات، درباره ما، تماس با ما، صفحه خدمات، سبد خرید، پنل مدیریت سفارش و راه‌اندازی روی دامنه شما.",
        price: PRICING_BASE_AMOUNT,
      },
    ],
  };
}

/** Groups matched catalog rows into sections and assigns prices within the optional budget. */
export function buildPricingSections(
  businessLabel: string,
  catalog: CatalogEntry[],
  data: RequirementData,
): GeneratedPricingSection[] {
  const matched = catalog.filter((entry) => entry.match(data));
  const bySection = new Map<string, GeneratedPricingSection>();

  for (const entry of matched) {
    let section = bySection.get(entry.sectionId);
    if (!section) {
      section = {
        id: entry.sectionId,
        title: entry.sectionTitle,
        subtitle: entry.sectionSubtitle,
        items: [],
      };
      bySection.set(entry.sectionId, section);
    }
    section.items.push({
      id: entry.id,
      kind: "OPTIONAL",
      title: entry.title,
      description: entry.description,
      price: 0,
    });
  }

  const optionalItems = [...bySection.values()].flatMap((section) => section.items);
  assignOptionalPrices(optionalItems, catalog, data);

  const sections = [basePricingSection(businessLabel), ...bySection.values()];
  return sections.filter((section) => section.items.length > 0);
}

function assignOptionalPrices(
  items: GeneratedPricingItem[],
  catalog: CatalogEntry[],
  data: RequirementData,
) {
  if (items.length === 0) return;
  const budget = PRICING_MAX_TOTAL - PRICING_BASE_AMOUNT;
  const catalogById = new Map(catalog.map((entry) => [entry.id, entry]));
  const totalWeight = items.reduce(
    (sum, item) => sum + (catalogById.get(item.id)?.weight ?? 1),
    0,
  );
  let allocated = 0;
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const weight = catalogById.get(item.id)?.weight ?? 1;
    if (index === items.length - 1) {
      item.price = Math.max(1_000_000, budget - allocated);
    } else {
      item.price = Math.max(1_000_000, Math.round((budget * weight) / totalWeight));
      allocated += item.price;
    }
  }
  // Safety: if rounding overshot, scale down proportionally.
  const sum = items.reduce((total, item) => total + item.price, 0);
  if (sum > budget) {
    const scale = budget / sum;
    for (const item of items) {
      item.price = Math.max(1_000_000, Math.floor(item.price * scale));
    }
  }
  void data;
}
