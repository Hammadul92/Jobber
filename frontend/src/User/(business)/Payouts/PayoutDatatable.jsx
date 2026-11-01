import { useEffect } from "react";
import { Link } from "react-router-dom";
import { payoutApi, useFetchPayoutsPageQuery } from "../../../store";
import LoadingScreen from "../../../Components/ui/LoadingScreen";
import { formatDate } from "../../../utils/formatDate";
import TableToolbar, {
  ToolbarDate,
  ToolbarSelect,
  tableCardClass,
  toolbarButtonClass,
} from "../../../Components/ui/TableToolbar";
import RecordsTable from "../../../Components/ui/RecordsTable";
import RecordLink from "../../../Components/ui/RecordLink";
import BulkActionBar from "../../../Components/ui/BulkActionBar";
import { pluralize } from "../../../utils/pluralize";
import TablePagination from "../../../Components/ui/TablePagination";
import useServerTable from "../../../hooks/useServerTable";
import {
  LuDownload,
  LuEye,
  LuFileText,
  LuX,
} from "react-icons/lu";
import useAlert from "../../../hooks/useAlert";

const INITIAL_FILTERS = { status: "", processed_from: "", processed_to: "" };

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
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
      `Download ${pluralize(count, "selected payout")} as a CSV file?`,
    successMessage: (count) => `${pluralize(count, "payout")} exported.`,
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
    storageKey: "payouts",
    initialOrdering: "-created_at",
    initialFilters: INITIAL_FILTERS,
  });
  const setAlert = useAlert();

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
  }, [error, setAlert]);

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

  return (
    <>
      <div className="space-y-6">
        <div className={tableCardClass}>
          <TableToolbar
            title="Payout History"
            description="View processed payouts, related invoices, and available refund actions."
            searchValue={table.searchInput}
            onSearchChange={table.setSearchInput}
            searchPlaceholder="Search invoice, client or service"
            isFiltered={table.hasActiveFilters}
            onClear={table.resetFilters}
            actions={
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className={toolbarButtonClass}
              >
                <LuDownload className="h-4 w-4" />
                Export
              </button>
            }
          >
            <ToolbarSelect
              id="payout-status-filter"
              label="Status"
              value={table.filters.status}
              onChange={(value) => table.setFilter("status", value)}
              options={STATUS_OPTIONS}
            />
            <ToolbarDate
              id="payout-processed-from"
              label="Processed from"
              value={processedFrom}
              max={processedTo}
              onChange={(value) => table.setFilter("processed_from", value)}
            />
            <ToolbarDate
              id="payout-processed-to"
              label="Processed to"
              value={processedTo}
              min={processedFrom}
              onChange={(value) => table.setFilter("processed_to", value)}
            />
          </TableToolbar>

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
      </div>
    </>
  );
}
