import { Link } from "react-router-dom";
import { QUOTE_STATE_LABELS, QUOTE_STATE_TONES } from "../../utils/quoteSummary";

// The badge for a quoteSummary(): its state, linked to the quote, with a
// note when a revision of a signed quote is in progress. Managers open the
// quote page; clients open the signing page, and only for sent or closed quotes.
export default function QuoteStatusBadge({ summary, isManager = true, emptyText = "No quote" }) {
  if (!summary) return <span className="text-slate-500">{emptyText}</span>;

  const { quote, state, pending } = summary;
  const label = QUOTE_STATE_LABELS[state] || state;
  const tone = QUOTE_STATE_TONES[state] || "bg-slate-100 text-slate-700";
  const linkFor = (target) => {
    if (isManager) return `/user/business/quote/${target.id}`;
    return target.status === "DRAFT" ? null : `/user/business/quote/sign/${target.id}`;
  };
  const to = linkFor(quote);
  const pill = (
    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${tone}`}>
      {label}
    </span>
  );

  return (
    <span className="inline-flex flex-col items-start gap-1">
      {to ? (
        <Link to={to} title={`Quote ${quote.quote_number}`} className="hover:opacity-80">
          {pill}
        </Link>
      ) : (
        pill
      )}
      {pending && (isManager || pending.status === "SENT") && (
        <span className="text-xs text-slate-500">
          Revision {pending.revision} {pending.status === "SENT" ? "sent" : "in draft"}
        </span>
      )}
    </span>
  );
}
