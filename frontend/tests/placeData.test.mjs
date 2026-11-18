import test from "node:test";
import assert from "node:assert/strict";
import { findCity, provinceFromPostal, stateFromZip } from "../src/utils/placeData.js";
import { parseQuickAdd } from "../src/utils/quickAddParser.js";

const today = new Date(2026, 10, 18);
const parse = (note) => parseQuickAdd(note, { serviceOptions: ["Snow Removal"], today }).fields;

test("Canadian postal codes give the province", () => {
  assert.equal(provinceFromPostal("T2T 2T2"), "AB");
  assert.equal(provinceFromPostal("v5k0a1"), "BC");
  assert.equal(provinceFromPostal("M5V 3L9"), "ON");
  assert.equal(provinceFromPostal("H2X 1Y4"), "QC");
  assert.equal(provinceFromPostal("X0A 0H0"), "NU");
  assert.equal(provinceFromPostal("X1A 2P5"), "NT");
  assert.equal(provinceFromPostal("12345"), null);
});

test("US ZIP codes give the state", () => {
  assert.equal(stateFromZip("10001"), "NY");
  assert.equal(stateFromZip("78701"), "TX");
  assert.equal(stateFromZip("94105-1234"), "CA");
  assert.equal(stateFromZip("98101"), "WA");
  assert.equal(stateFromZip("02108"), "MA");
  assert.equal(stateFromZip("1234"), null);
});

test("cities resolve by context, longest name first", () => {
  assert.deepEqual(findCity("snow at North Vancouver"), { city: "North Vancouver", province: "BC", country: "CA" });
  assert.equal(findCity("Vancouver", { country: "US" }).province, "WA");
  assert.equal(findCity("London").province, "ON");
  assert.equal(findCity("Portland", { province: "ME" }).province, "ME");
  assert.equal(findCity("houston").province, "TX");
  // Word-like names only count when capitalised.
  assert.equal(findCity("a mobile home"), null);
  assert.equal(findCity("Mobile").province, "AL");
});

test("quick add: city alone fills province and country, US too", () => {
  let fields = parse("Ann Lee, ann@example.com, 403-555-0100, Houston. Snow removal $90");
  assert.equal(fields.city, "Houston");
  assert.equal(fields.province_state, "TX");
  assert.equal(fields.country, "US");
  assert.equal(fields.currency, "USD");

  fields = parse("Ann Lee, ann@example.com, 403-555-0100, 12 Elm, T3A 1B2");
  assert.equal(fields.province_state, "AB");
  assert.equal(fields.postal_code, "T3A 1B2");
});

test("quick add: the client's name is not read as a city", () => {
  const fields = parse("Jackson Moore, jackson@example.com, 403-555-0100, 12 Elm St, Calgary AB");
  assert.equal(fields.client_name, "Jackson Moore");
  assert.equal(fields.city, "Calgary");
});
