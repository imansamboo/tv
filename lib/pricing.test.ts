import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyRequirement } from "./form";
import { calculateQuote } from "./pricing";

test("larger size increases TV price", () => {
  const data = emptyRequirement();
  data.brand = "samsung";
  data.panelType = "qled";
  data.sizeInches = 55;
  const smaller = calculateQuote(data);
  data.sizeInches = 65;
  const larger = calculateQuote(data);
  assert.ok(smaller.tvPrice > 0);
  assert.ok(larger.tvPrice > smaller.tvPrice);
});

test("checkout extras add shipment, cover and transfer insurance", () => {
  const data = emptyRequirement();
  data.city = "تهران";
  data.sizeInches = 65;
  data.brand = "lg";
  data.panelType = "oled";
  data.shipmentType = "inhome";
  data.coverProtection = true;
  data.transferInsurance = true;
  const quote = calculateQuote(data);
  const keys = quote.extras.map((line) => line.key);
  assert.ok(keys.includes("shipment"));
  assert.ok(keys.includes("cover"));
  assert.ok(keys.includes("insurance"));
  assert.equal(quote.total, quote.tvPrice + quote.extrasPrice);
  assert.ok(quote.extrasPrice > 0);
});

test("Tehran shipping is cheaper than remote cities", () => {
  const data = emptyRequirement();
  data.sizeInches = 55;
  data.shipmentType = "standard";
  data.city = "تهران";
  const tehran = calculateQuote(data);
  data.city = "کیش";
  const kish = calculateQuote(data);
  const tehranShip = tehran.extras.find((line) => line.key === "shipment")?.amount ?? 0;
  const kishShip = kish.extras.find((line) => line.key === "shipment")?.amount ?? 0;
  assert.ok(kishShip > tehranShip);
});
