import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useFetchQuotesQuery, useDeleteQuoteMutation } from "../../../store";
import Select from "../../../Components/ui/Select";
import SubmitButton from "../../../Components/ui/SubmitButton";
import LoadingScreen from "../../../Components/ui/LoadingScreen";
import { formatDate } from "../../../utils/formatDate";
import {
  LuCalendarDays,
  LuEye,
  LuMapPin,
  LuPencil,
  LuTrash2,
  LuUser,
} from "react-icons/lu";

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

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <div className="p-5 mb-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
        <div className="grid gap-4 md:grid-cols-3">
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
              ...QUOTE_STATUS_OPTIONS.map((status) => ({ value: status, label: status })),
            ]}
            fieldClass="h-11 rounded-lg border-gray-200 bg-white px-3 text-sm text-slate-700"
          />
        </div>
      </div>

      {filteredQuotes.length === 0 ? (
        <div className="min-h-[65vh] rounded-xl border border-dashed border-gray-200 bg-white text-center">
          <div className="flex flex-col items-center justify-center h-full gap-2 p-6 text-gray-600">
            <p className="text-base font-semibold text-gray-800">
              No quotes found.
            </p>
            <p className="text-sm text-gray-500">
              Try adjusting your filters or create a new quote.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filteredQuotes.map((quote) => {
            const displayStatus = getDisplayStatus(quote);
            const isExpired = displayStatus === "EXPIRED";

            let badgeClass = "bg-slate-100 text-slate-500";

            if (isExpired) {
              badgeClass = "bg-rose-100 text-rose-700";
            } else if (quote.status === "SIGNED") {
              badgeClass = "bg-emerald-100 text-emerald-700";
            } else if (quote.status === "DECLINED") {
              badgeClass = "bg-rose-100 text-rose-700";
            } else if (quote.status === "DRAFT") {
              badgeClass = "bg-slate-100 text-slate-500";
            }

            const serviceData = quote.service_data || {};
            const isSigned = quote.status === "SIGNED";
            const serviceAddress = [
              serviceData.street_address,
              serviceData.city,
              serviceData.province_state,
              serviceData.country,
              serviceData.postal_code,
            ]
              .filter(Boolean)
              .join(", ");

            return (
              <div
                className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                key={quote.quote_number}
              >
                <div className="flex items-start justify-between gap-3 mb-6">
                  <h5 className="text-xl font-medium tracking-tight text-[#ff6a00]">
                    {quote.quote_number}
                  </h5>
                  <span
                    className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-[0.04em] ${badgeClass}`}
                  >
                    {displayStatus}
                  </span>
                </div>

                <h6 className="text-2xl font-semibold text-slate-900">
                  {role === "MANAGER" ? (
                    <Link
                      className="transition hover:text-accent"
                      to={`/user/business/service/${quote.service_data.id}`}
                    >
                      {quote.service_name}
                    </Link>
                  ) : (
                    quote.service_name
                  )}
                </h6>

                <p className="mt-1 text-base text-slate-500">
                  Service for {quote.client_name}
                </p>

                <div className="mt-6 space-y-3 text-slate-600">
                  <div className="flex items-center gap-2">
                    <LuUser className="w-5 h-5 text-slate-400" />
                    <span>{quote.client_name}</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <LuMapPin className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                    <span>{serviceAddress}</span>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <LuCalendarDays className="w-4 h-4 text-slate-500" />
                      <span>
                        {isExpired
                          ? `Expired on ${formatDate(quote.valid_until)}`
                          : `Valid until ${formatDate(quote.valid_until)}`}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {!isSigned && (
                        <Link
                          to={`/user/business/quote/${quote.id}/preview`}
                          className="inline-flex items-center gap-2 rounded-xl border border-accent bg-white px-4 py-2 text-sm font-medium text-[#ff6a00] transition hover:bg-[#fff4ec]"
                          title={`Preview quote ${quote.quote_number} as the client sees it`}
                        >
                          <LuEye className="h-4 w-4" aria-hidden="true" />
                          Preview
                        </Link>
                      )}
                      {role === "CLIENT" && (
                        <Link
                          to={`/user/business/quote/sign/${quote.id}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-accent bg-white px-4 py-2 text-sm font-medium text-[#ff6a00] transition hover:bg-[#fff4ec]"
                          title="View Quote"
                        >
                          View Quote
                        </Link>
                      )}

                      {role === "MANAGER" && (
                        <Link
                          to={`/user/business/quote/${quote.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition border rounded-xl border-secondary bg-secondary hover:bg-secondary/95"
                          title={isSigned ? "View Quote" : "Edit Quote"}
                        >
                          {isSigned ? (
                            <LuEye className="w-4 h-4" />
                          ) : (
                            <LuPencil className="w-4 h-4" />
                          )}{" "}
                          {isSigned ? "View" : "Edit"}
                        </Link>
                      )}

                      {role === "MANAGER" && !isSigned && (
                        <button
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition border rounded-xl border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                          onClick={() => handleDeleteClick(quote.id)}
                          type="button"
                        >
                          <LuTrash2 className="w-4 h-4" /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
