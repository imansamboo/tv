import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAX_ITEM_PRICE,
  calculatePricing,
  findBaseItem,
  itemPriceError,
  pricingConfigError,
  resolveSelection,
  sortSections,
  totalPriceError,
  type PricingItemView,
  type PricingSectionView,
} from "./pricing";

function item(overrides: Partial<PricingItemView> & { id: string }): PricingItemView {
  return {
    title: overrides.id,
    description: null,
    price: 0,
    imageUrl: null,
    kind: "OPTIONAL",
    sortOrder: 0,
    ...overrides,
  };
}

function section(
  overrides: Partial<PricingSectionView> & { id: string },
): PricingSectionView {
  return {
    title: overrides.id,
    subtitle: null,
    sortOrder: 0,
    items: [],
    ...overrides,
  };
}

/** Website section with a 50m base plus two optional features. */
function websiteConfig(): PricingSectionView[] {
  return [
    section({
      id: "website",
      title: "وب‌سایت",
      sortOrder: 0,
      items: [
        item({ id: "base", title: "سایت پایه", kind: "BASE", price: 50_000_000, sortOrder: 0 }),
        item({ id: "gateway", title: "درگاه پرداخت", price: 5_000_000, sortOrder: 1 }),
        item({ id: "sms", title: "پیامک", price: 2_000_000, sortOrder: 2 }),
      ],
    }),
  ];
}

test("base price alone is the starting total", () => {
  const { totals, selectedLines } = calculatePricing(websiteConfig(), []);
  assert.equal(totals.basePrice, 50_000_000);
  assert.equal(totals.extrasPrice, 0);
  assert.equal(totals.totalPrice, 50_000_000);
  assert.deepEqual(
    selectedLines.map((line) => line.itemId),
    ["base"],
  );
});

test("selected optional items are added to the base price", () => {
  const { totals } = calculatePricing(websiteConfig(), ["gateway", "sms"]);
  assert.equal(totals.extrasPrice, 7_000_000);
  assert.equal(totals.totalPrice, 57_000_000);
});

test("unselecting an item removes its price from the total", () => {
  const withBoth = calculatePricing(websiteConfig(), ["gateway", "sms"]);
  const withOne = calculatePricing(websiteConfig(), ["gateway"]);
  assert.equal(withBoth.totals.totalPrice - withOne.totals.totalPrice, 2_000_000);
  assert.equal(withOne.totals.totalPrice, 55_000_000);
});

test("base item stays selected even when the client omits or rejects it", () => {
  const selected = resolveSelection(websiteConfig(), ["gateway"]);
  assert.ok(selected.has("base"));
  const lines = calculatePricing(websiteConfig(), []).lines;
  assert.equal(lines.find((line) => line.itemId === "base")?.selected, true);
});

test("ids that are not offered are ignored instead of priced", () => {
  const { totals, selectedLines } = calculatePricing(websiteConfig(), [
    "gateway",
    "does-not-exist",
    "deleted-yesterday",
  ]);
  assert.equal(totals.totalPrice, 55_000_000);
  assert.deepEqual(
    selectedLines.map((line) => line.itemId),
    ["base", "gateway"],
  );
});

test("lines cover every offered item so a submission records what was not chosen", () => {
  const { lines } = calculatePricing(websiteConfig(), ["sms"]);
  assert.equal(lines.length, 3);
  assert.deepEqual(
    lines.map((line) => [line.itemId, line.selected]),
    [
      ["base", true],
      ["gateway", false],
      ["sms", true],
    ],
  );
});

test("snapshot lines carry the section title, description and price", () => {
  const sections = websiteConfig();
  sections[0].items[1].description = "اتصال به زرین‌پال";
  const line = calculatePricing(sections, ["gateway"]).lines.find(
    (candidate) => candidate.itemId === "gateway",
  );
  assert.equal(line?.sectionTitle, "وب‌سایت");
  assert.equal(line?.description, "اتصال به زرین‌پال");
  assert.equal(line?.price, 5_000_000);
  assert.equal(line?.kind, "OPTIONAL");
});

test("admin ordering decides the order of sections and items", () => {
  const sections = sortSections([
    section({ id: "reporting", title: "گزارش", sortOrder: 2 }),
    section({
      id: "website",
      title: "وب‌سایت",
      sortOrder: 0,
      items: [
        item({ id: "sms", title: "پیامک", sortOrder: 5 }),
        item({ id: "base", title: "پایه", kind: "BASE", sortOrder: 1 }),
      ],
    }),
    section({ id: "marketing", title: "بازاریابی", sortOrder: 1 }),
  ]);
  assert.deepEqual(
    sections.map((entry) => entry.id),
    ["website", "marketing", "reporting"],
  );
  assert.deepEqual(
    sections[0].items.map((entry) => entry.id),
    ["base", "sms"],
  );
});

test("a section without items is still a usable configuration", () => {
  const sections = [...websiteConfig(), section({ id: "empty", title: "خالی", sortOrder: 1 })];
  assert.equal(pricingConfigError(sections), null);
  assert.equal(calculatePricing(sections, []).totals.totalPrice, 50_000_000);
});

test("configuration errors are reported for empty, base-less and multi-base setups", () => {
  assert.match(pricingConfigError([]) ?? "", /بخشی/);
  assert.match(pricingConfigError([section({ id: "empty" })]) ?? "", /موردی/);

  const withoutBase = [
    section({ id: "website", items: [item({ id: "gateway", price: 1_000 })] }),
  ];
  assert.match(pricingConfigError(withoutBase) ?? "", /مورد پایه تنظیم نشده/);

  const twoBases = [
    section({
      id: "website",
      items: [
        item({ id: "base-a", kind: "BASE", price: 10 }),
        item({ id: "base-b", kind: "BASE", price: 20 }),
      ],
    }),
  ];
  assert.match(pricingConfigError(twoBases) ?? "", /بیش از یک مورد پایه/);
  assert.equal(findBaseItem(twoBases)?.id, "base-a");
});

test("item prices are rejected when negative, fractional or above the ceiling", () => {
  assert.equal(itemPriceError(0), null);
  assert.equal(itemPriceError(MAX_ITEM_PRICE), null);
  assert.ok(itemPriceError(-1));
  assert.ok(itemPriceError(1.5));
  assert.ok(itemPriceError(MAX_ITEM_PRICE + 1));
});

test("very large selections are refused instead of overflowing the total column", () => {
  const sections = [
    section({
      id: "huge",
      items: [
        item({ id: "base", kind: "BASE", price: MAX_ITEM_PRICE, sortOrder: 0 }),
        item({ id: "extra-a", price: MAX_ITEM_PRICE, sortOrder: 1 }),
        item({ id: "extra-b", price: MAX_ITEM_PRICE, sortOrder: 2 }),
      ],
    }),
  ];
  const { totals } = calculatePricing(sections, ["extra-a", "extra-b"]);
  assert.equal(totals.totalPrice, 3 * MAX_ITEM_PRICE);
  assert.ok(totalPriceError(totals.totalPrice));
  assert.equal(totalPriceError(calculatePricing(sections, []).totals.totalPrice), null);
});
