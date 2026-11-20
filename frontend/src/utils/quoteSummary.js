import { endOfDate } from "./formatDate";

// What a service's quotes add up to, for a status badge. A signed quote is
// the agreement in force, even while a revision of it is in progress;
// otherwise the open (draft or sent) quote, shown as expired once past its
// valid-until date; otherwise the last voided or declined one.
export function quoteSummary(quotations = []) {
  const quotes = [...quotations].sort(
    (a, b) => (b.revision || 1) - (a.revision || 1) || b.id - a.id,
  );
  const signed = quotes.find((quote) => quote.status === "SIGNED");
  const open = quotes.find((quote) => ["DRAFT", "SENT"].includes(quote.status));

  if (signed) return { quote: signed, state: "SIGNED", pending: open || null };
  if (open) {
    const expired = Boolean(open.valid_until) && endOfDate(open.valid_until) <= new Date();
    return { quote: open, state: expired ? "EXPIRED" : open.status, pending: null };
  }
  const closed = quotes.find((quote) => ["VOID", "DECLINED"].includes(quote.status));
  if (closed) return { quote: closed, state: closed.status, pending: null };
  return null;
}

export const QUOTE_STATE_LABELS = {
  SIGNED: "Signed",
  SENT: "Sent",
  DRAFT: "Draft",
  EXPIRED: "Expired",
  VOID: "Voided",
  DECLINED: "Declined",
};

export const QUOTE_STATE_TONES = {
  SIGNED: "bg-emerald-100 text-emerald-700",
  SENT: "bg-blue-100 text-blue-700",
  DRAFT: "bg-slate-100 text-slate-600",
  EXPIRED: "bg-rose-100 text-rose-700",
  VOID: "bg-slate-200 text-slate-600",
  DECLINED: "bg-rose-100 text-rose-700",
};
