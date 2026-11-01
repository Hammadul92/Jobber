import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LuPencil,
  LuTrash2,
  LuPlus,
} from "react-icons/lu";
import { MdOutlineMiscellaneousServices } from "react-icons/md";
import {
  useFetchClientsPageQuery,
  useDeleteClientMutation,
  useBulkClientsMutation,
} from "../../../store";
import SubmitButton from "../../../Components/ui/SubmitButton";
import LoadingScreen from "../../../Components/ui/LoadingScreen";
import RecordsTable from "../../../Components/ui/RecordsTable";
import RecordLink from "../../../Components/ui/RecordLink";
import BulkActionBar from "../../../Components/ui/BulkActionBar";
import { pluralize } from "../../../utils/pluralize";
import TablePagination from "../../../Components/ui/TablePagination";
import useServerTable from "../../../hooks/useServerTable";
import useAlert from "../../../hooks/useAlert";
import { countries, provinces } from "../../../constants/locations";
import TableToolbar, {
  ToolbarDate,
  ToolbarSelect,
  tableCardClass,
} from "../../../Components/ui/TableToolbar";

const STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

const ALL_PROVINCES = Object.values(provinces)
  .flat()
  .filter((option, index, list) => list.findIndex((other) => other.value === option.value) === index);

const BULK_ACTIONS = [
  {
    key: "activate",
    label: "Activate",
    tone: "primary",
    confirmMessage: (count) =>
      `Activate ${pluralize(count, "client")}? They will see this business's quotes and invoices again.`,
    successMessage: (count) => `${pluralize(count, "client")} activated.`,
  },
  {
    key: "deactivate",
    label: "Deactivate",
    confirmMessage: (count) =>
      `Deactivate ${pluralize(count, "client")}? They will no longer see this business's quotes and invoices.`,
    successMessage: (count) => `${pluralize(count, "client")} deactivated.`,
  },
  {
    key: "delete",
    label: "Delete",
    tone: "danger",
    confirmMessage: (count) =>
      `Delete ${pluralize(count, "client")}? Their services, quotes, jobs and invoices are removed too. This cannot be undone.`,
    successMessage: (count) => `${pluralize(count, "client")} deleted.`,
  },
];

const isActiveClient = (row) => row.is_active === true || row.is_active === "True";
const clientNameOf = (row) => row.client_name || row.name || "Client";

export default function ClientsDatatable({ token, showAddClient }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const setAlert = useAlert();
  const [bulkLabels, setBulkLabels] = useState({});

  const table = useServerTable({
    storageKey: "clients",
    initialOrdering: "-created_at",
    initialFilters: {
      is_active: "",
      payment_method: "",
      questionnaires: "",
      billing_country: "",
      billing_province_state: "",
      created_from: "",
      created_to: "",
    },
  });
  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useFetchClientsPageQuery(table.queryArgs, { skip: !token });

  const [deleteClient, { isLoading: deleting }] = useDeleteClientMutation();
  const [bulkClients] = useBulkClientsMutation();

  const rows = data?.results || [];

  useEffect(() => {
    if (error) {
      setAlert({
        type: "danger",
        message: error?.data?.detail || "Failed to load client data.",
      });
    }
  }, [error, setAlert]);

  const handleDeleteClick = (id) => {
    setSelectedClientId(id);
    setShowModal(true);
  };

  const confirmDelete = async (e) => {
    e.preventDefault();
    if (!selectedClientId) return;

    try {
      await deleteClient(selectedClientId).unwrap();
      setAlert({ type: "success", message: "Client deleted successfully!" });
      setShowModal(false);
      setSelectedClientId(null);
    } catch (err) {
      setAlert({
        type: "danger",
        message: err?.data?.detail || "Failed to delete client.",
      });
      console.error("Failed to delete client:", err);
    }
  };

  const runBulkAction = async (action) => {
    // Keep names for the result summary; deleted rows leave the page on refetch.
    setBulkLabels(
      Object.fromEntries(rows.map((row) => [String(row.id), clientNameOf(row)])),
    );
    const result = await bulkClients({ action, ids: table.selectedIds }).unwrap();
    table.clearSelection();
    return result;
  };

  const columns = [
    {
      key: "client",
      title: "Client",
      sortKey: "name",
      className: "px-4 py-3 font-semibold text-slate-900",
      render: (row) => (
        <RecordLink to={`/user/business/client/${row.id}`} className="text-slate-900">
          {clientNameOf(row)}
        </RecordLink>
      ),
    },
    {
      key: "email",
      title: "Email Address",
      sortKey: "user__email",
      render: (row) => row.client_email || "—",
    },
    {
      key: "phone",
      title: "Phone Number",
      sortKey: "phone",
      render: (row) => row.client_phone || "—",
    },
    {
      key: "payment",
      title: "Payment Method",
      render: (row) => row.payment_method || "—",
    },
    {
      key: "questionnaires",
      title: "Questionnaires",
      render: (row) => {
        const filled = Number(row.questionnaires_filled ?? 0);
        const total = Number(row.questionnaires_total ?? 0);
        return (
          <span
            className={
              total > 0 && filled >= total
                ? "font-semibold text-emerald-700"
                : "text-slate-700"
            }
          >
            {filled} / {total}
          </span>
        );
      },
    },
    {
      key: "status",
      title: "Status",
      sortKey: "is_active",
      render: (row) => {
        const active = isActiveClient(row);
        return (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
          >
            {active ? "ACTIVE" : "INACTIVE"}
          </span>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1 whitespace-nowrap">
          <Link
            to={`/user/business/client/${row.id}/services`}
            className="inline-flex items-center gap-1 rounded-xl p-2 text-secondary hover:bg-secondary/5"
            title="Client Services"
            aria-label={`Services for ${clientNameOf(row)}`}
          >
            <MdOutlineMiscellaneousServices className="h-4 w-4" />
            <span className="hidden text-xs font-semibold sm:inline">
              Services
            </span>
          </Link>
          <Link
            to={`/user/business/client/${row.id}`}
            className="rounded-xl p-2 text-slate-500 hover:bg-gray-50 hover:text-accent"
            title="Edit Client"
            aria-label={`Edit ${clientNameOf(row)}`}
          >
            <LuPencil className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => handleDeleteClick(row.id)}
            className="rounded-xl p-2 text-rose-600 hover:bg-rose-50"
            title="Delete Client"
            aria-label={`Delete ${clientNameOf(row)}`}
          >
            <LuTrash2 className="h-4 w-4" />
          </button>
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
          searchPlaceholder="Search name, email, phone or company"
          isFiltered={table.hasActiveFilters}
          onClear={table.resetFilters}
        >
          <ToolbarSelect
            id="clients-status-filter"
            label="Status"
            value={table.filters.is_active}
            onChange={(value) => table.setFilter("is_active", value)}
            options={STATUS_OPTIONS}
          />
          <ToolbarSelect
            id="clients-payment-filter"
            label="Payment method"
            value={table.filters.payment_method}
            onChange={(value) => table.setFilter("payment_method", value)}
            options={[
              { value: "", label: "All payment methods" },
              { value: "card", label: "Card on file" },
              { value: "none", label: "No payment method" },
            ]}
          />
          <ToolbarSelect
            id="clients-questionnaire-filter"
            label="Questionnaires"
            value={table.filters.questionnaires}
            onChange={(value) => table.setFilter("questionnaires", value)}
            options={[
              { value: "", label: "All questionnaires" },
              { value: "pending", label: "Pending answers" },
              { value: "complete", label: "All answered" },
            ]}
          />
          <ToolbarSelect
            id="clients-country-filter"
            label="Country"
            value={table.filters.billing_country}
            onChange={(value) => {
              table.setFilter("billing_country", value);
              table.setFilter("billing_province_state", "");
            }}
            options={[{ value: "", label: "All countries" }, ...countries]}
          />
          <ToolbarSelect
            id="clients-province-filter"
            label="Province/State"
            value={table.filters.billing_province_state}
            onChange={(value) => table.setFilter("billing_province_state", value)}
            options={[
              { value: "", label: "All provinces/states" },
              ...(table.filters.billing_country
                ? provinces[table.filters.billing_country] || []
                : ALL_PROVINCES),
            ]}
          />
          <ToolbarDate
            id="clients-created-from"
            label="Added from"
            value={table.filters.created_from}
            max={table.filters.created_to}
            onChange={(value) => table.setFilter("created_from", value)}
          />
          <ToolbarDate
            id="clients-created-to"
            label="Added to"
            value={table.filters.created_to}
            min={table.filters.created_from}
            onChange={(value) => table.setFilter("created_to", value)}
          />
        </TableToolbar>

        <BulkActionBar
          selectedCount={table.selectedIds.length}
          actions={BULK_ACTIONS.map((action) => ({
            ...action,
            describeRow: (id) => bulkLabels[String(id)] || `#${id}`,
          }))}
          onRun={runBulkAction}
          onClear={table.clearSelection}
        />

        <RecordsTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          ordering={table.ordering}
          onSort={table.toggleSort}
          isFetching={isFetching}
          selection={{
            selectedIds: table.selectedIds,
            onToggle: table.toggleSelected,
            onToggleAll: table.toggleAllSelected,
          }}
          empty={
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <img
                src="/images/add-clients.svg"
                alt=""
                className="h-40 w-40 object-contain"
              />
              <h5 className="mt-3 text-xl font-medium text-slate-900">
                {table.hasActiveFilters
                  ? "No clients match your filters."
                  : "No clients yet"}
              </h5>
              <p className="mt-2 text-sm text-slate-500">
                {table.hasActiveFilters
                  ? "Try adjusting your search or status filter."
                  : "Add your first client to manage their services and account details."}
              </p>
              {!table.hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => showAddClient(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <LuPlus className="h-4 w-4" />
                  Add Client
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
              noun="clients"
              onPageChange={table.goToPage}
              onPageSizeChange={table.setPageSize}
            />
          }
        />
      </div>

      {/* Delete Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form
            onSubmit={confirmDelete}
            className="min-w-md rounded-xl bg-white p-6 shadow-2xl space-y-5"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-3">
              <h5 className="text-xl font-medium text-primary">
                Delete Client
              </h5>
              <button
                type="button"
                className="text-gray-400 text-2xl transition hover:text-gray-600"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <p className="text-gray-600">This action cannot be undone.</p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
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
    </>
  );
}
