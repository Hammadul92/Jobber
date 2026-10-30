import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  invoiceApi,
  useFetchInvoicesPageQuery,
  useDeleteInvoiceMutation,
  useBulkInvoicesMutation,
} from "../../../store";
import SubmitButton from "../../../Components/ui/SubmitButton";
import LoadingScreen from "../../../Components/ui/LoadingScreen";
import RecordsTable from "../../../Components/ui/RecordsTable";
import RecordLink from "../../../Components/ui/RecordLink";
import BulkActionBar from "../../../Components/ui/BulkActionBar";
import { pluralize } from "../../../utils/pluralize";
import TablePagination from "../../../Components/ui/TablePagination";
import useServerTable from "../../../hooks/useServerTable";
import { formatDate } from "../../../utils/formatDate";
import { isInvoicePastDue } from "../../../utils/paymentTerms";
import Select from "../../../Components/ui/Select";
import {
  LuCalendarDays,
  LuDownload,
  LuEye,
  LuFileText,
  LuPlus,
  LuSearch,
  LuTrash2,
  LuX,
} from "react-icons/lu";
import useAlert from "../../../hooks/useAlert";

const INITIAL_FILTERS = { status: "", due_from: "", due_to: "" };

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "PAID", label: "Paid" },
  { value: "CANCELLED", label: "Cancelled" },
];

const BULK_ACTIONS = [
  {
    key: "send",
    label: "Send invoices",
    tone: "primary",
    confirmMessage: (count) =>
      `Email ${pluralize(count, "selected invoice")} to their clients? Drafts are sent and already-sent invoices are re-sent. Paid or cancelled invoices, and any whose due date has passed, are skipped.`,
    successMessage: (count) => `${pluralize(count, "invoice")} sent.`,
  },
  {
    key: "delete",
    label: "Delete",
    tone: "danger",
    confirmMessage: (count) =>
      `Delete ${pluralize(count, "selected invoice")}? Paid or refunded invoices are kept.`,
    successMessage: (count) => `${pluralize(count, "invoice")} deleted.`,
  },
];

const displayStatus = (row) => (isInvoicePastDue(row) ? "OVERDUE" : row.status);

function downloadCsv(filename, rows) {
  const headers = [
    "Invoice",
    "Business",
    "Client",
    "Service",
    "Total",
    "Status",
    "Due Date",
  ];

  const csvRows = rows.map((row) => [
    row.invoice_number,
    row.business_name,
    row.client_name,
    row.service_name,
    row.total_amount,
    displayStatus(row),
    row.due_date ? formatDate(row.due_date) : "",
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

export default function InvoiceDatatable({ token, role, onAddInvoice }) {
  const table = useServerTable({
    initialOrdering: "-created_at",
    initialFilters: INITIAL_FILTERS,
  });
  const [showModal, setShowModal] = useState(false);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [dateDraft, setDateDraft] = useState({ from: "", to: "" });
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const setAlert = useAlert();

  const { data, isLoading, isFetching, error } = useFetchInvoicesPageQuery(
    table.queryArgs,
    { skip: !token },
  );
  const [deleteInvoice, { isLoading: deleting }] = useDeleteInvoiceMutation();
  const [bulkInvoices] = useBulkInvoicesMutation();
  const [fetchAllInvoices, { isFetching: exporting }] =
    invoiceApi.endpoints.fetchInvoicesPage.useLazyQuery();

  const rows = data?.results || [];
  const isManager = role === "MANAGER";
  const currency = rows.find((row) => row.currency)?.currency || "USD";
  const { due_from: dueFrom, due_to: dueTo } = table.filters;

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

  useEffect(() => {
    if (error) {
      setAlert({
        type: "danger",
        message: error?.data?.detail || "Failed to load invoice data.",
      });
    }
  }, [error, setAlert]);

  const handleDeleteClick = (id) => {
    setSelectedInvoiceId(id);
    setShowModal(true);
  };

  const confirmDelete = async (event) => {
    event.preventDefault();
    if (!selectedInvoiceId) return;

    try {
      await deleteInvoice(selectedInvoiceId).unwrap();
      setAlert({ type: "success", message: "Invoice deleted successfully!" });
      setShowModal(false);
      setSelectedInvoiceId(null);
    } catch (err) {
      setAlert({
        type: "danger",
        message: err?.data?.detail || "Failed to delete invoice.",
      });
    }
  };

  const runBulkAction = async (action) => {
    const result = await bulkInvoices({
      action,
      ids: table.selectedIds,
    }).unwrap();
    table.clearSelection();
    return result;
  };

  const invoiceNumberFor = (id) =>
    rows.find((row) => String(row.id) === String(id))?.invoice_number ||
    `#${id}`;

  const openDateRange = () => {
    setDateDraft({ from: dueFrom || "", to: dueTo || "" });
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
    table.setFilter("due_from", dateDraft.from);
    table.setFilter("due_to", dateDraft.to);
    setShowDateRangeModal(false);
  };

  const handleDateRangeClear = () => {
    table.setFilter("due_from", "");
    table.setFilter("due_to", "");
    setShowDateRangeModal(false);
  };

  // Without a page param the server returns every invoice matching the
  // current search, filters and sort order.
  const handleExport = async () => {
    const args = { ...table.queryArgs };
    delete args.page;
    delete args.page_size;
    try {
      const allRows = await fetchAllInvoices(args).unwrap();
      if (!allRows?.length) {
        setAlert({ type: "warning", message: "There are no invoices to export." });
        return;
      }
      downloadCsv("invoices.csv", allRows);
    } catch (err) {
      setAlert({
        type: "danger",
        message: err?.data?.detail || "Failed to export invoices.",
      });
    }
  };

  const dateRangeLabel =
    dueFrom || dueTo
      ? `Due ${dueFrom ? formatDate(dueFrom) : "…"} – ${dueTo ? formatDate(dueTo) : "…"}`
      : "Date Range";

  const statusBadge = (status) => {
    if (status === "PAID") return "bg-emerald-100 text-emerald-700";
    if (status === "SENT") return "bg-sky-100 text-sky-700";
    if (status === "OVERDUE") return "bg-amber-100 text-amber-700";
    if (status === "CANCELLED") return "bg-rose-100 text-rose-700";
    return "bg-slate-100 text-slate-700";
  };

  // "Overdue" is its own server filter (sent and past due), not a status.
  const statusFilterValue = table.filters.overdue ? "OVERDUE" : table.filters.status || "";
  const setStatusFilter = (value) => {
    table.setFilter("overdue", value === "OVERDUE" ? "true" : "");
    table.setFilter("status", value === "OVERDUE" ? "" : value);
  };

  const columns = [
    {
      key: "invoice",
      title: "Invoice",
      sortKey: "invoice_number",
      className: "px-4 py-3 font-semibold text-slate-900",
      render: (row) => (
        <RecordLink to={`/user/business/invoice/${row.id}`} className="text-slate-900">
          {row.invoice_number}
        </RecordLink>
      ),
    },
    { key: "business", title: "Business", render: (row) => row.business_name },
    {
      key: "client",
      title: "Client",
      sortKey: "client__name",
      render: (row) => (
        <RecordLink
          to={isManager && row.client ? `/user/business/client/${row.client}` : null}
        >
          {row.client_name}
        </RecordLink>
      ),
    },
    {
      key: "service",
      title: "Service",
      sortKey: "service__service_name",
      render: (row) => (
        <RecordLink
          to={isManager && row.service ? `/user/business/service/${row.service}` : null}
        >
          {row.service_name}
        </RecordLink>
      ),
    },
    {
      key: "total",
      title: "Total",
      sortKey: "total_amount",
      render: (row) => formatMoney(row.total_amount),
    },
    {
      key: "status",
      title: "Status",
      sortKey: "status",
      render: (row) => {
        const status = displayStatus(row);
        return (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${statusBadge(status)}`}
          >
            {status}
          </span>
        );
      },
    },
    {
      key: "due",
      title: "Due Date",
      sortKey: "due_date",
      render: (row) =>
        row.due_date ? formatDate(row.due_date) : "Set when sent",
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1">
          <Link
            to={`/user/business/invoice/${row.id}`}
            className="rounded-xl p-2 text-secondary hover:bg-secondary/5"
            title="View Invoice"
            aria-label={`View invoice ${row.invoice_number}`}
          >
            <LuEye className="h-4 w-4" />
          </Link>
          {isManager && (
            <button
              type="button"
              className="rounded-xl p-2.5 text-rose-600 hover:bg-rose-50"
              onClick={() => handleDeleteClick(row.id)}
              title="Delete Invoice"
              aria-label={`Delete invoice ${row.invoice_number}`}
            >
              <LuTrash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingScreen />;
  }

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

  const dateRangeButtonClass = `inline-flex h-10 items-center gap-2 rounded-xl border bg-white text-sm font-semibold transition hover:bg-gray-50 ${
    dueFrom || dueTo
      ? "border-accent text-accent"
      : "border-gray-200 text-slate-600 hover:border-gray-300"
  }`;

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <h4 className="text-xl font-medium text-slate-900">
              Invoice History
            </h4>
            <p className="mt-1 text-sm text-slate-500">
              Review billing, due dates, payment status, and invoice actions.
            </p>

            <div className="mt-6 flex flex-col gap-3 lg:hidden">
              {searchInput}

              <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                <button
                  type="button"
                  onClick={openDateRange}
                  className={`${dateRangeButtonClass} w-full justify-center px-3`}
                >
                  <LuCalendarDays className="h-4 w-4 text-slate-400" />
                  <span className="truncate">{dateRangeLabel}</span>
                </button>

                <Select
                  id="invoice-status-filter-mobile"
                  label=""
                  value={statusFilterValue}
                  onChange={setStatusFilter}
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

              <div className="min-w-44">
                <Select
                  id="invoice-status-filter"
                  label=""
                  value={statusFilterValue}
                  onChange={setStatusFilter}
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
              actions={BULK_ACTIONS.map((action) => ({
                ...action,
                describeRow: invoiceNumberFor,
              }))}
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
                    ? "No invoices match your filters."
                    : "No invoices yet"}
                </h5>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {table.hasActiveFilters
                    ? "Try adjusting the search, status, or date range filters."
                    : "Create your first invoice to start tracking billing, due dates, and payments."}
                </p>
                {isManager && onAddInvoice && !table.hasActiveFilters && (
                  <button
                    type="button"
                    onClick={onAddInvoice}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <LuPlus className="h-4 w-4" />
                    Add Invoice
                  </button>
                )}
                {table.hasActiveFilters && (
                  <button
                    type="button"
                    onClick={table.resetFilters}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-600"
                  >
                    <LuX className="h-4 w-4" />
                    Clear Filters
                  </button>
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
                noun="invoices"
                onPageChange={table.goToPage}
                onPageSizeChange={table.setPageSize}
              />
            }
          />
        </div>

        {showDateRangeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
              className="fixed inset-0 bg-gray-900/40"
              onClick={() => setShowDateRangeModal(false)}
            ></div>

            <div className="relative z-50 w-full md:w-4/7 lg:w-2/7 max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Filter by Due Date
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Show invoices due between these dates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDateRangeModal(false)}
                  className="text-slate-400 transition hover:text-slate-600"
                  aria-label="Close date range dialog"
                >
                  <LuX className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="invoice-due-from"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Start Date
                  </label>
                  <input
                    id="invoice-due-from"
                    type="date"
                    value={dateDraft.from}
                    onChange={(event) =>
                      setDateDraft((draft) => ({
                        ...draft,
                        from: event.target.value,
                      }))
                    }
                    className="mt-2 h-10 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="invoice-due-to"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    End Date
                  </label>
                  <input
                    id="invoice-due-to"
                    type="date"
                    value={dateDraft.to}
                    onChange={(event) =>
                      setDateDraft((draft) => ({
                        ...draft,
                        to: event.target.value,
                      }))
                    }
                    className="mt-2 h-10 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="fixed inset-0 bg-gray-900/40"
              onClick={() => setShowModal(false)}
            ></div>

            <form
              onSubmit={confirmDelete}
              className="relative z-10 w-full md:w-4/7 lg:w-2/7 max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-5"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between">
                <h5 className="text-xl font-medium text-gray-900">
                  Delete Invoice
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
                Are you sure you want to delete this invoice?
              </p>

              <div className="mt-6 flex justify-end gap-3">
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
            </form>
          </div>
        )}
      </div>
    </>
  );
}
