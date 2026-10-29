import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useFetchQuotesQuery, useDeleteQuoteMutation } from "../../../store";
import Select from "../../../Components/ui/Select";
import SubmitButton from "../../../Components/ui/SubmitButton";
import LoadingScreen from "../../../Components/ui/LoadingScreen";
import RecordsTable from "../../../Components/ui/RecordsTable";
import { formatDate } from "../../../utils/formatDate";
import { LuEye, LuPencil, LuTrash2 } from "react-icons/lu";

const QUOTE_STATUS_OPTIONS = ["DRAFT", "SENT", "SIGNED", "DECLINED", "EXPIRED"];

const getDisplayStatus = (quote) =>
  quote.status !== "SIGNED" &&
  quote.valid_until &&
  new Date(quote.valid_until) < new Date()
    ? "EXPIRED"
    : quote.status;

export default function QuotesData({ token, role, setAlert }) {
  const {
    data: quoteData,
    isLoading,
    error,
    refetch,
  } = useFetchQuotesQuery(undefined, { skip: !token });

  const [deleteQuote, { isLoading: deleting }] = useDeleteQuoteMutation();
  const [showModal, setShowModal] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);

  const [serviceFilter, setServiceFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const quotes = useMemo(() => quoteData || [], [quoteData]);

  const uniqueServices = useMemo(
    () => [...new Set(quotes.map((q) => q.service_name).filter(Boolean))],
    [quotes],
  );
  const uniqueClients = useMemo(
    () => [...new Set(quotes.map((q) => q.client_name).filter(Boolean))],
    [quotes],
  );
  const filteredQuotes = quotes.filter((q) => {
    const matchService = !serviceFilter || q.service_name === serviceFilter;
    const matchClient = !clientFilter || q.client_name === clientFilter;
    const matchStatus = !statusFilter || getDisplayStatus(q) === statusFilter;
    return matchService && matchClient && matchStatus;
  });

  useEffect(() => {
    if (error) {
      setAlert({
        type: "danger",
        message:
          error?.data?.detail ||
          "Failed to load quotes. Please try again later.",
      });
    }
  }, [error, setAlert]);

  const handleDeleteClick = (id) => {
    setSelectedQuoteId(id);
    setShowModal(true);
  };

  const confirmDelete = async (e) => {
    e.preventDefault();
    if (!selectedQuoteId) return;
    try {
      await deleteQuote(selectedQuoteId).unwrap();
      setAlert({ type: "success", message: "Quote deleted successfully!" });
      setShowModal(false);
      setSelectedQuoteId(null);
      refetch();
    } catch (err) {
      console.error("Failed to delete quote:", err);
      setAlert({
        type: "danger",
        message:
          err?.data?.detail ||
          "Failed to delete quote. Please try again later.",
      });
    }
  };

  const columns = [
    {
      key: "quote",
      title: "Quote",
      width: "12%",
      className: "whitespace-nowrap px-4 py-3 font-semibold text-slate-900",
      render: (quote) => quote.quote_number,
    },
    {
      key: "client",
      title: "Client",
      width: "14%",
      className: "whitespace-nowrap px-4 py-3 text-slate-700",
      render: (quote) => quote.client_name || "—",
    },
    {
      key: "service",
      title: "Service",
      width: "12%",
      render: (quote) =>
        role === "MANAGER" && quote.service_data?.id ? (
          <Link
            to={`/user/business/service/${quote.service_data.id}`}
            className="font-medium text-secondary hover:text-accent"
          >
            {quote.service_name}
          </Link>
        ) : (
          quote.service_name || "—"
        ),
    },
    {
      key: "address",
      title: "Service Address",
      width: "32%",
      render: (quote) =>
        [
          quote.service_data?.street_address,
          quote.service_data?.city,
          quote.service_data?.province_state,
          quote.service_data?.country,
          quote.service_data?.postal_code,
        ]
          .filter(Boolean)
          .join(", ") || "—",
    },
    {
      key: "status",
      title: "Status",
      width: "9%",
      render: (quote) => {
        const status = getDisplayStatus(quote);
        const tone =
          status === "SIGNED"
            ? "bg-emerald-100 text-emerald-700"
            : status === "EXPIRED" || status === "DECLINED"
              ? "bg-rose-100 text-rose-700"
              : status === "SENT"
                ? "bg-sky-100 text-sky-700"
                : "bg-slate-100 text-slate-600";
        return (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${tone}`}
          >
            {status}
          </span>
        );
      },
    },
    {
      key: "valid_until",
      title: "Valid Until",
      width: "12%",
      render: (quote) =>
        quote.valid_until ? formatDate(quote.valid_until) : "—",
    },
    {
      key: "actions",
      title: "Actions",
      width: "9%",
      render: (quote) => (
        <div className="flex items-center gap-1 whitespace-nowrap">
          {quote.status !== "SIGNED" && (
            <Link
              to={`/user/business/quote/${quote.id}/preview`}
              className="rounded-xl p-2 text-secondary hover:bg-secondary/5"
              title={`Preview quote ${quote.quote_number}`}
              aria-label={`Preview quote ${quote.quote_number}`}
            >
              <LuEye className="h-4 w-4" />
            </Link>
          )}
          {role === "CLIENT" && (
            <Link
              to={`/user/business/quote/sign/${quote.id}`}
              className="rounded-xl px-2 py-1.5 text-xs font-semibold text-secondary hover:bg-secondary/5"
              title={`View quote ${quote.quote_number}`}
            >
              View
            </Link>
          )}
          {role === "MANAGER" && (
            <Link
              to={`/user/business/quote/${quote.id}`}
              className="rounded-xl p-2 text-secondary hover:bg-secondary/5"
              title={`${quote.status === "SIGNED" ? "View" : "Edit"} quote ${quote.quote_number}`}
              aria-label={`${quote.status === "SIGNED" ? "View" : "Edit"} quote ${quote.quote_number}`}
            >
              {quote.status === "SIGNED" ? (
                <LuEye className="h-4 w-4" />
              ) : (
                <LuPencil className="h-4 w-4" />
              )}
            </Link>
          )}
          {role === "MANAGER" && quote.status !== "SIGNED" && (
            <button
              type="button"
              onClick={() => handleDeleteClick(quote.id)}
              className="rounded-xl p-2 text-rose-600 hover:bg-rose-50"
              title={`Delete quote ${quote.quote_number}`}
              aria-label={`Delete quote ${quote.quote_number}`}
            >
              <LuTrash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <div className="grid gap-4 md:grid-cols-3 [&>div]:mb-0">
            <Select
              id="quotes-service-filter"
              label="Service"
              value={serviceFilter}
              onChange={setServiceFilter}
              options={[
                { value: "", label: "All Services" },
                ...uniqueServices.map((name) => ({ value: name, label: name })),
              ]}
              fieldClass="h-11 rounded-lg border-gray-200 bg-white px-3 text-sm text-slate-700"
            />

            <Select
              id="quotes-client-filter"
              label="Client"
              value={clientFilter}
              onChange={setClientFilter}
              options={[
                { value: "", label: "All Clients" },
                ...uniqueClients.map((name) => ({ value: name, label: name })),
              ]}
              fieldClass="h-11 rounded-lg border-gray-200 bg-white px-3 text-sm text-slate-700"
            />

            <Select
              id="quotes-status-filter"
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "", label: "All Statuses" },
                ...QUOTE_STATUS_OPTIONS.map((status) => ({
                  value: status,
                  label: status,
                })),
              ]}
              fieldClass="h-11 rounded-lg border-gray-200 bg-white px-3 text-sm text-slate-700"
            />
          </div>
        </div>
        <RecordsTable
          columns={columns}
          tableClassName="min-w-[800px] sm:min-w-[1150px]"
          rows={filteredQuotes}
          rowKey={(quote) => quote.id}
          empty={
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <h5 className="text-xl font-medium text-slate-900">
                {quotes.length
                  ? "No quotes match your filters."
                  : "No quotes yet"}
              </h5>
              <p className="mt-2 text-sm text-slate-500">
                {quotes.length
                  ? "Try adjusting your service, client, or status filters."
                  : "Create a quote to start tracking pricing and approvals."}
              </p>
            </div>
          }
          footer={
            <p>
              Showing {filteredQuotes.length} of {quotes.length} quotes
            </p>
          }
        />
      </div>

      {showModal && (
        <form
          onSubmit={confirmDelete}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-1/4 bg-white shadow-2xl rounded-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h5 className="text-xl font-medium text-gray-900">
                Delete Quote
              </h5>
              <button
                type="button"
                className="text-2xl text-gray-600 transition hover:text-gray-900"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="px-5 py-4 text-gray-700">
              <p className="mb-0">
                Are you sure you want to delete this quote?
              </p>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 transition bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <SubmitButton
                isLoading={deleting}
                btnClass="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100"
                btnName="Delete"
              />
            </div>
          </div>
        </form>
      )}
    </>
  );
}
