import { useState } from "react";
import DOMPurify from "dompurify";
import { businessApi } from "../../../store/apis/businessApi";

const statusLabel = { SENT: "Sent to email provider", FAILED: "Send failed", PENDING: "Pending" };

function EmailDetail({ id, onClose }) {
  const { data: email, isFetching, isError } = businessApi.useFetchEmailHistoryDetailQuery(id);
  const [copyMessage, setCopyMessage] = useState("");
  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage("Copied.");
    } catch {
      setCopyMessage("Could not copy. Select and copy the text below.");
    }
  };
  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6" aria-label="Email details">
      <button className="mb-4 text-blue-700 underline" onClick={onClose}>Close email</button>
      {isFetching ? <p>Loading email…</p> : isError ? <p role="alert">Could not load this email.</p> : email && <>
        <h2 className="text-xl font-semibold break-words">{email.subject}</h2>
        <p className="mt-2 break-words">From: {email.from_email}</p>
        <p className="break-words">To: {email.recipients.join(", ")}</p>
        <p>Reply to: {email.reply_to.join(", ")}</p>
        <p>{new Date(email.created_at).toLocaleString()} · {statusLabel[email.status]}</p>
        {email.attachment_names.length > 0 && <p>Attachments: {email.attachment_names.join(", ")} (names only)</p>}
        <div className="my-4 flex flex-wrap gap-4">
          <button className="text-blue-700 underline" onClick={() => copy(email.text_body)}>Copy email text</button>
          {email.action_url && <button className="text-blue-700 underline" onClick={() => copy(email.action_url)}>Copy emailed link</button>}
        </div>
        {email.action_url && <p className="mb-4 text-sm text-gray-600">Login links expire after 24 hours. Copying a stored link does not renew it. Anyone with a login link can access the client account.</p>}
        <p role="status">{copyMessage}</p>
        <h3 className="mt-4 font-semibold">Email text</h3>
        <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-4 font-sans text-sm">{email.text_body}</pre>
        <details className="mt-4">
          <summary className="cursor-pointer font-semibold">HTML preview</summary>
          <iframe title="Archived email preview" className="mt-2 h-[600px] w-full rounded-lg border" sandbox="" referrerPolicy="no-referrer"
            srcDoc={`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'">${DOMPurify.sanitize(email.html_body)}`} />
          <p className="text-sm text-gray-600">Images and attachments are not included in this preview.</p>
        </details>
      </>}
    </section>
  );
}

function BusinessHistory({ business }) {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const { data, isFetching, isError, refetch } = businessApi.useFetchEmailHistoryQuery({ business: business.id, page });
  return <>
    <div className="flex items-center justify-between gap-4">
      <h1 className="text-2xl font-semibold">Email History</h1>
      <button className="text-blue-700 underline" onClick={refetch}>Refresh</button>
    </div>
    <p className="mt-2 mb-6 text-gray-600">Emails recorded for {business.name}. Sent means the email provider accepted the message; it does not confirm inbox delivery. Earlier emails are not available.</p>
    {isFetching ? <p>Loading emails…</p> : isError ? <p role="alert">Could not load email history. Try refreshing.</p> : <>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50"><tr>{["Date", "Recipient", "Subject", "Status"].map(label => <th className="p-4" key={label}>{label}</th>)}</tr></thead>
          <tbody>{data?.results?.map(email => <tr className="border-t border-gray-100" key={email.id}>
            <td className="p-4">{new Date(email.created_at).toLocaleString()}</td>
            <td className="p-4 break-all">{email.recipients.join(", ")}</td>
            <td className="p-4"><button className="text-blue-700 underline text-left" onClick={() => setSelectedId(email.id)}>{email.subject}</button></td>
            <td className="p-4">{statusLabel[email.status]}</td>
          </tr>)}</tbody>
        </table>
        {!data?.results?.length && <p className="p-6">No emails recorded yet.</p>}
      </div>
      <div className="my-4 flex items-center gap-4">
        <button disabled={!data?.previous} className="disabled:opacity-40" onClick={() => setPage(p => p - 1)}>Previous</button>
        <span>Page {page}</span>
        <button disabled={!data?.next} className="disabled:opacity-40" onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </>}
    {selectedId && <EmailDetail key={selectedId} id={selectedId} onClose={() => setSelectedId(null)} />}
  </>;
}

export default function EmailHistory({ business }) {
  return business ? <BusinessHistory key={business.id} business={business} /> : <p>Select or create a business to view email history.</p>;
}
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  LuChevronLeft,
  LuChevronRight,
  LuEye,
  LuRefreshCw,
} from "react-icons/lu";
import { setTopbar, resetTopbar } from "../../../store/topbarSlice";
import DOMPurify from "dompurify";
import { businessApi } from "../../../store/apis/businessApi";

const statusLabel = {
  SENT: "Sent to email provider",
  FAILED: "Send failed",
  PENDING: "Pending",
};

function EmailDetail({ id, onClose }) {
  const {
    data: email,
    isFetching,
    isError,
  } = businessApi.useFetchEmailHistoryDetailQuery(id);
  const [copyMessage, setCopyMessage] = useState("");
  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage("Copied.");
    } catch {
      setCopyMessage("Could not copy. Select and copy the text below.");
    }
  };
  return (
    <section
      className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      aria-label="Email details"
    >
      <button
        className="mb-4 text-secondary hover:text-accent underline"
        onClick={onClose}
      >
        Close email
      </button>
      {isFetching ? (
        <p>Loading email…</p>
      ) : isError ? (
        <p role="alert">Could not load this email.</p>
      ) : (
        email && (
          <>
            <h2 className="text-xl font-semibold break-words">
              {email.subject}
            </h2>
            <p className="mt-2 break-words">From: {email.from_email}</p>
            <p className="break-words">To: {email.recipients.join(", ")}</p>
            <p>Reply to: {email.reply_to.join(", ")}</p>
            <p>
              {new Date(email.created_at).toLocaleString()} ·{" "}
              {statusLabel[email.status]}
            </p>
            {email.attachment_names.length > 0 && (
              <p>
                Attachments: {email.attachment_names.join(", ")} (names only)
              </p>
            )}
            <div className="my-4 flex flex-wrap gap-4">
              <button
                className="text-secondary hover:text-accent underline"
                onClick={() => copy(email.text_body)}
              >
                Copy email text
              </button>
              {email.action_url && (
                <button
                  className="text-secondary hover:text-accent underline"
                  onClick={() => copy(email.action_url)}
                >
                  Copy emailed link
                </button>
              )}
            </div>
            {email.action_url && (
              <p className="mb-4 text-sm text-gray-600">
                Login links expire after 24 hours. Copying a stored link does
                not renew it. Anyone with a login link can access the client
                account.
              </p>
            )}
            <p role="status">{copyMessage}</p>
            <h3 className="mt-4 font-semibold">Email text</h3>
            <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-4 font-sans text-sm">
              {email.text_body}
            </pre>
            <details className="mt-4">
              <summary className="cursor-pointer font-semibold">
                HTML preview
              </summary>
              <iframe
                title="Archived email preview"
                className="mt-2 h-[600px] w-full rounded-lg border"
                sandbox=""
                referrerPolicy="no-referrer"
                srcDoc={`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'">${DOMPurify.sanitize(email.html_body)}`}
              />
              <p className="text-sm text-gray-600">
                Images and attachments are not included in this preview.
              </p>
            </details>
          </>
        )
      )}
    </section>
  );
}

function BusinessHistory({ business }) {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const { data, isFetching, isError, refetch } =
    businessApi.useFetchEmailHistoryQuery({ business: business.id, page });
  const rows = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / 25));
  const badgeClass = {
    SENT: "bg-emerald-100 text-emerald-700",
    FAILED: "bg-rose-100 text-rose-700",
    PENDING: "bg-amber-100 text-amber-700",
  };
  const pageButtonClass =
    "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-400 transition disabled:cursor-not-allowed disabled:opacity-50";
  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
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
        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <table
              className="min-w-full divide-y divide-gray-100 text-sm"
              aria-label="Email history"
            >
              <thead className="bg-gray-50">
                <tr>
                  {["Date", "Recipient", "Subject", "Status", "Actions"].map(
                    (label) => (
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                        key={label}
                      >
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {isFetching ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Loading emails…
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-rose-700"
                      role="alert"
                    >
                      Could not load email history. Try refreshing.
                    </td>
                  </tr>
                ) : rows.length ? (
                  rows.map((email) => (
                    <tr className="hover:bg-gray-50" key={email.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {new Date(email.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {email.recipients.join(", ")}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <button
                          className="text-left transition hover:text-accent"
                          onClick={() => setSelectedId(email.id)}
                        >
                          {email.subject}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold ${badgeClass[email.status] || "bg-slate-100 text-slate-500"}`}
                        >
                          {statusLabel[email.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          aria-label={`View email: ${email.subject}`}
                          title="View email"
                          onClick={() => setSelectedId(email.id)}
                          className="inline-flex items-center gap-2 rounded-xl p-2 text-sm font-medium text-secondary transition hover:bg-secondary/5"
                        >
                          <LuEye className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      No emails recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {isError ? 0 : rows.length} of {totalCount} emails
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
          </div>
        </div>
      </div>
      {selectedId && (
        <EmailDetail
          key={selectedId}
          id={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
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
