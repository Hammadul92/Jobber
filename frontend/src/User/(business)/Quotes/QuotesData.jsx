import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  useFetchQuotesPageQuery,
  useDeleteQuoteMutation,
  useBulkQuotesMutation,
} from "../../../store";
import TableToolbar, {
  ToolbarDate,
  ToolbarSelect,
  tableCardClass,
} from "../../../Components/ui/TableToolbar";
import LoadingScreen from "../../../Components/ui/LoadingScreen";
import RecordsTable from "../../../Components/ui/RecordsTable";
import RecordLink from "../../../Components/ui/RecordLink";
import BulkActionBar from "../../../Components/ui/BulkActionBar";
import { pluralize } from "../../../utils/pluralize";
import TablePagination from "../../../Components/ui/TablePagination";
import useServerTable from "../../../hooks/useServerTable";
import { formatDate } from "../../../utils/formatDate";
import { LuEye, LuPencil, LuTrash2 } from "react-icons/lu";
import useAlert from "../../../hooks/useAlert";
import { PAYMENT_TERMS_OPTIONS } from "../../../utils/paymentTerms";
import ConfirmDialog from "../../../Components/ui/ConfirmDialog";
import TrashLink from "../../../Components/ui/TrashLink";
import DeleteRecordMessage from "../../../Components/ui/DeleteRecordMessage";

const QUOTE_STATUS_OPTIONS = ["DRAFT", "SENT", "SIGNED", "DECLINED", "EXPIRED"];

const BULK_ACTIONS = [
  {
    key: "send",
    label: "Send quotes",
    tone: "primary",
    confirmMessage: (count) =>
      `Email ${pluralize(count, "selected quote")} to the client? Signed or expired quotes are skipped.`,
    successMessage: (count) => `${pluralize(count, "quote")} sent.`,
  },
  {
    key: "delete",
    label: "Delete",
    tone: "danger",
    confirmContent: (labels) => (
      <DeleteRecordMessage
        kind="quote"
        names={labels}
        note="Signed quotes are skipped and stay as they are."
      />
    ),
    successMessage: (count) => `${pluralize(count, "quote")} moved to Trash.`,
  },
];

const getDisplayStatus = (quote) =>
  quote.status !== "SIGNED" &&
  quote.valid_until &&
  new Date(quote.valid_until) < new Date()
    ? "EXPIRED"
    : quote.status;

export default function QuotesData({ token, role }) {
  const setAlert = useAlert();
  const table = useServerTable({
    storageKey: "quotes",
    initialOrdering: "-created_at",
  });
  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useFetchQuotesPageQuery(table.queryArgs, { skip: !token });

  const [deleteQuote, { isLoading: deleting }] = useDeleteQuoteMutation();
  const [bulkQuotes] = useBulkQuotesMutation();
  const [showModal, setShowModal] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);

  const quotes = data?.results || [];
  const isManager = role === "MANAGER";

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

  const confirmDelete = async () => {
    if (!selectedQuoteId) return;
    try {
      await deleteQuote(selectedQuoteId).unwrap();
      setAlert({
        type: "success",
        message: `Quote ${quoteNumberFor(selectedQuoteId)} moved to Trash.`,
      });
      setShowModal(false);
      setSelectedQuoteId(null);
    } catch (err) {
      setAlert({
        type: "danger",
        message:
          err?.data?.detail ||
          "Failed to delete quote. Please try again later.",
      });
    }
  };

  const runBulkAction = async (action) => {
    const result = await bulkQuotes({ action, ids: table.selectedIds }).unwrap();
    table.clearSelection();
    return result;
  };

  const pendingQuote = quotes.find((quote) => quote.id === selectedQuoteId);

  const quoteNumberFor = (id) =>
    quotes.find((quote) => String(quote.id) === String(id))?.quote_number ||
    `#${id}`;

  const columns = [
    {
      key: "quote",
      title: "Quote",
      sortKey: "quote_number",
      width: "12%",
      className: "whitespace-nowrap px-4 py-3 font-semibold text-slate-900",
      render: (quote) => (
        <RecordLink
          to={
            isManager
              ? `/user/business/quote/${quote.id}`
              : role === "CLIENT"
                ? `/user/business/quote/sign/${quote.id}`
                : null
          }
          className="text-slate-900"
        >
          {quote.quote_number}
        </RecordLink>
      ),
    },
    {
      key: "client",
      title: "Client",
      sortKey: "service__client__name",
      width: "14%",
      className: "whitespace-nowrap px-4 py-3 text-slate-700",
      render: (quote) => (
        <RecordLink
          to={
            isManager && quote.service_data?.client
              ? `/user/business/client/${quote.service_data.client}`
              : null
          }
        >
          {quote.client_name || "—"}
        </RecordLink>
      ),
    },
    {
      key: "service",
      title: "Service",
      sortKey: "service__service_name",
      width: "12%",
      render: (quote) => (
        <RecordLink
          to={
            isManager && quote.service_data?.id
              ? `/user/business/service/${quote.service_data.id}`
              : null
          }
        >
          {quote.service_name || "—"}
        </RecordLink>
      ),
    },
    {
      key: "address",
      title: "Service Address",
      width: "24%",
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
      sortKey: "status",
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
      sortKey: "valid_until",
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
          {isManager && (
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
          {isManager && quote.status !== "SIGNED" && (
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
      <div className={tableCardClass}>
        <TableToolbar
          searchValue={table.searchInput}
          onSearchChange={table.setSearchInput}
          searchPlaceholder="Search quote number, client or service"
          isFiltered={table.hasActiveFilters}
          onClear={table.resetFilters}
          actions={isManager && <TrashLink resource="quotes" />}
        >
          <ToolbarSelect
            id="quotes-status-filter"
            label="Status"
            value={table.filters.status}
            onChange={(value) => table.setFilter("status", value)}
            options={[
              { value: "", label: "All statuses" },
              ...QUOTE_STATUS_OPTIONS.map((status) => ({
                value: status,
                label: status.charAt(0) + status.slice(1).toLowerCase(),
              })),
            ]}
          />
          <ToolbarSelect
            id="quotes-type-filter"
            label="Service type"
            value={table.filters.service_type}
            onChange={(value) => table.setFilter("service_type", value)}
            options={[
              { value: "", label: "All types" },
              { value: "ONE_TIME", label: "One Time" },
              { value: "SUBSCRIPTION", label: "Subscription" },
            ]}
          />
          <ToolbarSelect
            id="quotes-terms-filter"
            label="Payment terms"
            value={table.filters.payment_terms}
            onChange={(value) => table.setFilter("payment_terms", value)}
            options={[
              { value: "", label: "All payment terms" },
              ...PAYMENT_TERMS_OPTIONS,
            ]}
          />
          <ToolbarDate
            id="quotes-valid-from"
            label="Valid from"
            value={table.filters.valid_from}
            max={table.filters.valid_to}
            onChange={(value) => table.setFilter("valid_from", value)}
          />
          <ToolbarDate
            id="quotes-valid-to"
            label="Valid to"
            value={table.filters.valid_to}
            min={table.filters.valid_from}
            onChange={(value) => table.setFilter("valid_to", value)}
          />
        </TableToolbar>
        {isManager && (
          <BulkActionBar
            selectedCount={table.selectedIds.length}
            selectedIds={table.selectedIds}
            actions={BULK_ACTIONS.map((action) => ({
              ...action,
              describeRow: quoteNumberFor,
            }))}
            onRun={runBulkAction}
            onClear={table.clearSelection}
          />
        )}
        <RecordsTable
          columns={columns}
          tableClassName="min-w-[800px] sm:min-w-[1150px]"
          rows={quotes}
          rowKey={(quote) => quote.id}
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
              <h5 className="text-xl font-medium text-slate-900">
                {table.hasActiveFilters
                  ? "No quotes match your filters."
                  : "No quotes yet"}
              </h5>
              <p className="mt-2 text-sm text-slate-500">
                {table.hasActiveFilters
                  ? "Try a different search or filter."
                  : "Create a quote to start tracking pricing and approvals."}
              </p>
            </div>
          }
          footer={
            <TablePagination
              page={table.page}
              pageSize={table.pageSize}
              count={data?.count}
              totalPages={data?.total_pages}
              isFetching={isFetching}
              noun="quotes"
              onPageChange={table.goToPage}
              onPageSizeChange={table.setPageSize}
            />
          }
        />
      </div>

      <ConfirmDialog
        open={showModal}
        title="Delete Quote"
        message={
          pendingQuote && (
            <DeleteRecordMessage
              kind="quote"
              name={`Quote ${pendingQuote.quote_number}`}
              detail={[pendingQuote.service_name, pendingQuote.client_name]
                .filter(Boolean)
                .join(" · ")}
            />
          )
        }
        confirmLabel="Delete"
        isLoading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setShowModal(false)}
      />
    </>
  );
}
