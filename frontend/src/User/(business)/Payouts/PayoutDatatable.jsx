import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { payoutApi, useFetchPayoutsPageQuery } from "../../../store";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import LoadingScreen from "../../../Components/ui/LoadingScreen";
import { formatDate } from "../../../utils/formatDate";
import Select from "../../../Components/ui/Select";
import RecordsTable from "../../../Components/ui/RecordsTable";
import RecordLink from "../../../Components/ui/RecordLink";
import BulkActionBar from "../../../Components/ui/BulkActionBar";
import TablePagination from "../../../Components/ui/TablePagination";
import useServerTable from "../../../hooks/useServerTable";
import {
  LuCalendarDays,
  LuDownload,
  LuEye,
  LuFileText,
  LuSearch,
  LuX,
} from "react-icons/lu";

const INITIAL_FILTERS = { status: "", processed_from: "", processed_to: "" };

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "FAILED", label: "Failed" },
  { value: "PARTIALLY_REFUNDED", label: "Partially refunded" },
  { value: "REFUNDED", label: "Refunded" },
];

// Payouts have no server bulk actions; exporting runs in the browser.
const BULK_ACTIONS = [
  {
    key: "export",
    label: "Export selected (CSV)",
    confirmLabel: "Download CSV",
    confirmMessage: (count) =>
      `Download ${count} selected payout${count === 1 ? "" : "s"} as a CSV file?`,
  },
];

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

function downloadCsv(filename, rows) {
  const headers = [
    "Invoice",
    "Client",
    "Service",
    "Payment Total",
    "Status",
    "Processed At",
  ];

  const csvRows = rows.map((row) => [
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
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function PayoutDatatable({ token, role }) {
  const table = useServerTable({
    initialOrdering: "-created_at",
    initialFilters: INITIAL_FILTERS,
  });
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [dateDraft, setDateDraft] = useState({ from: "", to: "" });
  const [alert, setAlert] = useState({ type: "", message: "" });

  const { data, isLoading, isFetching, error } = useFetchPayoutsPageQuery(
    table.queryArgs,
    { skip: !token },
  );
  const [fetchAllPayouts, { isFetching: exporting }] =
    payoutApi.endpoints.fetchPayoutsPage.useLazyQuery();

  const rows = data?.results || [];
  const isManager = role === "MANAGER";
  const { processed_from: processedFrom, processed_to: processedTo } =
    table.filters;

  useEffect(() => {
    if (error) {
      setAlert({
        type: "danger",
        message: error?.data?.detail || "Failed to load payout data.",
      });
    }
  }, [error]);

  const openDateRange = () => {
    setDateDraft({ from: processedFrom || "", to: processedTo || "" });
    setShowDateRangeModal(true);
  };

  const handleDateRangeApply = () => {
    if (dateDraft.from && dateDraft.to && dateDraft.from > dateDraft.to) {
      setAlert({
        type: "warning",
        message: "Start date must be before end date.",
      });
      return;
    }
    table.setFilter("processed_from", dateDraft.from);
    table.setFilter("processed_to", dateDraft.to);
    setShowDateRangeModal(false);
  };

  const handleDateRangeClear = () => {
    table.setFilter("processed_from", "");
    table.setFilter("processed_to", "");
    setShowDateRangeModal(false);
  };

  // Without a page param the server returns every payout matching the
  // current search, filters and sort order.
  const handleExport = async () => {
    const args = { ...table.queryArgs };
    delete args.page;
    delete args.page_size;
    try {
      const allRows = await fetchAllPayouts(args).unwrap();
      if (!allRows?.length) {
        setAlert({ type: "warning", message: "There are no payouts to export." });
        return;
      }
      downloadCsv("payouts.csv", allRows);
    } catch (err) {
      setAlert({
        type: "danger",
        message: err?.data?.detail || "Failed to export payouts.",
      });
    }
  };

  // Selection is cleared on every page change, so the selected rows are
  // always on the current page.
  const runBulkAction = async () => {
    const selected = rows.filter((row) => table.selectedIds.includes(row.id));
    downloadCsv("payouts-selected.csv", selected);
    table.clearSelection();
    return { succeeded: selected.length, failed: 0, results: [] };
  };

  const statusBadge = (status) => {
    if (status === "PAID") return "bg-emerald-100 text-emerald-700";
    if (status === "PENDING") return "bg-amber-100 text-amber-700";
    if (status === "REFUNDED") return "bg-sky-100 text-sky-700";
    if (status === "PARTIALLY_REFUNDED") return "bg-sky-50 text-sky-700";
    return "bg-rose-100 text-rose-700";
  };

  if (isLoading) return <LoadingScreen />;

  const columns = [
    {
      key: "invoice",
      title: "Invoice",
      sortKey: "invoice__invoice_number",
      className: "px-4 py-3 font-semibold text-slate-900",
      render: (row) => (
        <RecordLink
          to={row.invoice ? `/user/business/invoice/${row.invoice}` : null}
          className="text-slate-900"
        >
          {row.invoice_number}
        </RecordLink>
      ),
    },
    {
      key: "client",
      title: "Client",
      sortKey: "invoice__client__name",
      render: (row) => (
        <RecordLink to={row.client ? `/user/business/client/${row.client}` : null}>
          {row.client_name}
        </RecordLink>
      ),
    },
    {
      key: "service",
      title: "Service",
      render: (row) => (
        <RecordLink to={row.service ? `/user/business/service/${row.service}` : null}>
          {row.service_name}
        </RecordLink>
      ),
    },
    {
      key: "total",
      title: "Payment Total",
      sortKey: "amount",
      render: (row) => getPayoutTotal(row),
    },
    {
      key: "status",
      title: "Status",
      sortKey: "status",
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
      sortKey: "processed_at",
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

  const searchInput = (
    <div className="relative flex-1">
      <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={table.searchInput}
        onChange={(event) => table.setSearchInput(event.target.value)}
        placeholder="Search invoice, client, or service"
        className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
    </div>
  );

  const dateRangeLabel =
    processedFrom || processedTo
      ? `Processed ${processedFrom ? formatDate(processedFrom) : "…"} – ${processedTo ? formatDate(processedTo) : "…"}`
      : "Date Range";

  const dateRangeButtonClass = `inline-flex h-10 items-center gap-2 rounded-xl border bg-white text-sm font-semibold transition hover:bg-gray-50 ${
    processedFrom || processedTo
      ? "border-accent text-accent"
      : "border-gray-200 text-slate-600 hover:border-gray-300"
  }`;

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
              {searchInput}

              <div className="gap-2 grid grid-cols-1 md:grid-cols-4">
                <button
                  type="button"
                  onClick={openDateRange}
                  className={`${dateRangeButtonClass} w-full justify-center px-3`}
                >
                  <LuCalendarDays className="h-4 w-4 text-slate-400" />
                  <span className="truncate">{dateRangeLabel}</span>
                </button>

                <Select
                  id="payout-status-filter-mobile"
                  label=""
                  value={table.filters.status}
                  onChange={(value) => table.setFilter("status", value)}
                  fieldClass="h-10 text-sm"
                  options={STATUS_OPTIONS}
                />

                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exporting}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60"
                >
                  <LuDownload className="h-4 w-4" />
                  <span className="truncate">Export</span>
                </button>
              </div>
            </div>

            <div className="mt-6 hidden lg:flex lg:flex-row lg:items-end gap-3">
              {searchInput}

              <button
                type="button"
                onClick={openDateRange}
                className={`${dateRangeButtonClass} px-4`}
              >
                <LuCalendarDays className="h-4 w-4 text-slate-400" />
                {dateRangeLabel}
              </button>

              <div className="min-w-40">
                <Select
                  id="payout-status-filter"
                  label=""
                  value={table.filters.status}
                  onChange={(value) => table.setFilter("status", value)}
                  fieldClass="h-10 text-sm"
                  options={STATUS_OPTIONS}
                />
              </div>

              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60"
              >
                <LuDownload className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {isManager && (
            <BulkActionBar
              selectedCount={table.selectedIds.length}
              actions={BULK_ACTIONS}
              onRun={runBulkAction}
              onClear={table.clearSelection}
            />
          )}

          <RecordsTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            ordering={table.ordering}
            onSort={table.toggleSort}
            isFetching={isFetching}
            selection={
              isManager
                ? {
                    selectedIds: table.selectedIds,
                    onToggle: table.toggleSelected,
                    onToggleAll: table.toggleAllSelected,
                  }
                : undefined
            }
            empty={
              <div className="mx-auto flex max-w-md flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-slate-400">
                  <LuFileText className="h-8 w-8" />
                </div>
                <h5 className="mt-5 text-xl font-medium text-slate-900">
                  {table.hasActiveFilters
                    ? "No payouts match your filters."
                    : "No payouts yet"}
                </h5>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {table.hasActiveFilters
                    ? "Try adjusting the search, status, or date range filters."
                    : "Processed payouts will appear here once client payments are completed."}
                </p>
                {table.hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={table.resetFilters}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-600"
                  >
                    <LuX className="h-4 w-4" />
                    Clear Filters
                  </button>
                ) : (
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
              <TablePagination
                page={table.page}
                pageSize={table.pageSize}
                count={data?.count}
                totalPages={data?.total_pages}
                isFetching={isFetching}
                noun="payouts"
                onPageChange={table.goToPage}
                onPageSizeChange={table.setPageSize}
              />
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
                Show payouts processed between these dates.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="payout-processed-from"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Start Date
                  </label>
                  <input
                    id="payout-processed-from"
                    type="date"
                    value={dateDraft.from}
                    onChange={(e) =>
                      setDateDraft((draft) => ({ ...draft, from: e.target.value }))
                    }
                    className="mt-2 h-10 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="payout-processed-to"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    End Date
                  </label>
                  <input
                    id="payout-processed-to"
                    type="date"
                    value={dateDraft.to}
                    onChange={(e) =>
                      setDateDraft((draft) => ({ ...draft, to: e.target.value }))
                    }
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
