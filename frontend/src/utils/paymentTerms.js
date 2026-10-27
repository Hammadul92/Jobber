export const PAYMENT_TERMS_OPTIONS = [
  { value: "UPFRONT", label: "Due on Receipt" },
  { value: "NET_15", label: "Net 15 days" },
  { value: "NET_30", label: "Net 30 days" },
];

export function paymentTermsLabel(value) {
  return PAYMENT_TERMS_OPTIONS.find((option) => option.value === value)?.label || "-";
}

export function isInvoicePastDue(invoice, now = new Date()) {
  if (!invoice?.due_date || invoice.status === "PAID" || invoice.status === "CANCELLED") {
    return false;
  }

  let formatter;
  try {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: invoice.business_timezone || "UTC",
      year: "numeric", month: "2-digit", day: "2-digit",
    });
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit",
    });
  }
  const parts = Object.fromEntries(formatter.formatToParts(now).map((part) => [part.type, part.value]));
  const today = `${parts.year}-${parts.month}-${parts.day}`;
  return invoice.due_date < today;
}
