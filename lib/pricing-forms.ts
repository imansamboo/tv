import { customerNames } from "./customer";
import {
  applyPricingForm,
  calculatePricing,
  parseItemPrice,
  pricingConfigError,
  type PricingFormEntry,
  type PricingSectionView,
} from "./pricing";
import { loadPricingForm } from "./pricing-service";
import { prisma } from "./prisma";

export type PricingFormUser = {
  id: string;
  email: string;
  contactName: string;
  storeName: string;
  assignedAt: string | null;
  quoteId: string | null;
};

export type PricingFormSummary = {
  id: string;
  title: string;
  note: string | null;
  itemCount: number;
  basePrice: number;
  maxPrice: number;
  configError: string | null;
  users: PricingFormUser[];
  updatedAt: string;
};

const userSelect = {
  id: true,
  email: true,
  name: true,
  pricingFormAssignedAt: true,
  requirement: { select: { data: true } },
  pricingQuote: { select: { id: true } },
} as const;

function toFormUser(user: {
  id: string;
  email: string;
  name: string | null;
  pricingFormAssignedAt: Date | null;
  requirement: { data: string } | null;
  pricingQuote: { id: string } | null;
}): PricingFormUser {
  return {
    id: user.id,
    email: user.email,
    ...customerNames(user),
    assignedAt: user.pricingFormAssignedAt?.toISOString() ?? null,
    quoteId: user.pricingQuote?.id ?? null,
  };
}

/** Totals for "only the base item" and "every item ticked" — a quick price range. */
function priceRange(sections: PricingSectionView[]) {
  const all = sections.flatMap((section) => section.items.map((item) => item.id));
  return {
    basePrice: calculatePricing(sections, []).totals.totalPrice,
    maxPrice: calculatePricing(sections, all).totals.totalPrice,
    itemCount: all.length,
  };
}

export async function listPricingForms(): Promise<PricingFormSummary[]> {
  const [catalogue, forms] = await Promise.all([
    loadPricingForm(),
    prisma.pricingForm.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        items: { select: { itemId: true, price: true } },
        users: { select: userSelect, orderBy: { pricingFormAssignedAt: "desc" } },
      },
    }),
  ]);

  return forms.map((form) => {
    const sections = applyPricingForm(catalogue, form.items);
    return {
      id: form.id,
      title: form.title,
      note: form.note,
      ...priceRange(sections),
      configError: pricingConfigError(sections),
      users: form.users.map(toFormUser),
      updatedAt: form.updatedAt.toISOString(),
    };
  });
}

export async function loadPricingFormDetail(id: string) {
  const form = await prisma.pricingForm.findUnique({
    where: { id },
    include: {
      items: { select: { itemId: true, price: true } },
      users: { select: userSelect, orderBy: { pricingFormAssignedAt: "desc" } },
    },
  });
  if (!form) return null;

  const sections = applyPricingForm(await loadPricingForm(), form.items);
  return {
    id: form.id,
    title: form.title,
    note: form.note,
    items: form.items,
    configError: pricingConfigError(sections),
    ...priceRange(sections),
    users: form.users.map(toFormUser),
  };
}

/** Customers who submitted requirements but have not priced their site yet. */
export async function loadAssignableCustomers() {
  const users = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      requirement: { status: "SUBMITTED" },
      pricingQuote: null,
    },
    orderBy: { createdAt: "desc" },
    select: { ...userSelect, pricingFormId: true },
  });
  return users.map((user) => ({ ...toFormUser(user), pricingFormId: user.pricingFormId }));
}

/**
 * Validates the admin's item list against the catalogue. Empty or missing
 * prices mean "use the catalogue price".
 */
export async function parseFormEntries(
  raw: readonly { itemId: string; price?: unknown }[],
): Promise<{ entries: PricingFormEntry[] } | { error: string }> {
  const ids = [...new Set(raw.map((entry) => entry.itemId))];
  const known = await prisma.pricingItem.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  if (known.length !== ids.length) {
    return { error: "برخی از موردهای انتخاب‌شده دیگر وجود ندارند. صفحه را دوباره بارگذاری کنید." };
  }

  const entries = new Map<string, PricingFormEntry>();
  for (const entry of raw) {
    const blank =
      entry.price === undefined || entry.price === null || String(entry.price).trim() === "";
    if (blank) {
      entries.set(entry.itemId, { itemId: entry.itemId, price: null });
      continue;
    }
    const parsed = parseItemPrice(entry.price);
    if ("error" in parsed) return { error: parsed.error };
    entries.set(entry.itemId, { itemId: entry.itemId, price: parsed.price });
  }
  return { entries: [...entries.values()] };
}
