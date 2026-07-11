export const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function parseApiDate(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split("-").map(Number);
      return new Date(year, month - 1, day);
    }

    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
      return new Date(value.replace(" ", "T"));
    }
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfWeek(date) {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

function addWeeks(date, count) {
  const next = new Date(date);
  next.setDate(next.getDate() + count * 7);
  return next;
}

function getInvoiceRevenueDate(invoice) {
  return parseApiDate(invoice.created_at || invoice.due_date || invoice.updated_at);
}

function getInvoiceCollectedDate(invoice) {
  return parseApiDate(invoice.paid_at || invoice.updated_at || invoice.created_at);
}

export function parseInvoiceAmount(invoice) {
  const rawValue =
    invoice.total_amount ??
    invoice.subtotal ??
    invoice.invoice_total ??
    0;

  if (typeof rawValue === "number") {
    return Number.isFinite(rawValue) ? rawValue : 0;
  }

  const normalizedValue = String(rawValue).replace(/[^0-9.-]/g, "");
  const amount = Number(normalizedValue);
  return Number.isFinite(amount) ? amount : 0;
}

export function isPaidInvoice(invoice) {
  return String(invoice.status || "").toUpperCase() === "PAID";
}

function sumInvoiceTotals(records) {
  return records.reduce((sum, invoice) => sum + parseInvoiceAmount(invoice), 0);
}

export function buildRevenueSeries({ invoices, range, now }) {
  if (range === "Weekly") {
    const currentWeek = startOfWeek(now);
    const weeks = Array.from({ length: 8 }, (_, index) =>
      addWeeks(currentWeek, index - 7),
    );

    return weeks.map((weekStart) => {
      const label = `${MONTH_LABELS[weekStart.getMonth()]} ${weekStart.getDate()}`;
      const nextWeek = addWeeks(weekStart, 1);

      const periodInvoices = invoices.filter((invoice) => {
        const date = getInvoiceRevenueDate(invoice);
        return date ? date >= weekStart && date < nextWeek : false;
      });

      const periodPaid = invoices.filter((invoice) => {
        const paidDate = getInvoiceCollectedDate(invoice);
        return isPaidInvoice(invoice) && paidDate
          ? paidDate >= weekStart && paidDate < nextWeek
          : false;
      });

      return {
        label,
        revenue: sumInvoiceTotals(periodInvoices),
        collected: sumInvoiceTotals(periodPaid),
      };
    });
  }

  if (range === "Yearly") {
    const startYear = now.getFullYear() - 5;
    const years = Array.from({ length: 6 }, (_, index) => startYear + index);

    return years.map((year) => {
      const periodInvoices = invoices.filter((invoice) => {
        const date = getInvoiceRevenueDate(invoice);
        return date ? date.getFullYear() === year : false;
      });
      const periodPaid = invoices.filter((invoice) => {
        const paidDate = getInvoiceCollectedDate(invoice);
        return isPaidInvoice(invoice) && paidDate
          ? paidDate.getFullYear() === year
          : false;
      });

      return {
        label: String(year),
        revenue: sumInvoiceTotals(periodInvoices),
        collected: sumInvoiceTotals(periodPaid),
      };
    });
  }

  return Array.from({ length: 12 }, (_, monthIndex) => {
    const periodInvoices = invoices.filter((invoice) => {
      const date = getInvoiceRevenueDate(invoice);
      return date
        ? date.getFullYear() === now.getFullYear() && date.getMonth() === monthIndex
        : false;
    });
    const periodPaid = invoices.filter((invoice) => {
      const paidDate = getInvoiceCollectedDate(invoice);
      return isPaidInvoice(invoice) && paidDate
        ? paidDate.getFullYear() === now.getFullYear() &&
            paidDate.getMonth() === monthIndex
        : false;
    });

    return {
      label: MONTH_LABELS[monthIndex],
      revenue: sumInvoiceTotals(periodInvoices),
      collected: sumInvoiceTotals(periodPaid),
    };
  });
}
