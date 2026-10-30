import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  useFetchJobsPageQuery,
  useBulkJobsMutation,
  useDeleteJobMutation,
  useFetchTeamMembersQuery,
} from "../../../store";
import SubmitButton from "../../../Components/ui/SubmitButton";
import Dropdown from "../../../Components/ui/Dropdown";
import LoadingScreen from "../../../Components/ui/LoadingScreen";
import RecordsTable from "../../../Components/ui/RecordsTable";
import RecordLink from "../../../Components/ui/RecordLink";
import BulkActionBar from "../../../Components/ui/BulkActionBar";
import TablePagination from "../../../Components/ui/TablePagination";
import useServerTable from "../../../hooks/useServerTable";
import { LuPencilLine, LuSearch, LuTrash2 } from "react-icons/lu";

const plural = (count) => `${count} job${count === 1 ? "" : "s"}`;

const BULK_ACTIONS = [
  {
    key: "cancel",
    label: "Cancel jobs",
    tone: "default",
    confirmMessage: (count) =>
      `Cancel ${plural(count)}? Completed jobs are skipped.`,
  },
  {
    key: "delete",
    label: "Delete",
    tone: "danger",
    confirmMessage: (count) =>
      `Delete ${plural(count)}? This cannot be undone.`,
  },
];

const UNASSIGNED = "unassigned";

export default function JobData({ token, role, setAlert }) {
  const isManager = role === "MANAGER";
  const table = useServerTable({ initialOrdering: "-created_at" });
  const { data, isLoading, isFetching, error } = useFetchJobsPageQuery(
    table.queryArgs,
    { skip: !token },
  );
  const { data: teamMembers = [] } = useFetchTeamMembersQuery(undefined, {
    skip: !token || !isManager,
  });

  const [deleteJob, { isLoading: deleting }] = useDeleteJobMutation();
  const [bulkJobs] = useBulkJobsMutation();
  const [showModal, setShowModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);

  const jobs = data?.results || [];

  useEffect(() => {
    if (error) {
      setAlert({
        type: "danger",
        message:
          error?.data?.detail || "Failed to load jobs. Please try again later.",
      });
    }
  }, [error, setAlert]);

  const runBulkAction = async (action) => {
    const result = await bulkJobs({ action, ids: table.selectedIds }).unwrap();
    table.clearSelection();
    return result;
  };

  const jobTitleFor = (id) =>
    jobs.find((job) => String(job.id) === String(id))?.title || `#${id}`;

  const handleDeleteClick = (id) => {
    setSelectedJobId(id);
    setShowModal(true);
  };

  const confirmDelete = async (e) => {
    e.preventDefault();
    if (!selectedJobId) return;

    try {
      await deleteJob(selectedJobId).unwrap();
      setAlert({
        type: "success",
        message: "Job deleted successfully!",
      });
    } catch (err) {
      const msg =
        err?.data?.detail || "Failed to delete job. Please try again.";
      setAlert({
        type: "danger",
        message: msg,
      });
    } finally {
      setShowModal(false);
      setSelectedJobId(null);
    }
  };

  const columns = [
    {
      key: "job",
      title: "Job",
      sortKey: "title",
      width: "20%",
      className: "px-4 py-3 font-semibold text-slate-900",
      render: (job) => (
        <RecordLink to={`/user/business/job/${job.id}`} className="text-slate-900">
          {job.title || "—"}
        </RecordLink>
      ),
    },
    {
      key: "service",
      title: "Service",
      sortKey: "service__service_name",
      width: "20%",
      render: (job) => (
        <RecordLink
          to={isManager && job.service ? `/user/business/service/${job.service}` : null}
        >
          {job.service_name || "—"}
        </RecordLink>
      ),
    },
    {
      key: "assigned",
      title: "Assigned To",
      sortKey: "assigned_to__employee__name",
      width: "20%",
      render: (job) =>
        job.assigned_to_name ? (
          <RecordLink
            to={isManager && job.assigned_to ? `/user/business/team-member/${job.assigned_to}` : null}
          >
            {job.assigned_to_name}
          </RecordLink>
        ) : (
          "Unassigned"
        ),
    },
    {
      key: "scheduled",
      title: "Scheduled",
      sortKey: "scheduled_date",
      width: "15%",
      render: (job) =>
        job.scheduled_date
          ? new Date(job.scheduled_date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "—",
    },
    {
      key: "status",
      title: "Status",
      sortKey: "status",
      width: "12%",
      render: (job) => {
        const tone =
          {
            PENDING: "bg-amber-100 text-amber-800",
            IN_PROGRESS: "bg-sky-100 text-sky-700",
            COMPLETED: "bg-emerald-100 text-emerald-700",
            CANCELLED: "bg-rose-100 text-rose-700",
          }[job.status] || "bg-slate-100 text-slate-700";
        return (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${tone}`}
          >
            {(job.status || "PENDING").replaceAll("_", " ")}
          </span>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      width: "13%",
      render: (job) =>
        isManager ? (
          <div className="flex items-center gap-1">
            <Link
              to={`/user/business/job/${job.id}`}
              className="rounded-xl p-2 text-secondary hover:bg-secondary/5"
              title={`Edit ${job.title || "job"}`}
              aria-label={`Edit ${job.title || "job"}`}
            >
              <LuPencilLine className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => handleDeleteClick(job.id)}
              className="rounded-xl p-2 text-rose-600 hover:bg-rose-50"
              title={`Delete ${job.title || "job"}`}
              aria-label={`Delete ${job.title || "job"}`}
            >
              <LuTrash2 className="h-4 w-4" />
            </button>
          </div>
        ) : role === "EMPLOYEE" ? (
          <Link
            to={`/user/business/job/${job.id}`}
            className="inline-flex items-center gap-1 rounded-xl p-2 text-secondary hover:bg-secondary/5"
            title={`Update ${job.title || "job"}`}
          >
            <LuPencilLine className="h-4 w-4" />
            Update
          </Link>
        ) : (
          "—"
        ),
    },
  ];

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end gap-3 border-b border-gray-100 p-4">
          <div className="flex-[2] min-w-60">
            <label
              htmlFor="jobs-search"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Search
            </label>
            <div className="relative">
              <LuSearch
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="jobs-search"
                type="search"
                value={table.searchInput}
                onChange={(e) => table.setSearchInput(e.target.value)}
                placeholder="Job, service, client or team member"
                className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-900 focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {isManager && (
            <div className="flex-1 min-w-50">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Assigned To
              </label>
              <Dropdown
                id="jobs-assignedto-filter"
                value={
                  table.filters.unassigned
                    ? UNASSIGNED
                    : table.filters.assigned_to || ""
                }
                onChange={(value) => {
                  table.setFilter("unassigned", value === UNASSIGNED ? "true" : "");
                  table.setFilter("assigned_to", value === UNASSIGNED ? "" : value);
                }}
                placeholder="All team members"
                options={[
                  { value: "", label: "All team members" },
                  { value: UNASSIGNED, label: "Unassigned" },
                  ...teamMembers.map((member) => ({
                    value: String(member.id),
                    label: member.employee_name || `#${member.id}`,
                  })),
                ]}
                buttonClassName="h-11 rounded-lg border-gray-300 px-4 text-sm text-gray-900"
                menuClassName="rounded-lg"
              />
            </div>
          )}

          <div className="flex-1 min-w-50">
            <label
              htmlFor="jobs-status-filter"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Status
            </label>
            <Dropdown
              id="jobs-status-filter"
              value={table.filters.status || ""}
              onChange={(value) => table.setFilter("status", value)}
              options={[
                { value: "", label: "All statuses" },
                { value: "PENDING", label: "Pending" },
                { value: "IN_PROGRESS", label: "In Progress" },
                { value: "COMPLETED", label: "Completed" },
                { value: "CANCELLED", label: "Cancelled" },
              ]}
              buttonClassName="h-11 rounded-lg border-gray-300 px-4 text-sm text-gray-900"
              menuClassName="rounded-lg"
            />
          </div>

          <div className="flex-1 min-w-50">
            <label
              htmlFor="jobdata-start-date"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Start Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="jobdata-start-date"
                value={table.filters.scheduled_from || ""}
                onChange={(e) => table.setFilter("scheduled_from", e.target.value)}
                placeholder="dd/mm/yyyy"
                className="h-11 date-input-no-icon w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 pr-11 text-sm text-gray-900 transition focus:border-accent focus:outline-none"
              />
              <svg
                className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 cursor-pointer text-gray-400 transition hover:text-gray-600"
                onClick={() =>
                  document.getElementById("jobdata-start-date")?.showPicker()
                }
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          <div className="flex-1 min-w-50">
            <label
              htmlFor="jobdata-end-date"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              End Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="jobdata-end-date"
                value={table.filters.scheduled_to || ""}
                onChange={(e) => table.setFilter("scheduled_to", e.target.value)}
                placeholder="dd/mm/yyyy"
                className="h-11 date-input-no-icon w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 pr-11 text-sm text-gray-900 transition focus:border-accent focus:outline-none"
              />
              <svg
                className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 cursor-pointer text-gray-400 transition hover:text-gray-600"
                onClick={() =>
                  document.getElementById("jobdata-end-date")?.showPicker()
                }
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </div>
        {isManager && (
          <BulkActionBar
            selectedCount={table.selectedIds.length}
            actions={BULK_ACTIONS.map((action) => ({
              ...action,
              describeRow: jobTitleFor,
            }))}
            onRun={runBulkAction}
            onClear={table.clearSelection}
          />
        )}
        <RecordsTable
          columns={columns}
          tableClassName="min-w-[700px] sm:min-w-[900px]"
          rows={jobs}
          rowKey={(job) => job.id}
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
              {table.hasActiveFilters
                ? "No jobs match your filters."
                : "No jobs found."}
            </div>
          }
          footer={
            <TablePagination
              page={table.page}
              pageSize={table.pageSize}
              count={data?.count}
              totalPages={data?.total_pages}
              isFetching={isFetching}
              noun="jobs"
              onPageChange={table.goToPage}
              onPageSizeChange={table.setPageSize}
            />
          }
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-gray-900/40"
            onClick={() => setShowModal(false)}
          ></div>

          <form
            onSubmit={confirmDelete}
            className="relative z-10 w-full md:w-4/7 lg:w-2/7 max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-6"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between">
              <h5 className="text-xl font-medium text-gray-900">Delete Job</h5>
              <button
                type="button"
                className="text-gray-400 transition hover:text-gray-600"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-gray-600">
              Are you sure you want to delete this job?
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
    </>
  );
}
