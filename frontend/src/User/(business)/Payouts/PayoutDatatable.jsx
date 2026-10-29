import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useFetchPayoutsQuery } from "../../../store";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import LoadingScreen from "../../../Components/ui/LoadingScreen";
import { formatDate } from "../../../utils/formatDate";
import Select from "../../../Components/ui/Select";
import RecordsTable from "../../../Components/ui/RecordsTable";
import {
  LuCalendarDays,
  LuChevronLeft,
  LuChevronRight,
  LuDownload,
  LuEye,
  LuFileText,
  LuSearch,
} from "react-icons/lu";

export default function PayoutDatatable({ token }) {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(100);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");

  const {
    data: payoutData,
    isLoading,
    error,
  } = useFetchPayoutsQuery({ page, page_size: pageSize }, { skip: !token });

  const rows = useMemo(() => payoutData?.results || [], [payoutData]);
  const totalCount = payoutData?.count ?? rows.length;
  const currentPage = payoutData?.current_page ?? page;
  const totalPages = payoutData?.total_pages ?? 1;

  const formatMoney = (value, currency = "CAD") => {
    const amount = Number.parseFloat(value || 0);
    const currencyLabel = currency || "CAD";
    return `$${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0)} ${currencyLabel}`;
  };

  const getPayoutTotal = (row) => {
    const grossAmount = Number.parseFloat(row?.amount || 0);
    const currency = row?.currency || "CAD";
    return `${formatMoney(grossAmount, currency)} (before Stripe fees)`;
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

      let matchesDateRange = true;
      if (dateRangeStart || dateRangeEnd) {
        if (!row.processed_at) {
          matchesDateRange = false;
        } else {
          const processedDate = new Date(row.processed_at);
          if (dateRangeStart) {
            const startDate = new Date(dateRangeStart);
            startDate.setHours(0, 0, 0, 0);
            if (processedDate < startDate) matchesDateRange = false;
          }
          if (dateRangeEnd) {
            const endDate = new Date(dateRangeEnd);
            endDate.setHours(23, 59, 59, 999);
            if (processedDate > endDate) matchesDateRange = false;
          }
        }
      }

      return matchesStatus && matchesSearch && matchesDateRange;
    });
  }, [rows, searchTerm, statusFilter, dateRangeStart, dateRangeEnd]);

  // const summary = useMemo(() => {
  //   const toNumber = (value) => Number.parseFloat(value || 0);
  //   const month = new Date().getMonth();
  //   const year = new Date().getFullYear();
  //   const paidRows = rows.filter((row) => row.status === "PAID");

  //   return {
  //     totalPaidOut: paidRows.reduce(
  //       (sum, row) => sum + toNumber(row.amount),
  //       0,
  //     ),
  //     pendingRefunds: rows.filter(
  //       (row) => row.status === "PENDING" || row.status === "FAILED",
  //     ).length,
  //     processedThisMonth: paidRows
  //       .filter((row) => {
  //         if (!row.processed_at) return false;
  //         const processedAt = new Date(row.processed_at);
  //         return (
  //           processedAt.getMonth() === month &&
  //           processedAt.getFullYear() === year
  //         );
  //       })
  //       .reduce((sum, row) => sum + toNumber(row.amount), 0),
  //     totalPayouts: totalCount,
  //   };
  // }, [rows, totalCount]);

  useEffect(() => {
    if (error) {
      setAlert({
        type: "danger",
        message: error?.data?.detail || "Failed to load payout data.",
      });
    }
  }, [error]);

  const handleDateRangeApply = () => {
    if (dateRangeStart && dateRangeEnd) {
      const startDate = new Date(dateRangeStart);
      const endDate = new Date(dateRangeEnd);
      if (startDate > endDate) {
        setAlert({
          type: "warning",
          message: "Start date must be before end date.",
        });
        return;
      }
    }
    setShowDateRangeModal(false);
  };

  const handleDateRangeClear = () => {
    setDateRangeStart("");
    setDateRangeEnd("");
    setShowDateRangeModal(false);
  };

  const statusBadge = (status) => {
    if (status === "PAID") return "bg-emerald-100 text-emerald-700";
    if (status === "PENDING") return "bg-amber-100 text-amber-700";
    if (status === "REFUNDED") return "bg-sky-100 text-sky-700";
    if (status === "PARTIALLY_REFUNDED") return "bg-sky-50 text-sky-700";
    return "bg-rose-100 text-rose-700";
  };

  const handleExport = () => {
    if (!filteredRows.length) return;

    const headers = [
      "Invoice",
      "Client",
      "Service",
      "Payment Total",
      "Status",
      "Processed At",
    ];

    const csvRows = filteredRows.map((row) => [
      row.invoice_number,
      row.client_name,
      row.service_name,
      getPayoutTotal(row),
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

  if (isLoading) return <LoadingScreen />;

  // const summaryCards = [
  //   {
  //     title: "Total Paid Out",
  //     value: formatMoney(summary.totalPaidOut),
  //     description: "Across all processed payouts",
  //   },
  //   {
  //     title: "Pending Refunds",
  //     value: summary.pendingRefunds,
  //     description: "Refund requests requiring review",
  //   },
  //   {
  //     title: "Processed This Month",
  //     value: formatMoney(summary.processedThisMonth),
  //     description: "Based on payout date",
  //   },
  //   {
  //     title: "Total Payouts",
  //     value: summary.totalPayouts,
  //     description: "Completed payout records",
  //   },
  // ];

  const columns = [
    {
      key: "invoice",
      title: "Invoice",
      className: "px-4 py-3 font-semibold text-slate-900",
      render: (row) => row.invoice_number,
    },
    { key: "client", title: "Client", render: (row) => row.client_name },
    { key: "service", title: "Service", render: (row) => row.service_name },
    {
      key: "total",
      title: "Payment Total",
      render: (row) => getPayoutTotal(row),
    },
    {
      key: "status",
      title: "Status",
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${statusBadge(row.status)}`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "processed",
      title: "Processed At",
      render: (row) => (row.processed_at ? formatDate(row.processed_at) : "—"),
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1">
          <Link
            to={`/user/business/payout/${row.id}`}
            className="rounded-xl p-2 text-secondary hover:bg-secondary/5"
            title="View Payout"
            aria-label={`View payout for invoice ${row.invoice_number}`}
          >
            <LuEye className="h-4 w-4" />
          </Link>
        </div>
      ),
    },
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
        {/* <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">{card.title}</p>
              <p className="mt-2 text-3xl font-medium text-slate-900">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-slate-500">{card.description}</p>
            </div>
          ))}
        </div> */}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <h4 className="text-xl font-medium text-slate-900">
              Payout History
            </h4>
            <p className="mt-1 text-sm text-slate-500">
              View processed payouts, related invoices, and available refund
              actions.
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
                  onClick={() => setShowDateRangeModal(true)}
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
                  fieldClass="h-10 text-sm"
                  options={[
                    { value: "ALL", label: "All Status" },
                    { value: "PENDING", label: "Pending" },
                    { value: "PAID", label: "Paid" },
                    { value: "FAILED", label: "Failed" },
                    { value: "PARTIALLY_REFUNDED", label: "Partially refunded" },
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
                onClick={() => setShowDateRangeModal(true)}
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
                  fieldClass="h-10 text-sm"
                  options={[
                    { value: "ALL", label: "All Status" },
                    { value: "PENDING", label: "Pending" },
                    { value: "PAID", label: "Paid" },
                    { value: "FAILED", label: "Failed" },
                    { value: "PARTIALLY_REFUNDED", label: "Partially refunded" },
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
            </div>
          </div>

          <RecordsTable
            columns={columns}
            rows={filteredRows}
            rowKey={(row) => row.id}
            empty={
              <div className="mx-auto flex max-w-md flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-slate-400">
                  <LuFileText className="h-8 w-8" />
                </div>
                <h5 className="mt-5 text-xl font-medium text-slate-900">
                  {rows.length
                    ? "No payouts match your filters."
                    : "No payouts yet"}
                </h5>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {rows.length
                    ? "Try adjusting the search, status, or date range filters."
                    : "Processed payouts will appear here once client payments are completed."}
                </p>
                {!rows.length && (
                  <Link
                    to="/user/business/invoices"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-gray-300 hover:bg-gray-50"
                  >
                    <LuFileText className="h-4 w-4" />
                    View Invoices
                  </Link>
                )}
              </div>
            }
            footer={
              <>
                <p>
                  Showing {filteredRows.length} of {totalCount} payouts
                </p>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <p className="text-slate-500">
                    Page {currentPage} of {totalPages}
                  </p>
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-400 transition disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() =>
                      setPage((nextPage) => Math.max(1, nextPage - 1))
                    }
                    disabled={currentPage <= 1}
                    aria-label="Previous page"
                  >
                    <LuChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl bg-accent px-3 text-sm font-semibold text-white"
                    aria-label={`Current page ${currentPage}`}
                    aria-current="page"
                  >
                    {currentPage}
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-400 transition disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() =>
                      setPage((nextPage) => Math.min(totalPages, nextPage + 1))
                    }
                    disabled={currentPage >= totalPages}
                    aria-label="Next page"
                  >
                    <LuChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            }
          />
        </div>

        {showDateRangeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="fixed inset-0 bg-gray-900/40"
              onClick={() => setShowDateRangeModal(false)}
            ></div>

            <div className="relative z-50 w-full md:w-4/7 lg:w-2/7 max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-slate-900">
                Filter by Date Range
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Select start and end dates to filter payouts
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRangeStart}
                    onChange={(e) => setDateRangeStart(e.target.value)}
                    className="mt-2 h-10 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRangeEnd}
                    onChange={(e) => setDateRangeEnd(e.target.value)}
                    className="mt-2 h-10 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleDateRangeClear}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-gray-300 hover:bg-gray-50"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setShowDateRangeModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDateRangeApply}
                  className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
