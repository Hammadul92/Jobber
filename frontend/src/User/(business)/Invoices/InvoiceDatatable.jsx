import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  useFetchInvoicesQuery,
  useDeleteInvoiceMutation,
} from "../../../store";
import SubmitButton from "../../../Components/ui/SubmitButton";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import { formatDate } from "../../../utils/formatDate";
import Select from "../../../Components/ui/Select";
import {
  LuCalendarDays,
  LuChevronLeft,
  LuChevronRight,
  LuDownload,
  LuEye,
  LuFileText,
  LuPlus,
  LuSearch,
  LuTrash2,
  LuX,
} from "react-icons/lu";

function isInvoiceOverdue(row) {
  if (!row?.due_date || row.status === "PAID" || row.status === "CANCELLED") {
    return false;
  }

  const dueDate = new Date(row.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
}

export default function InvoiceDatatable({ token, role, onAddInvoice }) {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(100);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const {
    data: invoiceData,
    isLoading,
    error,
    refetch,
  } = useFetchInvoicesQuery({ page, page_size: pageSize }, { skip: !token });
  const [deleteInvoice, { isLoading: deleting }] = useDeleteInvoiceMutation();

  const rows = useMemo(() => invoiceData?.results || [], [invoiceData]);
  const totalCount = invoiceData?.count ?? rows.length;
  const currentPage = invoiceData?.current_page ?? page;
  const totalPages = invoiceData?.total_pages ?? 1;
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
      const effectiveStatus = isInvoiceOverdue(row) ? "OVERDUE" : row.status;

      const matchesStatus =
        statusFilter === "ALL" || effectiveStatus === statusFilter;

      const matchesSearch =
        !normalizedSearch ||
        [
          row.invoice_number,
          row.business_name,
          row.client_name,
          row.service_name,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedSearch),
          );

      let matchesDateRange = true;
      if (dateRangeStart || dateRangeEnd) {
        if (!row.due_date) {
          matchesDateRange = false;
        } else {
          const dueDate = new Date(row.due_date);
          if (dateRangeStart) {
            const startDate = new Date(dateRangeStart);
            startDate.setHours(0, 0, 0, 0);
            if (dueDate < startDate) matchesDateRange = false;
          }
          if (dateRangeEnd) {
            const endDate = new Date(dateRangeEnd);
            endDate.setHours(23, 59, 59, 999);
            if (dueDate > endDate) matchesDateRange = false;
          }
        }
      }

      return matchesStatus && matchesSearch && matchesDateRange;
    });
  }, [rows, searchTerm, statusFilter, dateRangeStart, dateRangeEnd]);

  // const summary = useMemo(() => {
  //   const toNumber = (value) => Number.parseFloat(value || 0);

  //   return {
  //     totalInvoiced: rows.reduce(
  //       (sum, row) => sum + toNumber(row.total_amount),
  //       0,
  //     ),
  //     paidInvoices: rows.filter((row) => row.status === "PAID").length,
  //     outstandingBalance: rows
  //       .filter((row) => row.status !== "PAID" && row.status !== "CANCELLED")
  //       .reduce((sum, row) => sum + toNumber(row.total_amount), 0),
  //     overdueInvoices: rows.filter((row) => isInvoiceOverdue(row)).length,
  //   };
  // }, [rows]);

  useEffect(() => {
    if (error) {
      setAlert({
        type: "danger",
        message: error?.data?.detail || "Failed to load invoice data.",
      });
    }
  }, [error]);

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
      refetch();
    } catch (err) {
      setAlert({
        type: "danger",
        message: err?.data?.detail || "Failed to delete invoice.",
      });
      console.error("Failed to delete invoice:", err);
    }
  };

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

  const handleExport = () => {
    if (!filteredRows.length) return;

    const headers = [
      "Invoice",
      "Business",
      "Client",
      "Service",
      "Total",
      "Status",
      "Due Date",
    ];

    const csvRows = filteredRows.map((row) => [
      row.invoice_number,
      row.business_name,
      row.client_name,
      row.service_name,
      row.total_amount,
      isInvoiceOverdue(row) ? "OVERDUE" : row.status,
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
    link.download = "invoices.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status) => {
    if (status === "PAID") return "bg-emerald-100 text-emerald-700";
    if (status === "SENT") return "bg-sky-100 text-sky-700";
    if (status === "OVERDUE") return "bg-amber-100 text-amber-700";
    if (status === "CANCELLED") return "bg-rose-100 text-rose-700";
    return "bg-slate-100 text-slate-700";
  };

  const columns = [
    { name: "invoice_number", title: "Invoice" },
    { name: "business_name", title: "Business" },
    { name: "client_name", title: "Client" },
    { name: "service_name", title: "Service" },
    { name: "invoice_total", title: "Total" },
    { name: "status", title: "Status" },
    { name: "due_date", title: "Due Date" },
    { name: "actions", title: "Actions" },
  ];

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        Loading data...
      </div>
    );
  }

  // const summaryCards = [
  //   {
  //     title: "Total Invoiced",
  //     value: formatMoney(summary.totalInvoiced),
  //     description: "Across all invoices",
  //   },
  //   {
  //     title: "Paid Invoices",
  //     value: summary.paidInvoices,
  //     description: "Fully paid invoices",
  //   },
  //   {
  //     title: "Outstanding Balance",
  //     value: formatMoney(summary.outstandingBalance),
  //     description: "Awaiting payment",
  //   },
  //   {
  //     title: "Overdue Invoices",
  //     value: summary.overdueInvoices,
  //     description: "Past due date",
  //   },
  // ];

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
              Invoice History
            </h4>
            <p className="mt-1 text-sm text-slate-500">
              Review billing, due dates, payment status, and invoice actions.
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

              <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                <button
                  type="button"
                  onClick={() => setShowDateRangeModal(true)}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-gray-300 hover:bg-gray-50"
                >
                  <LuCalendarDays className="h-4 w-4 text-slate-400" />
                  <span className="truncate">Date Range</span>
                </button>

                <Select
                  id="invoice-status-filter-mobile"
                  label=""
                  value={statusFilter}
                  onChange={setStatusFilter}
                  fieldClass="h-10 text-sm"
                  options={[
                    { value: "ALL", label: "All Status" },
                    { value: "DRAFT", label: "Draft" },
                    { value: "SENT", label: "Sent" },
                    { value: "PAID", label: "Paid" },
                    { value: "OVERDUE", label: "Overdue" },
                    { value: "CANCELLED", label: "Cancelled" },
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

              <div className="min-w-44">
                <Select
                  id="invoice-status-filter"
                  label=""
                  value={statusFilter}
                  onChange={setStatusFilter}
                  fieldClass="h-10 text-sm"
                  options={[
                    { value: "ALL", label: "All Status" },
                    { value: "DRAFT", label: "Draft" },
                    { value: "SENT", label: "Sent" },
                    { value: "PAID", label: "Paid" },
                    { value: "OVERDUE", label: "Overdue" },
                    { value: "CANCELLED", label: "Cancelled" },
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
                    filteredRows.map((row) => {
                      const overdue = isInvoiceOverdue(row);
                      const effectiveStatus = overdue ? "OVERDUE" : row.status;

                      return (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {row.invoice_number}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {row.business_name}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {row.client_name}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {row.service_name}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {formatMoney(row.total_amount)}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${statusBadge(effectiveStatus)}`}
                            >
                              {effectiveStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            <div className="flex items-center gap-2">
                              <span>{formatDate(row.due_date)}</span>
                              {overdue && (
                                <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                                  Overdue
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-start">
                              <Link
                                to={`/user/business/invoice/${row.id}`}
                                className="inline-flex items-center gap-2 rounded-xl p-2 text-sm font-medium text-secondary transition hover:bg-secondary/5"
                                title="View Invoice"
                              >
                                <LuEye className="h-4 w-4" />

                              </Link>

                              {role === "MANAGER" && (
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-2 rounded-xl p-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                                  onClick={() => handleDeleteClick(row.id)}
                                  title="Delete Invoice"
                                >
                                  <LuTrash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-20">
                        <div className="mx-auto flex max-w-md flex-col items-center text-center">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-slate-400">
                            <LuFileText className="h-8 w-8" />
                          </div>
                          <h5 className="mt-5 text-xl font-medium text-slate-900">
                            {rows.length
                              ? "No invoices match your filters."
                              : "No invoices yet"}
                          </h5>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {rows.length
                              ? "Try adjusting the search, status, or date range filters."
                              : "Create your first invoice to start tracking billing, due dates, and payments."}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {rows.length
                              ? "Filtered invoices will appear here once they match your criteria."
                              : "Once invoices are created, they will appear here with payment status and due dates."}
                          </p>
                          {role === "MANAGER" &&
                            onAddInvoice &&
                            !rows.length && (
                              <button
                                type="button"
                                onClick={onAddInvoice}
                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accentLight"
                              >
                                <LuPlus className="h-4 w-4" />
                                Add Invoice
                              </button>
                            )}
                          {rows.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setSearchTerm("");
                                setStatusFilter("ALL");
                                setDateRangeStart("");
                                setDateRangeEnd("");
                              }}
                              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-gray-300 hover:bg-gray-50"
                            >
                              <LuX className="h-4 w-4" />
                              Clear Filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Showing {filteredRows.length} of {totalCount} invoices
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
            </div>
          </div>
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
                    Filter by Date Range
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Select start and end dates to filter invoices.
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
                  <label className="block text-sm font-semibold text-slate-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRangeStart}
                    onChange={(event) => setDateRangeStart(event.target.value)}
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
                    onChange={(event) => setDateRangeEnd(event.target.value)}
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
