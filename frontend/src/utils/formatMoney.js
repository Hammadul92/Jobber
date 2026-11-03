const CURRENCY_SYMBOLS = {
  CAD: "$",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

// Amounts on quotes, invoices and payouts: two decimals plus the currency
// code, e.g. "$1,234.50 CAD".
export function formatMoney(value, currency = "CAD") {
  const amount = Number.parseFloat(value || 0);
  const code = currency || "CAD";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
  const symbol = CURRENCY_SYMBOLS[code];

  return symbol ? `${symbol}${formatted} ${code}` : `${formatted} ${code}`;
}
