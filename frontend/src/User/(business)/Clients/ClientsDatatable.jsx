import { Fragment, useState, useEffect, useMemo, useRef } from "react";
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
import { useFetchClientsQuery, useDeleteClientMutation } from "../../../store";
import SubmitButton from "../../../Components/ui/SubmitButton";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import LoadingScreen from "../../../Components/ui/LoadingScreen";

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

  const Cell = (props) => {
    if (props.column.name === "actions") {
      return (
        <Table.Cell {...props}>
          <Link
            to={`/user/business/client/${props.row.id}/services`}
            className="inline-flex items-center gap-2 rounded-lg bg-secondary/90 px-3 py-1 text-xs font-semibold text-white shadow transition hover:bg-secondary"
            title="Client Services"
          >
            <MdOutlineMiscellaneousServices className="h-4 w-4" /> Services
          </Link>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
            onClick={() => handleDeleteClick(props.row.id)}
            title="Delete Client"
            type="button"
          >
            <LuTrash2 className="h-4 w-4" /> Delete
          </button>
        </Table.Cell>
      );
    } else if (props.column.name === "client_name") {
      return (
        <Table.Cell {...props}>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">
              {props.row.client_name}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${props.row.is_active === "True"
                  ? "bg-accent/15 text-accent"
                  : "bg-amber-100 text-amber-800"
                }`}
            >
              {props.row.is_active === "True" ? "ACTIVE" : "INACTIVE"}
            </span>
          </div>
        </Table.Cell>
      );
    }
    return <Table.Cell {...props} />;
  };

  const HeaderCell = (props) => (
    <TableHeaderRow.Cell
      {...props}
      className="bg-gray-50 text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-600"
    />
  );

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

      <div className="flex min-h-[65vh] flex-col overflow-visible rounded-2xl border border-gray-200 bg-[#fbfbfc] shadow-sm">
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
                className="h-12 md:h-14 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm focus:border-accent focus:outline-none"
              />
            </div>

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsFilterOpen((prev) => !prev)}
                className="relative inline-flex h-12 md:h-14 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 md:px-6 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-gray-50"
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

        {filteredRows.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-14 text-center">
            <div className="relative flex items-center justify-center">
              <img
                src="/images/add-clients.svg"
                alt="Add clients"
                className="h-56 w-56 object-contain"
              />
            </div>

            <p className="text-2xl -mt-8 font-semibold text-slate-800">
              No clients yet
            </p>
            <p className="max-w-100! text-slate-500">
              Get started by adding your first client. Once added, you can
              manage their services, track engagement, and organize their
              account details.
            </p>

            <button
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-accent px-7 py-3 font-semibold text-white shadow hover:bg-accentLight"
              onClick={() => showAddClient(true)}
              type="button"
            >
              <LuPlus className="h-4 w-4" /> Add Your First Client
            </button>

            <p className="mt-2 text-sm text-slate-400">
              Once you add a client, their services and access can be managed
              here.
            </p>
          </div>
        ) : (
          <div className="flex-1 space-y-4 px-4 py-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 md:px-5 lg:flex lg:flex-col lg:space-y-4 lg:gap-0">
            {paginatedRows.map((row) => {
              const isActive =
                row.is_active === "True" || row.is_active === true;
              const clientLabel = row.client_name || row.name || "Client";
              const email =
                row.email || row.client_email || "No email provided";
              const phone =
                row.client_phone || row.phone || "No phone provided";
              const paymentMethod =
                row.payment_method ||
                row.paymentMethod ||
                row.payment ||
                "No payment method";

              return (
                <Fragment key={row.id}>
                  {/* Mobile and tablet card layout (default and md, hidden on lg+) */}
                  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm lg:hidden h-fit">
                    <div className="flex flex-col items-center gap-3 text-center px-4 py-4 md:px-5">
                      {/* Avatar and client name section */}
                      <div className="flex items-center justify-start gap-3 w-full">
                        {/* Client avatar */}
                        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 to-purple-500 text-lg font-semibold text-white shadow">
                          {(clientLabel || "C").slice(0, 2).toUpperCase()}
                          <span
                            className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${isActive ? "bg-emerald-500" : "bg-slate-400"}`}
                          />
                        </div>
                        {/* Client name and status */}
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <p className="text-xs font-medium uppercase tracking-[0.06em] text-slate-500">
                              Client Name
                            </p>
                            <span
                              className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-semibold ${isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                            >
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <p className="truncate text-lg text-left font-medium text-slate-900">
                            {clientLabel}
                          </p>
                        </div>
                      </div>

                      {/* Client details grid */}
                      <div className="grid w-full grid-cols-1 gap-3 text-left text-sm text-slate-700 px-2">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-[0.06em] text-slate-500">
                            Email Address
                          </p>
                          <p className="truncate">{email}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-[0.06em] text-slate-500">
                            Phone Number
                          </p>
                          <p className="truncate">{phone}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-[0.06em] text-slate-500">
                            Payment Method
                          </p>
                          <p className="truncate">{paymentMethod}</p>
                        </div>
                      </div>

                      {/* Divider line */}
                      <div className="h-px w-full bg-secondary/40" />

                      {/* Card actions */}
                      <div className="flex flex-wrap justify-end w-full gap-2">
                        <Link
                          to={`/user/business/client/${row.id}/services`}
                          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-accentLight"
                        >
                          <MdOutlineMiscellaneousServices className="h-4 w-4" />{" "}
                          Services
                        </Link>
                        <Link
                          to={`/user/business/client/${row.id}`}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-500 transition hover:bg-gray-50 hover:text-accent"
                          title="Edit Client"
                          aria-label={`Edit ${clientLabel}`}
                        >
                          <LuPencil className="h-4 w-4" />
                        </Link>
                        <button
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                          onClick={() => handleDeleteClick(row.id)}
                          title="Delete Client"
                          type="button"
                        >
                          <LuTrash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Desktop row layout (lg and up only) */}
                  <div className="hidden items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm md:px-5 lg:flex">
                    {/* Left section: avatar, name, and info columns */}
                    <div className="flex min-w-0 flex-1 items-center gap-5">
                      {/* Client avatar */}
                      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 to-purple-500 text-lg font-semibold text-white shadow">
                        {(clientLabel || "C").slice(0, 2).toUpperCase()}
                        <span
                          className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${isActive ? "bg-emerald-500" : "bg-slate-400"}`}
                        />
                      </div>

                      {/* Client name column */}
                      <div className="flex-1" style={{ minWidth: "11rem" }}>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-medium uppercase tracking-[0.06em] text-slate-500">
                            Client Name
                          </p>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                          >
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="truncate text-lg font-medium text-slate-900">
                          {clientLabel}
                        </p>
                      </div>

                      {/* Email column */}
                      <div
                        className="hidden flex-1 flex-col md:flex"
                        style={{ minWidth: "12.5rem" }}
                      >
                        <p className="text-xs font-medium uppercase tracking-[0.06em] text-slate-500">
                          Email Address
                        </p>
                        <p className="truncate text-sm text-slate-700">
                          {email}
                        </p>
                      </div>

                      {/* Phone column */}
                      <div
                        className="hidden flex-1 flex-col lg:flex"
                        style={{ minWidth: "10.5rem" }}
                      >
                        <p className="text-xs font-medium uppercase tracking-[0.06em] text-slate-500">
                          Phone Number
                        </p>
                        <p className="truncate text-sm text-slate-700">
                          {phone}
                        </p>
                      </div>

                      {/* Payment method column */}
                      <div
                        className="hidden flex-1 flex-col xl:flex"
                        style={{ minWidth: "11rem" }}
                      >
                        <p className="text-xs font-medium uppercase tracking-[0.06em] text-slate-500">
                          Payment Method
                        </p>
                        <p className="truncate text-sm text-slate-700">
                          {paymentMethod}
                        </p>
                      </div>
                    </div>

                    {/* Right section: action buttons */}
                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        to={`/user/business/client/${row.id}/services`}
                        className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-accentLight"
                      >
                        <MdOutlineMiscellaneousServices className="h-4 w-4" />{" "}
                        Services
                      </Link>
                      <Link
                        to={`/user/business/client/${row.id}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-400 transition hover:bg-gray-50 hover:text-accent"
                        title="Edit Client"
                        aria-label={`Edit ${clientLabel}`}
                      >
                        <LuPencil className="h-4 w-4" />
                      </Link>
                      <button
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-400 transition hover:bg-gray-50 hover:text-red-500"
                        onClick={() => handleDeleteClick(row.id)}
                        title="Delete Client"
                        type="button"
                      >
                        <LuTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Fragment>
              );
            })}
          </div>
        )}

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
                            className={`flex items-center gap-2 w-full ${isSelected
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

            <p className="text-gray-600">
              This action cannot be undone.
            </p>

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
