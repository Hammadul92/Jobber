import test from "node:test";
import assert from "node:assert/strict";
import { formatMoney } from "../src/utils/formatMoney.js";

test("formats amounts with symbol, two decimals and currency code", () => {
  assert.equal(formatMoney("1234.5", "CAD"), "$1,234.50 CAD");
  assert.equal(formatMoney(10, "EUR"), "€10.00 EUR");
});

test("falls back for missing values and unknown currencies", () => {
  assert.equal(formatMoney(null), "$0.00 CAD");
  assert.equal(formatMoney("abc", ""), "$0.00 CAD");
  assert.equal(formatMoney(5, "JPY"), "5.00 JPY");
});
