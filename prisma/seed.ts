import { PrismaClient, type PricingItemKind } from "@prisma/client";
import bcrypt from "bcryptjs";

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
const PRICING_SECTIONS: SeedSection[] = [
  {
    id: "seed-section-website",
    title: "وب‌سایت",
    subtitle: "هسته سایت فروش تلویزیون و امکانات فروشگاهی آن",
    items: [
      {
        id: "seed-item-base",
        title: "سایت پایه فروش تلویزیون",
        description:
          "طراحی اختصاصی، صفحه محصول، سبد خرید، پنل مدیریت سفارش و راه‌اندازی روی دامنه شما.",
        price: 50_000_000,
        kind: "BASE",
      },
      {
        id: "seed-item-gateway",
        title: "درگاه پرداخت آنلاین",
        description: "اتصال به درگاه بانکی و تسویه خودکار سفارش‌های اینترنتی.",
        price: 5_000_000,
      },
      {
        id: "seed-item-compare",
        title: "مقایسه و فیلتر پیشرفته",
        description: "مقایسه چند مدل تلویزیون و فیلتر بر اساس اینچ، برند، پنل و قیمت.",
        price: 6_000_000,
      },
      {
        id: "seed-item-installment",
        title: "خرید اقساطی",
        description: "نمایش طرح‌های پرداخت اقساطی و محاسبه سود روی صفحه محصول.",
        price: 9_000_000,
      },
    ],
  },
  {
    id: "seed-section-marketing",
    title: "بازاریابی",
    subtitle: "ابزارهای جذب مشتری و اطلاع‌رسانی",
    items: [
      {
        id: "seed-item-seo",
        title: "بهینه‌سازی موتور جستجو",
        description: "ساختار فنی سئو، آدرس‌های خوانا و بهینه‌سازی سرعت صفحه‌ها.",
        price: 7_000_000,
      },
      {
        id: "seed-item-sms",
        title: "پیامک اطلاع‌رسانی",
        description: "اطلاع‌رسانی وضعیت سفارش و کمپین تخفیف با پیامک.",
        price: 2_000_000,
      },
      {
        id: "seed-item-blog",
        title: "مجله و راهنمای خرید",
        description: "بخش مقاله برای راهنمای انتخاب تلویزیون و جذب مشتری از جستجو.",
        price: 4_000_000,
      },
    ],
  },
  {
    id: "seed-section-reporting",
    title: "گزارش‌گیری",
    subtitle: "ابزارهای مدیریتی برای پیگیری فروش و موجودی",
    items: [
      {
        id: "seed-item-reports",
        title: "گزارش پیشرفته فروش",
        description: "گزارش فروش بر اساس برند، سایز و بازه زمانی همراه با نمودار.",
        price: 8_000_000,
      },
      {
        id: "seed-item-excel",
        title: "خروجی اکسل",
        description: "خروجی اکسل سفارش‌ها، مشتریان و موجودی انبار.",
        price: 3_000_000,
      },
    ],
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
