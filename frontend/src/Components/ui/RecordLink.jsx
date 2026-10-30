import { Link } from "react-router-dom";

// Link to a related record's page, or plain text when there is no page to
// open (no id, or the viewer's role can't see it).
export default function RecordLink({ to, children, className = "text-secondary" }) {
  if (!to) return children ?? "—";
  return (
    <Link
      to={to}
      className={`font-medium hover:text-accent hover:underline ${className}`}
    >
      {children ?? "—"}
    </Link>
  );
}
