import { PrismaClient, type PricingItemKind } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  SPORTS_BUSINESS_ID,
  SPORTS_BUSINESS_NAME,
  SPORTS_REQUIREMENT_FORM,
} from "../lib/business-sports-seed";
import { TV_BUSINESS_ID, TV_BUSINESS_NAME, TV_REQUIREMENT_FORM } from "../lib/business-seed";
import { customerInfo, normalizeRequirement } from "../lib/form";
import { convertLegacyRequirement, isLegacyRequirement } from "../lib/legacy-requirement";
import {
  PRICING_BASE_AMOUNT,
  PRICING_ADDON_ENTRIES,
} from "../lib/pricing-catalog";
import { seedPricingFormsForSubmittedUsers } from "../lib/pricing-form-generator";

const prisma = new PrismaClient();

type SeedItem = {
  id: string;
  title: string;
  description: string;
  price: number;
  kind?: PricingItemKind;
};

type SeedSection = {
  id: string;
  title: string;
  subtitle: string;
  items: SeedItem[];
};

/**
 * Starting point for the pricing form. Fixed ids keep the seed idempotent; the
 * admin panel is the source of truth from here on.
 */
/** Default admin template — base package plus sample optional rows. */
const PRICING_SECTIONS: SeedSection[] = [
  {
    id: "seed-section-base",
    title: "سایت پایه",
    subtitle: "صفحات اصلی فروشگاه آنلاین",
    items: [
      {
        id: "seed-item-base",
        title: "پکیج پایه فروشگاه",
        description:
          "شامل: صفحه اصلی، طراحی صفحه اصلی، صفحه محصول، لیست محصولات، درباره ما، تماس با ما، صفحه خدمات، سبد خرید، پنل مدیریت سفارش و راه‌اندازی روی دامنه شما.",
        price: PRICING_BASE_AMOUNT,
        kind: "BASE",
      },
    ],
  },
  {
    id: "seed-section-sample",
    title: "نمونه امکانات",
    subtitle: "الگوی آیتم‌های اختیاری — در فرم اختصاصی هر مشتری متفاوت است",
    items: [
      {
        id: "seed-item-gateway",
        title: "درگاه پرداخت آنلاین",
        description: "اتصال به درگاه بانکی و تسویه خودکار سفارش‌های اینترنتی.",
        price: 15_000_000,
      },
      {
        id: "seed-item-filters",
        title: "فیلتر پیشرفته",
        description: "فیلتر برند، قیمت و مشخصات فنی در لیست محصولات.",
        price: 12_000_000,
      },
    ],
  },
  {
    id: "seed-section-advanced",
    title: "امکانات پیشرفته",
    subtitle: "افزونه‌های هوشمند و رصد بازار",
    items: PRICING_ADDON_ENTRIES.map((entry, index) => ({
      id: `seed-${entry.id}`,
      title: entry.title,
      description: entry.description,
      price: [20_000_000, 35_000_000, 18_000_000, 25_000_000][index] ?? 15_000_000,
    })),
  },
];

async function seedPricingForm() {
  for (const [sectionOrder, section] of PRICING_SECTIONS.entries()) {
    await prisma.pricingSection.upsert({
      where: { id: section.id },
      update: {},
      create: {
        id: section.id,
        title: section.title,
        subtitle: section.subtitle,
        sortOrder: sectionOrder,
      },
    });

    for (const [itemOrder, item] of section.items.entries()) {
      const kind = item.kind ?? "OPTIONAL";
      await prisma.pricingItem.upsert({
        where: { id: item.id },
        update: {},
        create: {
          id: item.id,
          sectionId: section.id,
          title: item.title,
          description: item.description,
          price: item.price,
          kind,
          baseLock: kind === "BASE" ? "BASE" : null,
          sortOrder: itemOrder,
        },
      });
    }
  }
}

async function seedTvBusiness() {
  await prisma.business.upsert({
    where: { id: TV_BUSINESS_ID },
    update: {},
    create: {
      id: TV_BUSINESS_ID,
      name: TV_BUSINESS_NAME,
      description: "فروشگاه اینترنتی تلویزیون و کالای دیجیتال",
      sortOrder: 0,
      form: JSON.stringify(TV_REQUIREMENT_FORM),
    },
  });
}

async function seedSportsBusiness() {
  await prisma.business.upsert({
    where: { id: SPORTS_BUSINESS_ID },
    update: {},
    create: {
      id: SPORTS_BUSINESS_ID,
      name: SPORTS_BUSINESS_NAME,
      description: "فروشگاه اینترنتی پوشاک، کفش و لوازم ورزشی",
      sortOrder: 1,
      form: JSON.stringify(SPORTS_REQUIREMENT_FORM),
    },
  });
}

/**
 * Customers registered before businesses existed filled the hard-coded TV
 * form, so they are moved to the TV business and their answers converted.
 */
async function migrateLegacyCustomers() {
  await prisma.user.updateMany({
    where: { role: "CUSTOMER", businessId: null },
    data: { businessId: TV_BUSINESS_ID },
  });

  const formJson = JSON.stringify(TV_REQUIREMENT_FORM);
  const requirements = await prisma.requirement.findMany({
    where: { user: { businessId: TV_BUSINESS_ID } },
  });
  for (const requirement of requirements) {
    let raw: unknown;
    try {
      raw = JSON.parse(requirement.data);
    } catch {
      raw = {};
    }
    const legacy = isLegacyRequirement(raw);
    if (!legacy && requirement.contactName !== null) continue;

    const data = normalizeRequirement(
      legacy ? convertLegacyRequirement(raw as Record<string, unknown>) : raw,
      TV_REQUIREMENT_FORM,
    );
    const info = customerInfo(TV_REQUIREMENT_FORM, data);
    const submitted = requirement.status === "SUBMITTED";
    await prisma.requirement.update({
      where: { id: requirement.id },
      data: {
        data: JSON.stringify(data),
        contactName: info.contactName,
        storeName: info.storeName,
        city: info.city,
        formSnapshot: submitted ? (requirement.formSnapshot ?? formJson) : requirement.formSnapshot,
        currentStep: Math.min(requirement.currentStep, TV_REQUIREMENT_FORM.steps.length),
      },
    });
  }
}

async function main() {
  const passwordHash = await bcrypt.hash("Admin1234!", 10);
  await prisma.user.upsert({
    where: { email: "admin@fariman.ir" },
    update: {},
    create: {
      email: "admin@fariman.ir",
      name: "مدیر",
      passwordHash,
      role: "ADMIN",
    },
  });

  await seedPricingForm();
  await seedTvBusiness();
  await seedSportsBusiness();
  await migrateLegacyCustomers();
  await seedPricingFormsForSubmittedUsers();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
