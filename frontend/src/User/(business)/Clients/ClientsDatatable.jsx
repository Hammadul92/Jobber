import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LuPencil,
  LuTrash2,
  LuPlus,
  LuSearch,
  LuSlidersHorizontal,
  LuX,
} from "react-icons/lu";
import { MdOutlineMiscellaneousServices } from "react-icons/md";
import {
  useFetchClientsPageQuery,
  useDeleteClientMutation,
  useBulkClientsMutation,
} from "../../../store";
import SubmitButton from "../../../Components/ui/SubmitButton";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import LoadingScreen from "../../../Components/ui/LoadingScreen";
import RecordsTable from "../../../Components/ui/RecordsTable";
import RecordLink from "../../../Components/ui/RecordLink";
import BulkActionBar from "../../../Components/ui/BulkActionBar";
import TablePagination from "../../../Components/ui/TablePagination";
import useServerTable from "../../../hooks/useServerTable";

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

const clientsLabel = (count) => `${count} client${count === 1 ? "" : "s"}`;

const BULK_ACTIONS = [
  {
    key: "activate",
    label: "Activate",
    tone: "primary",
    confirmMessage: (count) =>
      `Activate ${clientsLabel(count)}? They will see this business's quotes and invoices again.`,
  },
  {
    key: "deactivate",
    label: "Deactivate",
    confirmMessage: (count) =>
      `Deactivate ${clientsLabel(count)}? They will no longer see this business's quotes and invoices.`,
  },
  {
    key: "delete",
    label: "Delete",
    tone: "danger",
    confirmMessage: (count) =>
      `Delete ${clientsLabel(count)}? Their services, quotes, jobs and invoices are removed too. This cannot be undone.`,
  },
];

// One-row page requests: only the counts are used for the summary cards.
const COUNT_ARGS = { page: 1, page_size: 1 };

const isActiveClient = (row) => row.is_active === true || row.is_active === "True";
const clientNameOf = (row) => row.client_name || row.name || "Client";

export default function ClientsDatatable({ token, showAddClient }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [bulkLabels, setBulkLabels] = useState({});

  const table = useServerTable({
    initialOrdering: "-created_at",
    initialFilters: { is_active: "" },
  });
  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useFetchClientsPageQuery(table.queryArgs, { skip: !token });
  const { data: totalData } = useFetchClientsPageQuery(COUNT_ARGS, {
    skip: !token,
  });
  const { data: activeData } = useFetchClientsPageQuery(
    { ...COUNT_ARGS, is_active: true },
    { skip: !token },
  );

  const [deleteClient, { isLoading: deleting }] = useDeleteClientMutation();
  const [bulkClients] = useBulkClientsMutation();

  const rows = data?.results || [];
  const totalClients = totalData?.count ?? 0;
  const activeClients = activeData?.count ?? 0;
  const stats = [
    { label: "Total Clients", value: totalClients },
    { label: "Active", value: activeClients },
    { label: "Inactive", value: Math.max(0, totalClients - activeClients) },
  ];

  useEffect(() => {
    if (error) {
      setAlert({
        type: "danger",
        message: error?.data?.detail || "Failed to load client data.",
      });
    }
  }, [error]);

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

  const hasActiveFilters = table.filters.is_active !== "";

  return (
    <>
      {alert.message && (
        <AlertDispatcher
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: "", message: "" })}
        />
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
          >
            <p className="text-[0.95rem] font-medium text-slate-500">{label}</p>
            <div className="mt-1 flex items-end">
              <p className="text-4xl font-semibold leading-none text-slate-900">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col overflow-visible rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-white px-4 py-4 md:px-5 rounded-t-2xl">
          {/* Header: search and filter controls */}
          <div className="flex flex-row items-center justify-between gap-1 md:gap-3 ">
            <div className="relative min-w-0 flex-1">
              <LuSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={table.searchInput}
                onChange={(event) => table.setSearchInput(event.target.value)}
                placeholder="Search clients by name, email, phone or company..."
                aria-label="Search clients"
                className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-12 pr-4 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm focus:border-accent focus:outline-none"
              />
            </div>

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsFilterOpen((prev) => !prev)}
                className="relative inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 md:px-6 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-gray-50"
              >
                <LuSlidersHorizontal className="h-4 w-4" />
                <span className="hidden md:inline-flex">Filters</span>
                {hasActiveFilters && (
                  <span className="absolute top-2.5 md:top-3 left-1.5 md:left-3 ml-1 inline-flex h-2.5 w-2.5 rounded-full bg-orange-500" />
                )}
              </button>

              {isFilterOpen && (
                /* Filter dropdown panel */
                <div className="absolute right-0 top-[calc(100%+10px)] z-30 w-64! max-w-[calc(100vw-1rem)]! overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] md:w-88">
                  {/* Filter dropdown header */}
                  <div className="flex items-center justify-between border-b border-gray-200 px-5 py-2 md:py-4">
                    <h4 className="text-lg font-medium text-slate-900">
                      Filters
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsFilterOpen(false)}
                      className="text-slate-400 transition hover:text-slate-600"
                      aria-label="Close filters"
                    >
                      <LuX className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Filter dropdown options */}
                  <div className="px-5 py-4">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
                          Status
                        </p>
                        <div className="mt-3 space-y-2">
                          {STATUS_OPTIONS.map((option) => {
                            const isSelected =
                              table.filters.is_active === option.value;

                            return (
                              <button
                                key={option.value || "all"}
                                type="button"
                                onClick={() =>
                                  table.setFilter("is_active", option.value)
                                }
                                className="flex w-full items-center justify-between rounded-2xl px-1 py-2 text-left"
                              >
                                <span className="flex items-center gap-3 text-slate-700">
                                  <span
                                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${isSelected ? "border-slate-500" : "border-slate-300"}`}
                                  >
                                    {isSelected ? (
                                      <span className="h-3 w-3 rounded-full border-4 border-white bg-slate-500" />
                                    ) : null}
                                  </span>
                                  <span className="text-base font-medium">
                                    {option.label}
                                  </span>
                                </span>
                                <span
                                  className={`h-2.5 w-2.5 rounded-full ${option.value === "true" ? "bg-emerald-500" : option.value === "false" ? "bg-slate-400" : "bg-transparent"}`}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Filter dropdown actions */}
                  <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row">
                    <button
                      type="button"
                      onClick={table.resetFilters}
                      className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-gray-50"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFilterOpen(false)}
                      className="flex-1 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accentLight"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

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
