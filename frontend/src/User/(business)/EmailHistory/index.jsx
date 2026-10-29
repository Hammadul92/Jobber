import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  LuChevronLeft,
  LuChevronRight,
  LuCopy,
  LuEye,
  LuRefreshCw,
} from "react-icons/lu";
import DOMPurify from "dompurify";
import { setTopbar, resetTopbar } from "../../../store/topbarSlice";
import { businessApi } from "../../../store/apis/businessApi";
import RecordsTable from "../../../Components/ui/RecordsTable";
import { formatDate } from "../../../utils/formatDate";
import QuoteSectionPopup from "../Quotes/QuoteSectionPopup";

const PAGE_SIZE = 25;

const statusLabel = {
  SENT: "Sent to email provider",
  FAILED: "Send failed",
  PENDING: "Pending",
};

const badgeClass = {
  SENT: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-rose-100 text-rose-700",
  PENDING: "bg-amber-100 text-amber-700",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold ${badgeClass[status] || "bg-slate-100 text-slate-500"}`}
    >
      {statusLabel[status] || status}
    </span>
  );
}

function DetailRow({ label, children }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[120px_1fr] sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="break-words text-sm text-slate-800">{children}</dd>
    </div>
  );
}

function EmailDetail({ id }) {
  const {
    data: email,
    isFetching,
    isError,
  } = businessApi.useFetchEmailHistoryDetailQuery(id);
  const [copyMessage, setCopyMessage] = useState("");
  const copy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(`${label} copied.`);
    } catch {
      setCopyMessage("Could not copy. Select and copy the text below.");
    }
  };

  if (isFetching) return <p className="text-slate-500">Loading email…</p>;
  if (isError || !email) {
    return (
      <p role="alert" className="text-rose-700">
        Could not load this email.
      </p>
    );
  }

  const copyButtonClass =
    "inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-gray-300 hover:bg-gray-50";

  return (
    <div className="space-y-6">
      <dl className="space-y-3 rounded-2xl border border-gray-100 bg-slate-50 p-4">
        <DetailRow label="Status">
          <StatusBadge status={email.status} />
        </DetailRow>
        <DetailRow label="Created">{formatDate(email.created_at)}</DetailRow>
        <DetailRow label="From">{email.from_email}</DetailRow>
        <DetailRow label="To">{email.recipients.join(", ")}</DetailRow>
        {email.reply_to.length > 0 && (
          <DetailRow label="Reply to">{email.reply_to.join(", ")}</DetailRow>
        )}
        {email.attachment_names.length > 0 && (
          <DetailRow label="Attachments">
            {email.attachment_names.join(", ")}{" "}
            <span className="text-slate-500">(names only)</span>
          </DetailRow>
        )}
      </dl>

      <div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={copyButtonClass}
            onClick={() => copy(email.text_body, "Email text")}
          >
            <LuCopy className="h-4 w-4" aria-hidden="true" />
            Copy email text
          </button>
          {email.action_url && (
            <button
              type="button"
              className={copyButtonClass}
              onClick={() => copy(email.action_url, "Link")}
            >
              <LuCopy className="h-4 w-4" aria-hidden="true" />
              Copy emailed link
            </button>
          )}
        </div>
        <p role="status" className="mt-2 text-sm text-slate-600">
          {copyMessage}
        </p>
        {email.action_url && (
          <p className="mt-2 text-sm text-amber-700">
            Login links expire after 24 hours. Copying a stored link does not
            renew it. Anyone with a login link can access the client account.
          </p>
        )}
      </div>

      <section>
        <h6 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Email text
        </h6>
        <pre className="mt-2 whitespace-pre-wrap break-words rounded-2xl border border-gray-100 bg-slate-50 p-4 font-sans text-sm text-slate-800">
          {email.text_body}
        </pre>
      </section>

      <details className="rounded-2xl border border-gray-100">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-700">
          HTML preview
        </summary>
        <div className="border-t border-gray-100 p-4">
          <iframe
            title="Archived email preview"
            className="h-[600px] w-full rounded-lg border border-gray-200"
            sandbox=""
            referrerPolicy="no-referrer"
            srcDoc={`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'">${DOMPurify.sanitize(email.html_body)}`}
          />
          <p className="mt-2 text-sm text-slate-500">
            Images and attachments are not included in this preview.
          </p>
        </div>
      </details>
    </div>
  );
}

function BusinessHistory({ business }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const closeDetail = useCallback(() => setSelected(null), []);
  const { data, isFetching, isError, refetch } =
    businessApi.useFetchEmailHistoryQuery({ business: business.id, page });
  const rows = isFetching || isError ? [] : data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageButtonClass =
    "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-400 transition disabled:cursor-not-allowed disabled:opacity-50";

  const columns = [
    {
      key: "date",
      title: "Date",
      width: "18%",
      className: "whitespace-nowrap px-4 py-3 text-slate-700",
      render: (email) => formatDate(email.created_at),
    },
    {
      key: "recipient",
      title: "Recipient",
      width: "22%",
      className: "break-all px-4 py-3 text-slate-700",
      render: (email) => email.recipients.join(", "),
    },
    {
      key: "subject",
      title: "Subject",
      width: "32%",
      className: "px-4 py-3 font-semibold text-slate-900",
      render: (email) => (
        <button
          type="button"
          className="text-left transition hover:text-accent"
          onClick={() => setSelected(email)}
        >
          {email.subject}
        </button>
      ),
    },
    {
      key: "status",
      title: "Status",
      width: "18%",
      render: (email) => <StatusBadge status={email.status} />,
    },
    {
      key: "actions",
      title: "Actions",
      width: "10%",
      render: (email) => (
        <button
          type="button"
          aria-label={`View email: ${email.subject}`}
          title="View email"
          onClick={() => setSelected(email)}
          className="rounded-xl p-2 text-secondary hover:bg-secondary/5"
        >
          <LuEye className="h-4 w-4" aria-hidden="true" />
        </button>
      ),
    },
  ];

  const emptyState = isFetching ? (
    <p className="text-center text-slate-500">Loading emails…</p>
  ) : isError ? (
    <p role="alert" className="text-center text-rose-700">
      Could not load email history. Try refreshing.
    </p>
  ) : (
    <div className="mx-auto flex max-w-md flex-col items-center text-center">
      <h5 className="text-xl font-medium text-slate-900">
        No emails recorded yet
      </h5>
      <p className="mt-2 text-sm text-slate-500">
        Emails sent for this business will appear here.
      </p>
    </div>
  );

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-medium text-slate-900">
              Email History
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              View emails sent for {business.name}, their content, and original
              links.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Sent confirms provider acceptance, not inbox delivery. Earlier
              emails are not available.
            </p>
          </div>
          <button
            type="button"
            disabled={isFetching}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            onClick={refetch}
          >
            <LuRefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
        </div>
        <RecordsTable
          columns={columns}
          tableClassName="min-w-[800px] sm:min-w-[1000px]"
          rows={rows}
          rowKey={(email) => email.id}
          empty={emptyState}
          footer={
            <>
              <p>
                Showing {rows.length} of {totalCount} emails
              </p>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <p>
                  Page {page} of {totalPages}
                </p>
                <button
                  type="button"
                  disabled={isFetching || !data?.previous}
                  className={pageButtonClass}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label="Previous page"
                >
                  <LuChevronLeft className="h-4 w-4" />
                </button>
                <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl bg-accent px-3 text-sm font-semibold text-white">
                  {page}
                </span>
                <button
                  type="button"
                  disabled={isFetching || !data?.next}
                  className={pageButtonClass}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  <LuChevronRight className="h-4 w-4" />
                </button>
              </div>
            </>
          }
        />
      </div>

      <QuoteSectionPopup
        open={Boolean(selected)}
        onClose={closeDetail}
        title={selected?.subject || "Email"}
        widthClass="max-w-3xl"
      >
        {selected && <EmailDetail key={selected.id} id={selected.id} />}
      </QuoteSectionPopup>
    </>
  );
}

export default function EmailHistory({ business }) {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(
      setTopbar({
        title: "Email History",
        description: "Review business emails, send status, and original links.",
        action: null,
      }),
    );
    return () => {
      dispatch(resetTopbar());
    };
  }, [dispatch]);
  return business ? (
    <BusinessHistory key={business.id} business={business} />
  ) : (
    <p>Select or create a business to view email history.</p>
  );
}
