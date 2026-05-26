import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useFetchQuotesQuery, useDeleteQuoteMutation } from "../../../store";
import Select from "../../../Components/ui/Select";
import SubmitButton from "../../../Components/ui/SubmitButton";
import { formatDate } from "../../../utils/formatDate";
import { LuCalendarDays, LuMapPin, LuUser, LuPencil, LuTrash2 } from "react-icons/lu";

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

  const quotes = quoteData || [];

  const uniqueServices = useMemo(
    () => [...new Set(quotes.map((q) => q.service_name).filter(Boolean))],
    [quotes],
  );
  const uniqueClients = useMemo(
    () => [...new Set(quotes.map((q) => q.client_name).filter(Boolean))],
    [quotes],
  );
  const uniqueStatuses = useMemo(
    () => [...new Set(quotes.map((q) => q.status).filter(Boolean))],
    [quotes],
  );

  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      const matchService = !serviceFilter || q.service_name === serviceFilter;
      const matchClient = !clientFilter || q.client_name === clientFilter;
      const matchStatus = !statusFilter || q.status === statusFilter;
      return matchService && matchClient && matchStatus;
    });
  }, [quotes, serviceFilter, clientFilter, statusFilter]);

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

  if (isLoading) return <div>Loading quotes...</div>;

  const today = new Date();

  return (
    <>
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
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
              ...uniqueStatuses.map((status) => ({ value: status, label: status })),
            ]}
            fieldClass="h-11 rounded-lg border-gray-200 bg-white px-3 text-sm text-slate-700"
          />
        </div>
      </div>

      {filteredQuotes.length === 0 ? (
        <div className="min-h-[65vh] rounded-xl border border-dashed border-gray-200 bg-white text-center">
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-gray-600">
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
            const validUntilDate = quote.valid_until
              ? new Date(quote.valid_until)
              : null;
            const isExpired = validUntilDate && validUntilDate < today;

            let badgeClass = "bg-slate-100 text-slate-500";
            let badgeText = quote.status;

            if (isExpired && quote.status !== "SIGNED") {
              badgeClass = "bg-rose-100 text-rose-700";
              badgeText = "EXPIRED";
            } else if (quote.status === "SIGNED") {
              badgeClass = "bg-emerald-100 text-emerald-700";
            } else if (quote.status === "DECLINED") {
              badgeClass = "bg-rose-100 text-rose-700";
            } else if (quote.status === "DRAFT") {
              badgeClass = "bg-slate-100 text-slate-500";
            }

            const serviceData = quote.service_data || {};
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
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                key={quote.quote_number}
              >
                <div className="mb-6 flex items-start justify-between gap-3">
                  <h5 className="text-xl font-medium tracking-tight text-[#ff6a00]">
                    {quote.quote_number}
                  </h5>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.04em] ${badgeClass}`}
                  >
                    {badgeText}
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
                    <LuUser className="h-5 w-5 text-slate-400" />
                    <span>{quote.client_name}</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <LuMapPin className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                    <span>{serviceAddress}</span>
                  </div>
                </div>

                <div className="mt-6 border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <LuCalendarDays className="h-4 w-4 text-slate-500" />
                      <span>
                        {isExpired && quote.status !== "SIGNED"
                          ? `Expired on ${formatDate(quote.valid_until)}`
                          : `Valid until ${formatDate(quote.valid_until)}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {role === "MANAGER" && (
                        <Link
                          to={`/user/business/quote/${quote.id}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-secondary bg-secondary px-4 py-2 text-sm font-medium text-white transition hover:bg-secondary/95"
                          title="Edit Quote"
                        >
                          <LuPencil className="h-4 w-4" /> Edit
                        </Link>
                      )}

                      {role === "MANAGER" && (
                        <button
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100"
                          onClick={() => handleDeleteClick(quote.id)}
                          type="button"
                        >
                          <LuTrash2 className="h-4 w-4" /> Delete
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-1/4 rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h5 className="text-xl font-medium text-gray-900">
                Delete Quote
              </h5>
              <button
                type="button"
                className="text-gray-600 transition hover:text-gray-900 text-2xl"
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
                className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
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
