import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRevenueSeries,
  parseInvoiceAmount,
} from "../src/User/(business)/Home/dashboardMetrics.js";

test("parseInvoiceAmount supports numeric and formatted API values", () => {
  assert.equal(parseInvoiceAmount({ total_amount: 105 }), 105);
  assert.equal(parseInvoiceAmount({ invoice_total: "$4,795.35 CAD" }), 4795.35);
  assert.equal(parseInvoiceAmount({ total_amount: "not available" }), 0);
});

test("monthly revenue buckets billed by created_at and collected by paid_at", () => {
  const series = buildRevenueSeries({
    range: "Monthly",
    now: new Date(2026, 6, 1),
    invoices: [
      {
        status: "PAID",
        total_amount: "105.00",
        created_at: "2026-06-10T10:00:00Z",
        paid_at: "2026-07-01T10:00:00Z",
      },
      {
        status: "SENT",
        total_amount: "50.00",
        created_at: "2026-07-02T10:00:00Z",
      },
    ],
  });

  assert.equal(series.find((item) => item.label === "Jun").revenue, 105);
  assert.equal(series.find((item) => item.label === "Jun").collected, 0);
  assert.equal(series.find((item) => item.label === "Jul").revenue, 50);
  assert.equal(series.find((item) => item.label === "Jul").collected, 105);
});

test("yearly revenue includes paid invoices in the current year", () => {
  const series = buildRevenueSeries({
    range: "Yearly",
    now: new Date(2026, 6, 1),
    invoices: [
      {
        status: "PAID",
        total_amount: "4795.35",
        created_at: "2026-06-17T10:00:00Z",
        paid_at: "2026-06-19T10:00:00Z",
      },
    ],
  });

  const year = series.find((item) => item.label === "2026");
  assert.equal(year.revenue, 4795.35);
  assert.equal(year.collected, 4795.35);
});
