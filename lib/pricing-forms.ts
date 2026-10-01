import { customerNames } from "./customer";
import { calculatePricing, pricingConfigError, type PricingSectionView } from "./pricing";
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

async function summarize(form: { id: string }) {
  const sections = await loadPricingForm(form.id);
  return { ...priceRange(sections), configError: pricingConfigError(sections) };
}

export async function listPricingForms(): Promise<PricingFormSummary[]> {
  const forms = await prisma.pricingForm.findMany({
    orderBy: { updatedAt: "desc" },
    include: { users: { select: userSelect, orderBy: { pricingFormAssignedAt: "desc" } } },
  });

  return Promise.all(
    forms.map(async (form) => ({
      id: form.id,
      title: form.title,
      note: form.note,
      ...(await summarize(form)),
      users: form.users.map(toFormUser),
      updatedAt: form.updatedAt.toISOString(),
    })),
  );
}

export async function loadPricingFormDetail(id: string) {
  const form = await prisma.pricingForm.findUnique({
    where: { id },
    include: { users: { select: userSelect, orderBy: { pricingFormAssignedAt: "desc" } } },
  });
  if (!form) return null;

  return {
    id: form.id,
    title: form.title,
    note: form.note,
    ...(await summarize(form)),
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
