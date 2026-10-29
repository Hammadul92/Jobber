import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LuCheck,
  LuTrash2,
  LuPencil,
  LuSlidersHorizontal,
} from "react-icons/lu";
import {
  useFetchServicesQuery,
  useDeleteServiceMutation,
} from "../../../../store";
import SubmitButton from "../../../../Components/ui/SubmitButton";
import LoadingScreen from "../../../../Components/ui/LoadingScreen";
import { countries, provinces } from "../../../../constants/locations";
import { formatDate } from "../../../../utils/formatDate";
import Dropdown from "../../../../Components/ui/Dropdown";
import RecordsTable from "../../../../Components/ui/RecordsTable";

export default function ClientServicesData({
  token,
  role,
  clientId,
  setAlert,
}) {
  const isAllServicesView = !clientId && role === "MANAGER";
  const [deleteService, { isLoading: deleting }] = useDeleteServiceMutation();
  const [showModal, setShowModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);

  const queryArg = role === "CLIENT" ? null : clientId;
  const {
    data: services = [],
    isLoading,
    isError,
    error,
  } = useFetchServicesQuery(queryArg, { skip: !token });

  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");

  useEffect(() => {
    if (isError) {
      const msg =
        error?.data?.detail || "Failed to load services. Please try again.";
      setAlert({ type: "danger", message: msg });
    }
  }, [isError, error, setAlert]);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      return (
        (!typeFilter || service.service_type === typeFilter) &&
        (!statusFilter || service.status === statusFilter) &&
        (!countryFilter || service.country === countryFilter) &&
        (!provinceFilter || service.province_state === provinceFilter)
      );
    });
  }, [services, typeFilter, statusFilter, countryFilter, provinceFilter]);

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

  const hasFilters =
    typeFilter || statusFilter || countryFilter || provinceFilter;

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
      width: isAllServicesView ? "13%" : role === "MANAGER" ? "17%" : "18%",
      className: "px-4 py-3 font-semibold text-slate-900",
      render: (service) => service.service_name || "—",
    },
    isAllServicesView && {
      key: "client",
      title: "Client",
      width: "10%",
      render: (service) => service.client_name || "Client",
    },
    {
      key: "type",
      title: "Type",
      width: isAllServicesView ? "10%" : role === "MANAGER" ? "11%" : "12%",
      render: (service) =>
        service.service_type === "SUBSCRIPTION" ? "Subscription" : "One-time",
    },
    {
      key: "address",
      title: "Service Address",
      width: isAllServicesView ? "21%" : role === "MANAGER" ? "24%" : "28%",
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
      width: role === "MANAGER" ? "9%" : "10%",
      render: (service) =>
        service.start_date ? formatDate(service.start_date, false) : "—",
    },
    {
      key: "end",
      title: "End",
      width: isAllServicesView ? "9%" : "10%",
      render: (service) =>
        service.end_date ? formatDate(service.end_date, false) : "—",
    },
    {
      key: "status",
      title: "Status",
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
    role === "MANAGER" && {
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
            {hasFilters && (
              <button
                className="text-xs font-semibold text-secondary underline underline-offset-4"
                onClick={() => {
                  setTypeFilter("");
                  setStatusFilter("");
                  setCountryFilter("");
                  setProvinceFilter("");
                }}
                type="button"
              >
                Clear filters
              </button>
            )}
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
                value={typeFilter}
                onChange={setTypeFilter}
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
                value={statusFilter}
                onChange={setStatusFilter}
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
                  setCountryFilter(value);
                  setProvinceFilter("");
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
                value={provinceFilter}
                onChange={setProvinceFilter}
                placeholder="Province/State"
                options={provinceOptions}
                buttonClassName="h-10 border-gray-200 bg-white"
                menuClassName="max-h-64 overflow-auto"
                disabled={false}
              />
            </div>
          </div>
        </div>
        <RecordsTable
          columns={columns}
          tableClassName="min-w-[950px] sm:min-w-[1350px]"
          rows={filteredServices}
          rowKey={(service) => service.id}
          empty={
            <div className="text-center text-sm text-slate-500">
              {services.length
                ? "No services match your filters."
                : "No services found."}
            </div>
          }
          footer={
            <p>
              Showing {filteredServices.length} of {services.length} services
            </p>
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
