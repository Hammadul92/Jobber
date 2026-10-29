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
