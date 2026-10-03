import { formForRequirement } from "./business";
import { SPORTS_BUSINESS_ID, SPORTS_BUSINESS_NAME } from "./business-sports-seed";
import { TV_BUSINESS_ID, TV_BUSINESS_NAME } from "./business-seed";
import { parseRequirementData, parseRequirementForm } from "./form";
import {
  buildPricingSections,
  PRICING_ADDON_ENTRIES,
  type GeneratedPricingSection,
} from "./pricing-catalog";
import { sportsPricingCatalog } from "./pricing-catalog-sports";
import { tvPricingCatalog } from "./pricing-catalog-tv";
import { baseLockFor } from "./pricing-service";
import { prisma } from "./prisma";

const BUSINESS_LABELS: Record<string, string> = {
  [TV_BUSINESS_ID]: TV_BUSINESS_NAME,
  [SPORTS_BUSINESS_ID]: SPORTS_BUSINESS_NAME,
};

function getPricingCatalog(businessId: string) {
  const business =
    businessId === SPORTS_BUSINESS_ID ? sportsPricingCatalog() : tvPricingCatalog();
  return [...business, ...PRICING_ADDON_ENTRIES];
}

export type GeneratePricingFormOptions = {
  /** Replace an assigned form when the customer has not submitted a quote yet. */
  force?: boolean;
};

async function persistPricingForm(
  userId: string,
  storeName: string,
  sections: GeneratedPricingSection[],
  oldFormId: string | null,
) {
  return prisma.$transaction(async (tx) => {
    if (oldFormId) {
      await tx.user.updateMany({
        where: { pricingFormId: oldFormId },
        data: { pricingFormId: null, pricingFormAssignedAt: null },
      });
      await tx.pricingForm.delete({ where: { id: oldFormId } });
    }

    const created = await tx.pricingForm.create({
      data: {
        title: `فرم قیمت — ${storeName}`,
        note: "تولید خودکار بر اساس نیازمندی‌های ثبت‌شده",
      },
    });

    for (const [sectionOrder, section] of sections.entries()) {
      await tx.pricingSection.create({
        data: {
          formId: created.id,
          title: section.title,
          subtitle: section.subtitle,
          sortOrder: sectionOrder,
          items: {
            create: section.items.map((item, itemOrder) => ({
              title: item.title,
              description: item.description,
              price: item.price,
              kind: item.kind,
              baseLock: baseLockFor(item.kind, created.id),
              sortOrder: itemOrder,
            })),
          },
        },
      });
    }

    await tx.user.update({
      where: { id: userId },
      data: { pricingFormId: created.id, pricingFormAssignedAt: new Date() },
    });

    return created.id;
  });
}

/**
 * Builds a customer-specific pricing form from submitted requirements and assigns
 * it to the user. Skips when requirements are not submitted or a quote exists.
 */
export async function generateAndAssignPricingForm(
  userId: string,
  options: GeneratePricingFormOptions = {},
): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      business: true,
      requirement: true,
      pricingQuote: { select: { id: true } },
    },
  });
  if (!user?.business || !user.requirement) return null;
  if (user.requirement.status !== "SUBMITTED") return null;
  if (user.pricingQuote) return user.pricingFormId;

  const { force = false } = options;
  if (user.pricingFormId && !force) return user.pricingFormId;

  const businessForm = parseRequirementForm(user.business.form);
  const form = formForRequirement(user.requirement, businessForm);
  if (!form) return null;

  const data = parseRequirementData(user.requirement.data, form);
  const businessLabel = BUSINESS_LABELS[user.business.id] ?? user.business.name;
  const sections = buildPricingSections(businessLabel, getPricingCatalog(user.business.id), data);
  const storeName = user.requirement.storeName ?? user.business.name;

  return persistPricingForm(
    userId,
    storeName,
    sections,
    force ? user.pricingFormId : null,
  );
}

/** Seeds pricing forms for every submitted customer who has not priced yet. */
export async function seedPricingFormsForSubmittedUsers() {
  const users = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      requirement: { status: "SUBMITTED" },
      pricingQuote: null,
    },
    select: { id: true, pricingFormId: true },
  });

  for (const user of users) {
    await generateAndAssignPricingForm(user.id, { force: Boolean(user.pricingFormId) });
  }
}
