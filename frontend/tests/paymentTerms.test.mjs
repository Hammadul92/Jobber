import test from "node:test";
import assert from "node:assert/strict";

import { isInvoicePastDue, paymentTermsLabel } from "../src/utils/paymentTerms.js";

test("payment terms have the agreed display labels", () => {
  assert.equal(paymentTermsLabel("UPFRONT"), "Due on Receipt");
  assert.equal(paymentTermsLabel("NET_15"), "Net 15 days");
  assert.equal(paymentTermsLabel("NET_30"), "Net 30 days");
});

test("an upfront invoice is not overdue on its business due date", () => {
  const invoice = {
    due_date: "2026-10-26", status: "SENT", business_timezone: "America/Edmonton",
  };
  assert.equal(isInvoicePastDue(invoice, new Date("2026-10-27T01:00:00Z")), false);
  assert.equal(isInvoicePastDue(invoice, new Date("2026-10-27T08:00:00Z")), true);
});

test("draft, paid, cancelled, and dateless invoices are not overdue", () => {
  const now = new Date("2026-10-27T12:00:00Z");
  assert.equal(isInvoicePastDue({ due_date: null, status: "DRAFT" }, now), false);
  for (const status of ["PAID", "CANCELLED"]) {
    assert.equal(isInvoicePastDue({ due_date: "2020-01-01", status }, now), false);
  }
});
