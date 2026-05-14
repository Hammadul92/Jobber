import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useFetchPayoutsQuery, useDeletePayoutMutation } from "../../../store";
import SubmitButton from "../../../Components/ui/SubmitButton";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import { formatDate } from "../../../utils/formatDate";
import Select from "../../../Components/ui/Select";
import {
  LuCalendarDays,
  LuChevronLeft,
  LuChevronRight,
  LuDownload,
  LuFileText,
  LuRefreshCcw,
  LuSearch,
} from "react-icons/lu";

export default function PayoutDatatable({ token, role }) {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(100);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [selectedPayoutId, setSelectedPayoutId] = useState(null);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const {
    data: payoutData,
    isLoading,
    error,
    refetch,
  } = useFetchPayoutsQuery({ page, page_size: pageSize }, { skip: !token });
  const [deletePayout, { isLoading: deleting }] = useDeletePayoutMutation();

  const rows = useMemo(() => payoutData?.results || [], [payoutData]);
  const totalCount = payoutData?.count ?? rows.length;
  const currentPage = payoutData?.current_page ?? page;
  const totalPages = payoutData?.total_pages ?? 1;
  const currency = rows.find((row) => row.currency)?.currency || "USD";

  const formatMoney = (amount) => {
    const symbol =
      currency === "CAD" || currency === "USD"
        ? "$"
        : currency === "EUR"
          ? "€"
          : currency === "GBP"
            ? "£"
            : `${currency} `;

    return `${symbol}${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount || 0))}`;
  };

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesStatus =
        statusFilter === "ALL" || row.status === statusFilter;

      const matchesSearch =
        !normalizedSearch ||
        [row.invoice_number, row.client_name, row.service_name]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch));

      return matchesStatus && matchesSearch;
    });
  }, [rows, searchTerm, statusFilter]);

  const summary = useMemo(() => {
    const toNumber = (value) => Number.parseFloat(value || 0);
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    const paidRows = rows.filter((row) => row.status === "PAID");

    return {
      totalPaidOut: paidRows.reduce((sum, row) => sum + toNumber(row.amount), 0),
      pendingRefunds: rows.filter(
        (row) => row.status === "PENDING" || row.status === "FAILED",
      ).length,
      processedThisMonth: paidRows
        .filter((row) => {
          if (!row.processed_at) return false;
          const processedAt = new Date(row.processed_at);
          return (
            processedAt.getMonth() === month &&
            processedAt.getFullYear() === year
          );
        })
        .reduce((sum, row) => sum + toNumber(row.amount), 0),
      totalPayouts: totalCount,
    };
  }, [rows, totalCount]);

  useEffect(() => {
    if (error) {
      setAlert({
        type: "danger",
        message: error?.data?.detail || "Failed to load payout data.",
      });
    }
  }, [error]);

  const handleDeleteClick = (id) => {
    setSelectedPayoutId(id);
    setShowModal(true);
  };

  const confirmDelete = async (e) => {
    e.preventDefault();
    if (!selectedPayoutId) return;

    try {
      await deletePayout(selectedPayoutId).unwrap();
      setAlert({ type: "success", message: "Payout deleted successfully!" });
      setShowModal(false);
      setSelectedPayoutId(null);
      refetch();
    } catch (err) {
      setAlert({
        type: "danger",
        message: err?.data?.detail || "Failed to delete payout.",
      });
    }
  };

  const statusBadge = (status) => {
    if (status === "PAID") return "bg-emerald-100 text-emerald-700";
    if (status === "PENDING") return "bg-amber-100 text-amber-700";
    if (status === "REFUNDED") return "bg-sky-100 text-sky-700";
    return "bg-rose-100 text-rose-700";
  };

  const handleExport = () => {
    if (!filteredRows.length) return;

    const headers = [
      "Invoice",
      "Client",
      "Service",
      "Payout Total",
      "Status",
      "Processed At",
    ];

    const csvRows = filteredRows.map((row) => [
      row.invoice_number,
      row.client_name,
      row.service_name,
      row.payout_total,
      row.status,
      row.processed_at ? formatDate(row.processed_at) : "",
    ]);

    const csv = [headers, ...csvRows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "payouts.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading)
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        Loading payouts...
      </div>
    );

  const summaryCards = [
    {
      title: "Total Paid Out",
      value: formatMoney(summary.totalPaidOut),
      description: "Across all processed payouts",
    },
    {
      title: "Pending Refunds",
      value: summary.pendingRefunds,
      description: "Refund requests requiring review",
    },
    {
      title: "Processed This Month",
      value: formatMoney(summary.processedThisMonth),
      description: "Based on payout date",
    },
    {
      title: "Total Payouts",
      value: summary.totalPayouts,
      description: "Completed payout records",
    },
  ];

  const columns = [
    { name: "invoice_number", title: "Invoice" },
    { name: "client_name", title: "Client" },
    { name: "service_name", title: "Service" },
    { name: "payout_total", title: "Payout Total" },
    { name: "status", title: "Status" },
    { name: "processed_at", title: "Processed At" },
    { name: "actions", title: "Actions" },
  ];

  return (
    <>
      {alert.message && (
        <AlertDispatcher
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: "", message: "" })}
        />
      )}

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">{card.title}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-slate-500">{card.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <h4 className="text-xl font-semibold text-slate-900">Payout History</h4>
            <p className="mt-1 text-sm text-slate-500">
              View processed payouts, related invoices, and available refund actions.
            </p>

            <div className="mt-6 flex flex-col gap-3 lg:hidden">
              <div className="relative">
                <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search invoice, client, or service"
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div className="gap-2 grid grid-cols-1 md:grid-cols-4">
                <button
                  type="button"
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-gray-300 hover:bg-gray-50"
                >
                  <LuCalendarDays className="h-4 w-4 text-slate-400" />
                  <span className="truncate">Date Range</span>
                </button>

                <Select
                  id="payout-status-filter-mobile"
                  label=""
                  value={statusFilter}
                  onChange={setStatusFilter}
                  fieldClass="h-10 text-sm -mb-6"
                  options={[
                    { value: "ALL", label: "All Status" },
                    { value: "PENDING", label: "Pending" },
                    { value: "PAID", label: "Paid" },
                    { value: "FAILED", label: "Failed" },
                    { value: "REFUNDED", label: "Refunded" },
                  ]}
                />

                <button
                  type="button"
                  onClick={handleExport}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-gray-300 hover:bg-gray-50"
                >
                  <LuDownload className="h-4 w-4" />
                  <span className="truncate">Export</span>
                </button>

                <button
                  type="button"
                  onClick={() => refetch()}
                  className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-600 transition hover:border-gray-300 hover:bg-gray-50"
                  aria-label="Refresh payouts"
                >
                  <LuRefreshCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-6 hidden lg:flex lg:flex-row lg:items-end gap-3">
              <div className="relative flex-1">
                <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search invoice, client, or service"
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-gray-300 hover:bg-gray-50"
              >
                <LuCalendarDays className="h-4 w-4 text-slate-400" />
                Date Range
              </button>

              <div className="min-w-40">
                <Select
                  id="payout-status-filter"
                  label=""
                  value={statusFilter}
                  onChange={setStatusFilter}
                  fieldClass="h-10 text-sm -mb-6"
                  options={[
                    { value: "ALL", label: "All Status" },
                    { value: "PENDING", label: "Pending" },
                    { value: "PAID", label: "Paid" },
                    { value: "FAILED", label: "Failed" },
                    { value: "REFUNDED", label: "Refunded" },
                  ]}
                />
              </div>

              <button
                type="button"
                onClick={handleExport}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-gray-300 hover:bg-gray-50"
              >
                <LuDownload className="h-4 w-4" />
                Export
              </button>

              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-600 transition hover:border-gray-300 hover:bg-gray-50"
                aria-label="Refresh payouts"
              >
                <LuRefreshCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.name}
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {col.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {filteredRows.length ? (
                    filteredRows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {row.invoice_number}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{row.client_name}</td>
                        <td className="px-4 py-3 text-slate-700">{row.service_name}</td>
                        <td className="px-4 py-3 text-slate-700">{row.payout_total}</td>
                        <td className="px-4 py-3 text-slate-700">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${statusBadge(row.status)}`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {row.processed_at ? formatDate(row.processed_at) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/user/business/payout/${row.id}`}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-secondary transition hover:border-secondary hover:text-accent"
                              title="View Payout"
                            >
                              View
                            </Link>

                            {role === "MANAGER" && (
                              <button
                                type="button"
                                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-rose-200 hover:text-rose-700"
                                onClick={() => handleDeleteClick(row.id)}
                                title="Delete Payout"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-20">
                        <div className="mx-auto flex max-w-md flex-col items-center text-center">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-slate-400">
                            <LuFileText className="h-8 w-8" />
                          </div>
                          <h5 className="mt-5 text-xl font-semibold text-slate-900">
                            No payouts yet
                          </h5>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            Processed payouts will appear here once client payments are completed.
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            You can use filters or search once payout records are available.
                          </p>
                          <Link
                            to="/user/business/invoices"
                            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-gray-300 hover:bg-gray-50"
                          >
                            <LuFileText className="h-4 w-4" />
                            View Invoices
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Showing {filteredRows.length} of {totalCount} payouts
              </p>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <p className="text-slate-500">Page {currentPage} of {totalPages}</p>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-400 transition disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setPage((nextPage) => Math.max(1, nextPage - 1))}
                  disabled={currentPage <= 1}
                  aria-label="Previous page"
                >
                  <LuChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl bg-accent px-3 text-sm font-semibold text-white"
                >
                  {currentPage}
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-400 transition disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setPage((nextPage) => Math.min(totalPages, nextPage + 1))}
                  disabled={currentPage >= totalPages}
                  aria-label="Next page"
                >
                  <LuChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="fixed inset-0 bg-gray-900/40"
              onClick={() => setShowModal(false)}
            ></div>

            <form
              onSubmit={confirmDelete}
              className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between">
                <h5 className="text-lg font-semibold text-gray-900">
                  Delete Payout
                </h5>
                <button
                  type="button"
                  className="text-gray-400 transition hover:text-gray-600"
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <p className="mt-3 text-sm text-gray-600">
                Are you sure you want to delete this payout?
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <SubmitButton
                  isLoading={deleting}
                  btnClass="bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"
                  btnName="Delete"
                />
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
