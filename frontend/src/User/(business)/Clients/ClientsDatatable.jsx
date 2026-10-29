import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { LuPencil, LuTrash2, LuPlus } from "react-icons/lu";
import { MdOutlineMiscellaneousServices } from "react-icons/md";
import {
  LuSearch,
  LuSlidersHorizontal,
  LuCircle,
  LuX,
  LuChevronDown,
} from "react-icons/lu";
import {
  useFetchClientsQuery,
  useDeleteClientMutation,
  useFetchServicesQuery,
} from "../../../store";
import SubmitButton from "../../../Components/ui/SubmitButton";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import LoadingScreen from "../../../Components/ui/LoadingScreen";
import RecordsTable from "../../../Components/ui/RecordsTable";

export default function ClientsDatatable({ token, showAddClient }) {
  const [rows, setRows] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const {
    data: clientData,
    isLoading,
    error,
  } = useFetchClientsQuery(undefined, { skip: !token });
  const { data: servicesData = [] } = useFetchServicesQuery(undefined, {
    skip: !token,
  });

  const [deleteClient, { isLoading: deleting }] = useDeleteClientMutation();

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [pageSizes] = useState([20, 30, 50]);
  const [isPageSizeOpen, setIsPageSizeOpen] = useState(false);
  const [isPageNavOpen, setIsPageNavOpen] = useState(false);
  const pageSizeRef = useRef(null);
  const pageNavRef = useRef(null);

  useEffect(() => {
    if (clientData) {
      setRows(clientData.results);
    }
  }, [clientData]);

  useEffect(() => {
    if (error) {
      setAlert({
        type: "danger",
        message: error?.data?.detail || "Failed to load client data.",
      });
    }
  }, [error]);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter(
      (row) => row.is_active === "True" || row.is_active === true,
    ).length;
    const inactive = total - active;

    const delta = (value) => `+${Math.max(0, Math.round(value * 0.1))}`;

    return [
      { label: "Total Clients", value: total, change: delta(total) },
      { label: "Active", value: active, change: delta(active) },
      { label: "Inactive", value: inactive, change: delta(inactive) },
    ];
  }, [rows]);

  const statusOptions = [
    { label: "All", value: "ALL" },
    { label: "Active", value: "ACTIVE" },
    { label: "Inactive", value: "INACTIVE" },
  ];

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return rows.filter((row) => {
      const status =
        row.is_active === "True" || row.is_active === true
          ? "ACTIVE"
          : "INACTIVE";
      const searchable = [
        row.client_name,
        row.name,
        row.email,
        row.client_phone,
        row.phone,
        row.client_email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesStatus =
        selectedStatus === "ALL" || status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [rows, searchTerm, selectedStatus]);

  const questionnaireCountsByClient = useMemo(() => {
    return servicesData.reduce((counts, service) => {
      const clientId = String(service.client || "");
      if (!clientId || service.bypass_questionnaire) return counts;

      const current = counts.get(clientId) || { filled: 0, total: 0 };
      const filledQuestionnaire = service.filled_questionnaire;
      const isFilled =
        !!filledQuestionnaire &&
        (!Array.isArray(filledQuestionnaire) ||
          filledQuestionnaire.length > 0) &&
        (typeof filledQuestionnaire !== "object" ||
          Array.isArray(filledQuestionnaire) ||
          Object.keys(filledQuestionnaire).length > 0);

      counts.set(clientId, {
        total: current.total + 1,
        filled: current.filled + (isFilled ? 1 : 0),
      });

      return counts;
    }, new Map());
  }, [servicesData]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages - 1);
  const paginatedRows = useMemo(() => {
    const startIndex = safeCurrentPage * pageSize;
    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [filteredRows, pageSize, safeCurrentPage]);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, selectedStatus, pageSize]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!pageSizeRef.current?.contains(event.target)) {
        setIsPageSizeOpen(false);
      }

      if (!pageNavRef.current?.contains(event.target)) {
        setIsPageNavOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsPageSizeOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

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

  const columns = [
    {
      key: "client",
      title: "Client",
      className: "px-4 py-3 font-semibold text-slate-900",
      render: (row) => row.client_name || row.name || "Client",
    },
    {
      key: "email",
      title: "Email Address",
      render: (row) => row.email || row.client_email || "—",
    },
    {
      key: "phone",
      title: "Phone Number",
      render: (row) => row.client_phone || row.phone || "—",
    },
    {
      key: "payment",
      title: "Payment Method",
      render: (row) =>
        row.payment_method || row.paymentMethod || row.payment || "—",
    },
    {
      key: "questionnaires",
      title: "Questionnaires",
      render: (row) => {
        const counts = questionnaireCountsByClient.get(String(row.id));
        const filled = Number(counts?.filled ?? row.questionnaires_filled ?? 0);
        const total = Number(counts?.total ?? row.questionnaires_total ?? 0);
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
      render: (row) => {
        const active = row.is_active === true || row.is_active === "True";
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
            aria-label={`Services for ${row.client_name || row.name}`}
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
            aria-label={`Edit ${row.client_name || row.name}`}
          >
            <LuPencil className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => handleDeleteClick(row.id)}
            className="rounded-xl p-2 text-rose-600 hover:bg-rose-50"
            title="Delete Client"
            aria-label={`Delete ${row.client_name || row.name}`}
          >
            <LuTrash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) return <LoadingScreen />;

  const hasActiveFilters = selectedStatus !== "ALL";

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
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search clients by name, email, or phone..."
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
                          {statusOptions.map((option) => {
                            const isSelected = selectedStatus === option.value;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setSelectedStatus(option.value)}
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
                                  className={`h-2.5 w-2.5 rounded-full ${option.value === "ACTIVE" ? "bg-emerald-500" : option.value === "INACTIVE" ? "bg-slate-400" : "bg-transparent"}`}
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
                      onClick={() => {
                        setSelectedStatus("ALL");
                        setSearchTerm("");
                      }}
                      className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-gray-50"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFilterOpen(false)}
                      className="flex-1 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accentLight"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <RecordsTable
          columns={columns}
          rows={paginatedRows}
          rowKey={(row) => row.id}
          empty={
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <img
                src="/images/add-clients.svg"
                alt=""
                className="h-40 w-40 object-contain"
              />
              <h5 className="mt-3 text-xl font-medium text-slate-900">
                {rows.length
                  ? "No clients match your filters."
                  : "No clients yet"}
              </h5>
              <p className="mt-2 text-sm text-slate-500">
                {rows.length
                  ? "Try adjusting your search or status filter."
                  : "Add your first client to manage their services and account details."}
              </p>
              {!rows.length && (
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
        />

        {/* Footer: page size selector and pagination */}
        <div className="mt-auto border-t border-gray-200 bg-white px-4 py-2 md:px-4 md:py-3 rounded-b-2xl">
          <div className="flex items-end gap-2 md:gap-3 md:items-center justify-between">
            {/* Page size selector */}
            <div className="flex items-end md:items-center gap-2 text-sm text-slate-600">
              <span className="hidden md:inline-flex">Show</span>
              <div ref={pageSizeRef} className="relative w-24 md:w-24 lg:w-32">
                <button
                  type="button"
                  onClick={() => setIsPageSizeOpen((prev) => !prev)}
                  className="flex h-9 w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-2 md:px-3 text-sm md:text-base font-medium text-slate-700 shadow-sm transition hover:border-accent hover:text-slate-900"
                >
                  <span>{pageSize} / page</span>
                  <LuChevronDown
                    className={`h-4 w-4 text-slate-500 transition-transform ${isPageSizeOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isPageSizeOpen && (
                  <div className="absolute bottom-[calc(100%+8px)] left-0 z-40 space-y-1 py-2 w-full overflow-hidden rounded-xl md:rounded-2xl border border-gray-200 bg-white shadow-[0_20px_35px_rgba(15,23,42,0.18)]">
                    {pageSizes.map((size) => {
                      const isSelected = pageSize === size;

                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            setCurrentPage(0);
                            setPageSize(size);
                            setIsPageSizeOpen(false);
                          }}
                          className={`w-full px-2  text-left text-base transition `}
                        >
                          <div
                            className={`flex items-center gap-2 w-full ${
                              isSelected
                                ? "bg-accent/10 font-semibold text-slate-900"
                                : "text-slate-700 hover:bg-gray-50"
                            } rounded-lg px-2 py-1`}
                          >
                            <span>{size}</span>
                            {isSelected && (
                              <LuCircle className="h-3 w-3 fill-current text-accent" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center justify-end gap-2 text-xs md:text-sm text-slate-600">
              <div ref={pageNavRef} className="relative md:hidden">
                <button
                  type="button"
                  onClick={() => setIsPageNavOpen((prev) => !prev)}
                  className="flex h-9 w-28 items-center justify-between rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-accent hover:text-slate-900"
                >
                  <span>
                    Page {safeCurrentPage + 1} / {totalPages}
                  </span>
                  <LuChevronDown
                    className={`h-4 w-4 text-slate-500 transition-transform ${isPageNavOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isPageNavOpen && (
                  <div className="absolute bottom-[calc(100%+8px)] right-0 z-40 max-h-64 w-36 px-2 overflow-auto rounded-2xl border border-gray-200 bg-white py-2 shadow-[0_20px_35px_rgba(15,23,42,0.18)]">
                    {Array.from(
                      { length: totalPages },
                      (_, index) => index + 1,
                    ).map((pageNumber) => {
                      const isSelected = pageNumber === safeCurrentPage + 1;

                      return (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => {
                            setCurrentPage(pageNumber - 1);
                            setIsPageNavOpen(false);
                          }}
                          className={`flex w-full items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition ${isSelected ? "bg-accent/10 font-semibold text-slate-900" : "text-slate-700 hover:bg-gray-50"}`}
                        >
                          <span>Page {pageNumber}</span>
                          {isSelected && (
                            <LuCircle className="h-3 w-3 fill-current text-accent" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <span className="hidden md:inline-flex">
                Page {safeCurrentPage + 1} of {totalPages}
              </span>
              <div className="hidden items-center gap-1 md:flex">
                <button
                  type="button"
                  onClick={() => setCurrentPage(0)}
                  disabled={safeCurrentPage === 0}
                  className="flex h-9 md:h-10 w-9 md:w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-400 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 text-xs md:text-sm font-medium"
                  aria-label="First page"
                >
                  «
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 0))
                  }
                  disabled={safeCurrentPage === 0}
                  className="flex h-9 md:h-10 w-9 md:w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-400 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 text-xs md:text-sm font-medium"
                  aria-label="Previous page"
                >
                  ‹
                </button>
                <button
                  type="button"
                  disabled
                  className="flex h-9 md:h-10 min-w-9 md:min-w-10 items-center justify-center rounded-xl bg-accent px-2 md:px-3 text-xs md:text-sm font-semibold text-white"
                  aria-label="Current page"
                >
                  {safeCurrentPage + 1}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))
                  }
                  disabled={safeCurrentPage >= totalPages - 1}
                  className="flex h-9 md:h-10 w-9 md:w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-400 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 text-xs md:text-sm font-medium"
                  aria-label="Next page"
                >
                  ›
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages - 1)}
                  disabled={safeCurrentPage >= totalPages - 1}
                  className="flex h-9 md:h-10 w-9 md:w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-400 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 text-xs md:text-sm font-medium"
                  aria-label="Last page"
                >
                  »
                </button>
              </div>
            </div>
          </div>
        </div>
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
