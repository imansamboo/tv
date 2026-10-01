import { toEnDigits } from "./format";

export const PRICING_ITEM_KINDS = ["BASE", "OPTIONAL"] as const;

export type PricingItemKind = (typeof PRICING_ITEM_KINDS)[number];

export const BASE_LOCK_VALUE = "BASE";

/**
 * Ceilings for a single item and for a whole quote. `PricingItem.price`,
 * `PricingQuote.totalPrice` and friends are Prisma `Int` columns, so both limits
 * stay inside the signed 32-bit range instead of silently overflowing.
 */
export const MAX_ITEM_PRICE = 1_000_000_000;
export const MAX_TOTAL_PRICE = 2_000_000_000;

/** Square thumbnail edge, in px, used by every pricing card. */
export const PRICING_IMAGE_SIZE = 112;

export const PRICING_IMAGE_HINT =
  "تصویر مربعی، حداقل ۴۰۰×۴۰۰ پیکسل و کمتر از ۲ مگابایت — اختیاری است.";

/** Shown to a customer whose requirements are in but who has no pricing form yet. */
export const PRICING_FORM_PENDING_MESSAGE =
  "نیازمندی‌های شما ثبت شد. فرم قیمت‌گذاری اختصاصی شما در حال آماده‌سازی است و به‌محض آماده شدن، در همین صفحه نمایش داده می‌شود.";

export const PRICING_KIND_LABELS: Record<PricingItemKind, string> = {
  BASE: "پایه",
  OPTIONAL: "اختیاری",
};

export type PricingItemView = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  kind: PricingItemKind;
  sortOrder: number;
};

export type PricingSectionView = {
  id: string;
  title: string;
  subtitle: string | null;
  sortOrder: number;
  items: PricingItemView[];
};

/** One offered item plus whether the customer picked it. */
export type PricingLine = {
  itemId: string;
  sectionId: string;
  sectionTitle: string;
  title: string;
  description: string | null;
  price: number;
  kind: PricingItemKind;
  sortOrder: number;
  selected: boolean;
};

export type PricingTotals = {
  basePrice: number;
  extrasPrice: number;
  totalPrice: number;
};

export function isPricingItemKind(value: unknown): value is PricingItemKind {
  return typeof value === "string" && (PRICING_ITEM_KINDS as readonly string[]).includes(value);
}

function compareByOrder(a: { sortOrder: number; title: string }, b: typeof a) {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.title.localeCompare(b.title, "fa");
}

/** Sections and their items in the order the admin configured. */
export function sortSections(sections: PricingSectionView[]): PricingSectionView[] {
  return [...sections]
    .sort(compareByOrder)
    .map((section) => ({ ...section, items: [...section.items].sort(compareByOrder) }));
}

export function baseItemsOf(sections: PricingSectionView[]): PricingItemView[] {
  return sections.flatMap((section) => section.items.filter((item) => item.kind === "BASE"));
}

export function findBaseItem(sections: PricingSectionView[]): PricingItemView | null {
  return baseItemsOf(sections)[0] ?? null;
}

function countItems(sections: PricingSectionView[]) {
  return sections.reduce((total, section) => total + section.items.length, 0);
}

/**
 * Persian explanation of why the configured form cannot be used, or `null` when
 * it is usable. Guards the empty-config, missing-base and (defensively)
 * multiple-base cases the database constraint already prevents.
 */
export function pricingConfigError(sections: PricingSectionView[]): string | null {
  if (sections.length === 0) {
    return "هنوز هیچ بخشی برای فرم قیمت‌گذاری تنظیم نشده است.";
  }
  if (countItems(sections) === 0) {
    return "هنوز هیچ موردی برای فرم قیمت‌گذاری تنظیم نشده است.";
  }
  const baseItems = baseItemsOf(sections);
  if (baseItems.length === 0) {
    return "مورد پایه تنظیم نشده است؛ تا تعیین مورد پایه امکان محاسبه قیمت وجود ندارد.";
  }
  if (baseItems.length > 1) {
    return "بیش از یک مورد پایه تنظیم شده است؛ فرم قیمت‌گذاری تا اصلاح تنظیمات فعال نمی‌شود.";
  }
  return null;
}

/**
 * Normalizes what the client asked for against what is actually offered: unknown
 * or inactive ids are dropped and the base item is always included, so a
 * tampered payload can never remove the base price or invent an item.
 */
export function resolveSelection(
  sections: PricingSectionView[],
  requestedItemIds: readonly string[],
): Set<string> {
  const requested = new Set(requestedItemIds);
  const selected = new Set<string>();
  for (const section of sections) {
    for (const item of section.items) {
      if (item.kind === "BASE" || requested.has(item.id)) selected.add(item.id);
    }
  }
  return selected;
}

export function buildPricingLines(
  sections: PricingSectionView[],
  selectedItemIds: ReadonlySet<string>,
): PricingLine[] {
  return sortSections(sections).flatMap((section) =>
    section.items.map((item) => ({
      itemId: item.id,
      sectionId: section.id,
      sectionTitle: section.title,
      title: item.title,
      description: item.description,
      price: item.price,
      kind: item.kind,
      sortOrder: item.sortOrder,
      selected: item.kind === "BASE" || selectedItemIds.has(item.id),
    })),
  );
}

export function sumPricingTotals(lines: readonly PricingLine[]): PricingTotals {
  let basePrice = 0;
  let extrasPrice = 0;
  for (const line of lines) {
    if (!line.selected) continue;
    if (line.kind === "BASE") basePrice += line.price;
    else extrasPrice += line.price;
  }
  return { basePrice, extrasPrice, totalPrice: basePrice + extrasPrice };
}

export type PricingCalculation = {
  lines: PricingLine[];
  selectedLines: PricingLine[];
  totals: PricingTotals;
};

/**
 * The single price calculation used by both the live client total and the
 * authoritative server total, so the two can never disagree about the rules.
 */
export function calculatePricing(
  sections: PricingSectionView[],
  requestedItemIds: readonly string[],
): PricingCalculation {
  const selected = resolveSelection(sections, requestedItemIds);
  const lines = buildPricingLines(sections, selected);
  return {
    lines,
    selectedLines: lines.filter((line) => line.selected),
    totals: sumPricingTotals(lines),
  };
}

/** Persian message when a price is outside the storable range, else `null`. */
export function itemPriceError(price: number): string | null {
  if (!Number.isInteger(price) || price < 0) {
    return "قیمت باید یک عدد صحیح و بزرگ‌تر یا مساوی صفر باشد.";
  }
  if (price > MAX_ITEM_PRICE) {
    return `قیمت هر مورد نمی‌تواند بیشتر از ${MAX_ITEM_PRICE.toLocaleString("en-US")} تومان باشد.`;
  }
  return null;
}

/**
 * Accepts a price as a number or as typed text (Persian digits and thousands
 * separators included) and validates it against the storable range.
 */
export function parseItemPrice(value: unknown): { price: number } | { error: string } {
  let price: number;
  if (typeof value === "number") {
    price = value;
  } else {
    const digits = toEnDigits(String(value ?? "")).replace(/[,\s،]/g, "");
    if (!digits) return { error: "قیمت را وارد کنید." };
    price = Number(digits);
  }
  if (!Number.isFinite(price)) return { error: "قیمت را به صورت عدد وارد کنید." };

  const error = itemPriceError(price);
  return error ? { error } : { price };
}

export function totalPriceError(totalPrice: number): string | null {
  if (totalPrice > MAX_TOTAL_PRICE) {
    return "مجموع قیمت انتخاب‌های شما از سقف مجاز بیشتر است. لطفاً با پشتیبانی تماس بگیرید.";
  }
  return null;
}
