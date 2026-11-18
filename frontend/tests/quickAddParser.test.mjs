import test from "node:test";
import assert from "node:assert/strict";
import { missingFields, parseDate, parseQuickAdd } from "../src/utils/quickAddParser.js";

const today = new Date(2026, 10, 17); // Nov 17, 2026
const serviceOptions = ["Snow Removal", "Lawn Care", "Gutter Cleaning"];

test("parses a one-line note into client, address, service and quote", () => {
  const { fields, found } = parseQuickAdd(
    "John Smith, john.smith@example.com, (403) 555-0123, 123 Main St NW, Calgary AB T2T 2T2. " +
      "Snow removal every month for $120 starting Dec 1. Driveway and front walk.",
    { serviceOptions, today },
  );

  assert.equal(fields.client_name, "John Smith");
  assert.equal(fields.client_email, "john.smith@example.com");
  assert.equal(fields.client_phone, "+14035550123");
  assert.equal(fields.street_address, "123 Main St NW");
  assert.equal(fields.city, "Calgary");
  assert.equal(fields.province_state, "AB");
  assert.equal(fields.postal_code, "T2T 2T2");
  assert.equal(fields.country, "CA");
  assert.equal(fields.service_name, "Snow Removal");
  assert.equal(fields.price, "120.00");
  assert.equal(fields.service_type, "SUBSCRIPTION");
  assert.equal(fields.billing_cycle, "MONTHLY");
  assert.equal(fields.start_date, "2026-12-01");
  assert.match(fields.description, /Driveway and front walk/);
  assert.deepEqual(missingFields(fields), []);
  assert.equal(found.client_email, true);
});

test("labelled lines and item bullets win over guesses", () => {
  const { fields } = parseQuickAdd(
    [
      "Name: maria lopez",
      "Email: maria@example.org",
      "Phone: 604.555.0199",
      "Address: 88 Ocean Drive",
      "City: Vancouver",
      "Province: BC",
      "Postal: V5K 0A1",
      "Service: gutter cleaning",
      "- Front gutters $90",
      "- Downspout flush $35.50",
      "Start: 2027-03-15",
    ].join("\n"),
    { serviceOptions, today },
  );

  assert.equal(fields.client_name, "Maria Lopez");
  assert.equal(fields.city, "Vancouver");
  assert.equal(fields.province_state, "BC");
  assert.equal(fields.service_name, "Gutter Cleaning");
  assert.deepEqual(fields.items.map((item) => [item.title, item.price]), [
    ["Front gutters", "90.00"],
    ["Downspout flush", "35.50"],
  ]);
  assert.equal(fields.price, "125.50");
  assert.equal(fields.service_type, "ONE_TIME");
  assert.equal(fields.start_date, "2027-03-15");
});

test("missing details are reported instead of invented", () => {
  const { fields, found } = parseQuickAdd("Call Dana about lawn care", { serviceOptions, today });
  assert.equal(fields.service_name, "Lawn Care");
  assert.equal(found.client_email, false);
  assert.deepEqual(missingFields(fields), [
    "client_name", "client_email", "client_phone", "price", "street_address", "city", "province_state", "postal_code",
  ]);
  assert.equal(fields.start_date, "2026-11-17");
});

test("US addresses and yearly plans", () => {
  const { fields } = parseQuickAdd(
    "Sam Lee, sam@example.com, 42 Pine Road, Austin TX 78701, annual lawn care $1,200 USD",
    { serviceOptions, today },
  );
  assert.equal(fields.country, "US");
  assert.equal(fields.province_state, "TX");
  assert.equal(fields.postal_code, "78701");
  assert.equal(fields.city, "Austin");
  assert.equal(fields.currency, "USD");
  assert.equal(fields.price, "1200.00");
  assert.equal(fields.billing_cycle, "YEARLY");
});

test("dates roll forward and understand relative words", () => {
  assert.equal(parseDate("Jan 5", today), "2027-01-05");
  assert.equal(parseDate("5th of December", today), "2026-12-05");
  assert.equal(parseDate("tomorrow", today), "2026-11-18");
  assert.equal(parseDate("next monday", today), "2026-11-23");
  assert.equal(parseDate("12/01/2026", today), "2026-12-01");
  assert.equal(parseDate("whenever", today), null);
});

test("phone digits on the line before the address stay out of the street", () => {
  const { fields } = parseQuickAdd(
    "Priya Patel, priya@example.com, 780-555-0177\n4512 Whyte Ave NW, Edmonton AB T6E 1Z1",
    { serviceOptions, today },
  );
  assert.equal(fields.street_address, "4512 Whyte Ave NW");
  assert.equal(fields.city, "Edmonton");
});
