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
import { countries, provinces } from "../../../../constants/locations";
import { formatDate } from "../../../../utils/formatDate";
import Dropdown from "../../../../Components/ui/Dropdown";

export default function ClientServicesData({
  token,
  role,
  clientId,
  setAlert,
}) {
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
  const [countryFilter, setCountryFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");

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
        (!statusFilter || service.status === statusFilter) &&
        (!typeFilter || service.service_type === typeFilter) &&
        (!countryFilter || service.country === countryFilter) &&
        (!provinceFilter || service.province_state === provinceFilter)
      );
    });
  }, [services, statusFilter, typeFilter, countryFilter, provinceFilter]);

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

  const statusTabs = [
    {
      key: "PENDING",
      label: "Pending",
    },
    {
      key: "ACTIVE",
      label: "Active",
    },
    {
      key: "COMPLETED",
      label: "Completed",
    },
    {
      key: "CANCELLED",
      label: "Cancelled",
    },
  ];

  const hasFilters =
    statusFilter !== "PENDING" || typeFilter || countryFilter || provinceFilter;

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

  if (isLoading)
    return <div className="text-center py-4">Loading services...</div>;

  return (
    <>
      <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
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
                setCountryFilter("");
                setProvinceFilter("");
              }}
              type="button"
            >
              Clear filters
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {statusTabs.map((tab) => {
          const isActive = statusFilter === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : "border-gray-200 bg-white text-slate-600 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filteredServices.length ? (
          filteredServices.map((service) => {
            const serviceTypeLabel =
              service.service_type === "SUBSCRIPTION"
                ? "SUBSCRIPTION"
                : "ONE-TIME";

            return (
              <div
                key={service.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="space-y-3 px-4 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <h6 className="text-2xl font-semibold text-slate-900">
                      {service.service_name}
                    </h6>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.05em] text-white">
                      {serviceTypeLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p className="text-slate-600">
                      <span className="block text-xs text-slate-400">
                        Start
                      </span>
                      {formatDate(service.start_date, false)}
                    </p>
                    <p className="text-slate-600">
                      <span className="block text-xs text-slate-400">End</span>
                      {service.end_date
                        ? formatDate(service.end_date, false)
                        : "-"}
                    </p>
                  </div>

                  <p className="text-sm text-slate-600">
                    <span className="block text-xs text-slate-400">
                      Service Address
                    </span>
                    {[
                      service.street_address,
                      service.city,
                      service.province_state,
                      service.country,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Address not provided"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 px-4 py-3">
                  {service.service_questionnaires?.id ? (
                    <Link
                      to={`/user/business/service-questionnaire/${service.service_questionnaires?.id}/form/${service.id}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      {service.filled_questionnaire && (
                        <LuCheck className="h-3.5 w-3.5" />
                      )}
                      Service Questionnaires
                    </Link>
                  ) : (
                    <span className="inline-flex items-center rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">
                      No Questionnaire
                    </span>
                  )}

                  {role === "MANAGER" && (
                    <div className="flex gap-2">
                      <button
                        className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        onClick={() => handleDeleteClick(service.id)}
                        title="Delete Service"
                        type="button"
                      >
                        <LuTrash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                      <Link
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-gray-100"
                        to={`/user/business/service/${service.id}`}
                        title="Edit Service"
                      >
                        <LuPencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center text-sm text-slate-500">
            No{" "}
            {statusTabs
              .find((tab) => tab.key === statusFilter)
              ?.label.toLowerCase()}{" "}
            services found.
          </div>
        )}
      </div>

      {/* DELETE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form
            onSubmit={confirmDelete}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
            role="dialog"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h5 className="text-lg font-semibold text-primary">
                  Delete Service
                </h5>
                <p className="mt-1 text-sm text-gray-600">
                  This cannot be undone.
                </p>
              </div>
              <button
                type="button"
                className="text-gray-400 transition hover:text-gray-600"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <SubmitButton
                isLoading={deleting}
                btnClass="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-lg disabled:opacity-60"
                btnName="Delete"
              />
            </div>
          </form>
        </div>
      )}
    </>
  );
}
