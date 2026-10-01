import { Prisma } from "@prisma/client";
import { deletePricingImage } from "./pricing-upload";
import { prisma } from "./prisma";
import {
  BASE_LOCK_VALUE,
  sortSections,
  type PricingItemKind,
  type PricingSectionView,
} from "./pricing";

/** Admin view keeps the fields the customer form filters out. */
export type AdminPricingItem = {
  id: string;
  sectionId: string;
  title: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  kind: PricingItemKind;
  sortOrder: number;
  active: boolean;
};

export type AdminPricingSection = {
  id: string;
  title: string;
  subtitle: string | null;
  sortOrder: number;
  active: boolean;
  items: AdminPricingItem[];
};

export type PricingQuoteItemView = {
  id: string;
  itemId: string | null;
  sectionTitle: string;
  title: string;
  description: string | null;
  price: number;
  kind: PricingItemKind;
  position: number;
  selected: boolean;
};

export type PricingQuoteView = {
  id: string;
  basePrice: number;
  extrasPrice: number;
  totalPrice: number;
  submittedAt: string;
  items: PricingQuoteItemView[];
};

const sectionWithItems = {
  items: { orderBy: [{ sortOrder: "asc" }, { title: "asc" }] },
} satisfies Prisma.PricingSectionInclude;

/**
 * `null` addresses the default template the admin copies new forms from; any
 * other value is the id of one customer-facing pricing form.
 */
export type PricingFormScope = string | null;

/** Sections and items the customer may choose from: active ones only. */
export async function loadPricingForm(
  formId: PricingFormScope = null,
): Promise<PricingSectionView[]> {
  const sections = await prisma.pricingSection.findMany({
    where: { active: true, formId },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    include: { items: { ...sectionWithItems.items, where: { active: true } } },
  });

  return sortSections(
    sections.map((section) => ({
      id: section.id,
      title: section.title,
      subtitle: section.subtitle,
      sortOrder: section.sortOrder,
      items: section.items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        kind: item.kind,
        sortOrder: item.sortOrder,
      })),
    })),
  );
}

/** Full configuration, including disabled rows, for the admin screens. */
export async function loadPricingConfig(
  formId: PricingFormScope = null,
): Promise<AdminPricingSection[]> {
  const sections = await prisma.pricingSection.findMany({
    where: { formId },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    include: sectionWithItems,
  });

  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    subtitle: section.subtitle,
    sortOrder: section.sortOrder,
    active: section.active,
    items: section.items.map((item) => ({
      id: item.id,
      sectionId: item.sectionId,
      title: item.title,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl,
      kind: item.kind,
      sortOrder: item.sortOrder,
      active: item.active,
    })),
  }));
}

export function serializeQuote(
  quote: Prisma.PricingQuoteGetPayload<{ include: { items: true } }>,
): PricingQuoteView {
  return {
    id: quote.id,
    basePrice: quote.basePrice,
    extrasPrice: quote.extrasPrice,
    totalPrice: quote.totalPrice,
    submittedAt: quote.submittedAt.toISOString(),
    items: [...quote.items]
      .sort((a, b) => a.position - b.position)
      .map((item) => ({
        id: item.id,
        itemId: item.itemId,
        sectionTitle: item.sectionTitle,
        title: item.title,
        description: item.description,
        price: item.price,
        kind: item.kind,
        position: item.position,
        selected: item.selected,
      })),
  };
}

export async function findQuoteForUser(userId: string) {
  const quote = await prisma.pricingQuote.findUnique({
    where: { userId },
    include: { items: true },
  });
  return quote ? serializeQuote(quote) : null;
}

/**
 * The `baseLock` column carries the marker only on the single base item, and
 * the marker names the form so every form can have its own base item.
 */
export function baseLockFor(kind: PricingItemKind, formId: PricingFormScope) {
  if (kind !== "BASE") return null;
  return formId ? `${BASE_LOCK_VALUE}:${formId}` : BASE_LOCK_VALUE;
}

/**
 * True when the write failed because another item already holds the base slot.
 * The unique index on `PricingItem.baseLock` is what actually enforces the rule.
 */
export function isDuplicateBaseError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    String(error.meta?.target ?? "").includes("baseLock")
  );
}

export const DUPLICATE_BASE_MESSAGE =
  "فقط یک مورد پایه می‌تواند وجود داشته باشد. ابتدا مورد پایه فعلی را به «اختیاری» تغییر دهید.";

export async function nextSectionOrder(formId: PricingFormScope) {
  const last = await prisma.pricingSection.findFirst({
    where: { formId },
    orderBy: { sortOrder: "desc" },
  });
  return (last?.sortOrder ?? -1) + 1;
}

export async function nextItemOrder(sectionId: string) {
  const last = await prisma.pricingItem.findFirst({
    where: { sectionId },
    orderBy: { sortOrder: "desc" },
  });
  return (last?.sortOrder ?? -1) + 1;
}

/**
 * Swaps a row with its neighbour in one transaction. Sibling orders are
 * renumbered first so rows that share a `sortOrder` still move predictably.
 */
export async function moveSection(id: string, direction: "up" | "down") {
  return prisma.$transaction(async (tx) => {
    const section = await tx.pricingSection.findUnique({ where: { id }, select: { formId: true } });
    if (!section) return false;
    const siblings = await tx.pricingSection.findMany({
      where: { formId: section.formId },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: { id: true },
    });
    const index = siblings.findIndex((sibling) => sibling.id === id);
    if (index === -1) return false;
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= siblings.length) return false;

    const reordered = [...siblings];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    for (const [position, sibling] of reordered.entries()) {
      await tx.pricingSection.update({
        where: { id: sibling.id },
        data: { sortOrder: position },
      });
    }
    return true;
  });
}

export async function moveItem(id: string, direction: "up" | "down") {
  return prisma.$transaction(async (tx) => {
    const item = await tx.pricingItem.findUnique({ where: { id }, select: { sectionId: true } });
    if (!item) return false;

    const siblings = await tx.pricingItem.findMany({
      where: { sectionId: item.sectionId },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: { id: true },
    });
    const index = siblings.findIndex((sibling) => sibling.id === id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || target < 0 || target >= siblings.length) return false;

    const reordered = [...siblings];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    for (const [position, sibling] of reordered.entries()) {
      await tx.pricingItem.update({
        where: { id: sibling.id },
        data: { sortOrder: position },
      });
    }
    return true;
  });
}

/**
 * Copies every section and item of one form (or of the template) into another
 * form. Image files are shared between copies, which is why removal goes
 * through `releasePricingImages`.
 */
export async function copyPricingSections(
  tx: Prisma.TransactionClient,
  from: PricingFormScope,
  to: string,
) {
  const sections = await tx.pricingSection.findMany({
    where: { formId: from },
    include: { items: true },
  });
  for (const section of sections) {
    await tx.pricingSection.create({
      data: {
        formId: to,
        title: section.title,
        subtitle: section.subtitle,
        sortOrder: section.sortOrder,
        active: section.active,
        items: {
          create: section.items.map((item) => ({
            title: item.title,
            description: item.description,
            price: item.price,
            imageUrl: item.imageUrl,
            kind: item.kind,
            baseLock: baseLockFor(item.kind, to),
            sortOrder: item.sortOrder,
            active: item.active,
          })),
        },
      },
    });
  }
}

/** Deletes uploaded files once no remaining item (in any form) points at them. */
export async function releasePricingImages(urls: readonly (string | null | undefined)[]) {
  const unique = [...new Set(urls.filter((url): url is string => Boolean(url)))];
  if (unique.length === 0) return;
  const stillUsed = await prisma.pricingItem.findMany({
    where: { imageUrl: { in: unique } },
    select: { imageUrl: true },
  });
  const used = new Set(stillUsed.map((item) => item.imageUrl));
  await Promise.all(unique.filter((url) => !used.has(url)).map(deletePricingImage));
}
