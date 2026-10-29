import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LuCheck,
  LuTrash2,
  LuPencil,
  LuSearch,
  LuSlidersHorizontal,
} from "react-icons/lu";
import {
  useFetchServicesPageQuery,
  useDeleteServiceMutation,
  useBulkServicesMutation,
} from "../../../../store";
import SubmitButton from "../../../../Components/ui/SubmitButton";
import LoadingScreen from "../../../../Components/ui/LoadingScreen";
import { countries, provinces } from "../../../../constants/locations";
import { formatDate } from "../../../../utils/formatDate";
import Dropdown from "../../../../Components/ui/Dropdown";
import RecordsTable from "../../../../Components/ui/RecordsTable";
import BulkActionBar from "../../../../Components/ui/BulkActionBar";
import TablePagination from "../../../../Components/ui/TablePagination";
import useServerTable from "../../../../hooks/useServerTable";

const FILTER_KEYS = ["service_type", "status", "country", "province_state"];

const servicesLabel = (count) => `${count} service${count === 1 ? "" : "s"}`;

const BULK_ACTIONS = [
  {
    key: "resend_questionnaire",
    label: "Resend questionnaire",
    tone: "primary",
    confirmMessage: (count) =>
      `Email the questionnaire again for ${servicesLabel(count)}? Services whose questionnaire is already filled or bypassed are skipped.`,
  },
  {
    key: "delete",
    label: "Delete",
    tone: "danger",
    confirmMessage: (count) =>
      `Delete ${servicesLabel(count)}? Their quotes, jobs and invoices are removed too. This cannot be undone.`,
  },
];

export default function ClientServicesData({
  token,
  role,
  clientId,
  setAlert,
}) {
  const isManager = role === "MANAGER";
  const isAllServicesView = !clientId && isManager;
  const [deleteService, { isLoading: deleting }] = useDeleteServiceMutation();
  const [bulkServices] = useBulkServicesMutation();
  const [showModal, setShowModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [bulkLabels, setBulkLabels] = useState({});

  // Managers can scope the list to one client; clients only see their own.
  const clientFilter = role === "CLIENT" ? "" : String(clientId || "");
  const table = useServerTable({
    initialOrdering: "-created_at",
    initialFilters: {
      service_type: "",
      status: "",
      country: "",
      province_state: "",
      client: clientFilter,
    },
  });
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useFetchServicesPageQuery(table.queryArgs, { skip: !token });

  const services = data?.results || [];
  const { filters, setFilter, setSearchInput } = table;
  const countryFilter = filters.country;

  // Follow the route when it switches to another client without remounting.
  useEffect(() => {
    if (filters.client !== clientFilter) setFilter("client", clientFilter);
  }, [clientFilter, filters.client, setFilter]);

  useEffect(() => {
    if (isError) {
      const msg =
        error?.data?.detail || "Failed to load services. Please try again.";
      setAlert({ type: "danger", message: msg });
    }
  }, [isError, error, setAlert]);

  const handleDeleteClick = (id) => {
    setSelectedServiceId(id);
    setShowModal(true);
  };

  const confirmDelete = async (e) => {
    e.preventDefault();
    if (!selectedServiceId) return;
    try {
      await deleteService(selectedServiceId).unwrap();
      setAlert({ type: "success", message: "Service deleted successfully!" });
    } catch (err) {
      const msg =
        err?.data?.detail || "Failed to delete service. Please try again.";
      setAlert({ type: "danger", message: msg });
    } finally {
      setShowModal(false);
      setSelectedServiceId(null);
    }
  };

  const runBulkAction = async (action) => {
    // Keep names for the result summary; deleted rows leave the page on refetch.
    setBulkLabels(
      Object.fromEntries(
        services.map((service) => [
          String(service.id),
          service.service_name || `#${service.id}`,
        ]),
      ),
    );
    const result = await bulkServices({
      action,
      ids: table.selectedIds,
    }).unwrap();
    table.clearSelection();
    return result;
  };

  const hasFilters = FILTER_KEYS.some((key) => filters[key]);
  const isFiltered = hasFilters || Boolean(table.queryArgs.search);

  const clearFilters = () => {
    FILTER_KEYS.forEach((key) => setFilter(key, ""));
    setSearchInput("");
  };

  const provinceOptions = useMemo(() => {
    const allProvs = Object.values(provinces).flat();
    const list = countryFilter ? provinces[countryFilter] || [] : allProvs;
    // prepend All option
    const merged = [{ value: "", label: "All" }, ...list];
    // dedupe by value
    const seen = new Set();
    return merged.filter((p) => {
      if (seen.has(p.value)) return false;
      seen.add(p.value);
      return true;
    });
  }, [countryFilter]);

  const columns = [
    {
      key: "service",
      title: "Service",
      sortKey: "service_name",
      width: isAllServicesView ? "13%" : isManager ? "17%" : "18%",
      className: "px-4 py-3 font-semibold text-slate-900",
      render: (service) => service.service_name || "—",
    },
    isAllServicesView && {
      key: "client",
      title: "Client",
      sortKey: "client__name",
      width: "10%",
      render: (service) => service.client_name || "Client",
    },
    {
      key: "type",
      title: "Type",
      sortKey: "service_type",
      width: isAllServicesView ? "10%" : isManager ? "11%" : "12%",
      render: (service) =>
        service.service_type === "SUBSCRIPTION" ? "Subscription" : "One-time",
    },
    {
      key: "address",
      title: "Service Address",
      width: isAllServicesView ? "21%" : isManager ? "24%" : "28%",
      render: (service) =>
        [
          service.street_address,
          service.city,
          service.province_state,
          service.country,
        ]
          .filter(Boolean)
          .join(", ") || "Address not provided",
    },
    {
      key: "start",
      title: "Start",
      sortKey: "start_date",
      width: isManager ? "9%" : "10%",
      render: (service) =>
        service.start_date ? formatDate(service.start_date, false) : "—",
    },
    {
      key: "end",
      title: "End",
      sortKey: "end_date",
      width: isAllServicesView ? "9%" : "10%",
      render: (service) =>
        service.end_date ? formatDate(service.end_date, false) : "—",
    },
    {
      key: "status",
      title: "Status",
      sortKey: "status",
      width: isAllServicesView ? "9%" : "10%",
      render: (service) => {
        const tone =
          {
            PENDING: "bg-amber-100 text-amber-800",
            ACTIVE: "bg-emerald-100 text-emerald-700",
            COMPLETED: "bg-sky-100 text-sky-700",
            CANCELLED: "bg-rose-100 text-rose-700",
          }[service.status] || "bg-slate-100 text-slate-700";
        return (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${tone}`}
          >
            {service.status || "—"}
          </span>
        );
      },
    },
    {
      key: "questionnaire",
      title: "Questionnaire",
      width: "12%",
      render: (service) =>
        service.service_questionnaires?.id ? (
          <Link
            to={`/user/business/service-questionnaire/${service.service_questionnaires.id}/form/${service.id}`}
            className="inline-flex items-center gap-1 font-medium text-secondary hover:text-accent"
          >
            {service.filled_questionnaire && <LuCheck className="h-4 w-4" />}
            Questionnaire
          </Link>
        ) : service.bypass_questionnaire ? (
          "Bypassed"
        ) : (
          "None"
        ),
    },
    isManager && {
      key: "actions",
      title: "Actions",
      width: "7%",
      render: (service) => (
        <div className="flex items-center gap-1">
          <Link
            to={`/user/business/service/${service.id}`}
            className="rounded-xl p-2 text-secondary hover:bg-secondary/5"
            title={`Edit ${service.service_name}`}
            aria-label={`Edit ${service.service_name}`}
          >
            <LuPencil className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => handleDeleteClick(service.id)}
            className="rounded-xl p-2 text-rose-600 hover:bg-rose-50"
            title={`Delete ${service.service_name}`}
            aria-label={`Delete ${service.service_name}`}
          >
            <LuTrash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ].filter(Boolean);

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <LuSlidersHorizontal className="h-4 w-4 text-secondary" />
              Filters
            </div>
            {isFiltered && (
              <button
                className="text-xs font-semibold text-secondary underline underline-offset-4"
                onClick={clearFilters}
                type="button"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="relative mb-3">
            <LuSearch
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={table.searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={
                isAllServicesView
                  ? "Search by service, client or address"
                  : "Search by service or address"
              }
              aria-label="Search services"
              className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-accent focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label
                htmlFor="type_filter"
                className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500"
              >
                Subscription type
              </label>
              <Dropdown
                id="type_filter"
                value={filters.service_type}
                onChange={(value) => setFilter("service_type", value)}
                placeholder="Subscription Type"
                options={[
                  { value: "", label: "All" },
                  { value: "ONE_TIME", label: "One Time" },
                  { value: "SUBSCRIPTION", label: "Subscription" },
                ]}
                buttonClassName="h-10 border-gray-200 bg-white"
                menuClassName="max-h-64 overflow-auto"
              />
            </div>
            <div>
              <label
                htmlFor="service_status_filter"
                className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500"
              >
                Status
              </label>
              <Dropdown
                id="service_status_filter"
                value={filters.status}
                onChange={(value) => setFilter("status", value)}
                options={[
                  { value: "", label: "All statuses" },
                  { value: "PENDING", label: "Pending" },
                  { value: "ACTIVE", label: "Active" },
                  { value: "COMPLETED", label: "Completed" },
                  { value: "CANCELLED", label: "Cancelled" },
                ]}
                buttonClassName="h-10 border-gray-200 bg-white"
                menuClassName="max-h-64 overflow-auto"
              />
            </div>
            <div>
              <label
                htmlFor="country_filter"
                className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500"
              >
                Country
              </label>
              <Dropdown
                id="country_filter"
                value={countryFilter}
                onChange={(value) => {
                  setFilter("country", value);
                  setFilter("province_state", "");
                }}
                placeholder="Country"
                options={[{ value: "", label: "All" }, ...countries]}
                buttonClassName="h-10 border-gray-200 bg-white"
                menuClassName="max-h-64 overflow-auto"
              />
            </div>
            <div>
              <label
                htmlFor="province_state"
                className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500"
              >
                Province/State
              </label>
              <Dropdown
                id="province_state"
                value={filters.province_state}
                onChange={(value) => setFilter("province_state", value)}
                placeholder="Province/State"
                options={provinceOptions}
                buttonClassName="h-10 border-gray-200 bg-white"
                menuClassName="max-h-64 overflow-auto"
                disabled={false}
              />
            </div>
          </div>
        </div>
        {isManager && (
          <BulkActionBar
            selectedCount={table.selectedIds.length}
            actions={BULK_ACTIONS.map((action) => ({
              ...action,
              describeRow: (id) => bulkLabels[String(id)] || `#${id}`,
            }))}
            onRun={runBulkAction}
            onClear={table.clearSelection}
          />
        )}
        <RecordsTable
          columns={columns}
          tableClassName="min-w-[950px] sm:min-w-[1350px]"
          rows={services}
          rowKey={(service) => service.id}
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
            <div className="text-center text-sm text-slate-500">
              {isFiltered
                ? "No services match your filters."
                : "No services found."}
            </div>
          }
          footer={
            <TablePagination
              page={table.page}
              pageSize={table.pageSize}
              count={data?.count}
              totalPages={data?.total_pages}
              isFetching={isFetching}
              noun="services"
              onPageChange={table.goToPage}
              onPageSizeChange={table.setPageSize}
            />
          }
        />
      </div>

      {/* DELETE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form
            onSubmit={confirmDelete}
            className="w-2/7 max-w-md rounded-xl bg-white p-6 shadow-2xl space-y-5"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-3">
              <h5 className="text-xl font-medium text-primary">
                Delete Service
              </h5>
              <button
                type="button"
                className="text-2xl text-gray-400 transition hover:text-gray-600"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div>
              <p className="text-gray-600">This cannot be undone.</p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
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
