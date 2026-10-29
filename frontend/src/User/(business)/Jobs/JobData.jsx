import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useFetchJobsQuery, useDeleteJobMutation } from "../../../store";
import SubmitButton from "../../../Components/ui/SubmitButton";
import Dropdown from "../../../Components/ui/Dropdown";
import LoadingScreen from "../../../Components/ui/LoadingScreen";
import RecordsTable from "../../../Components/ui/RecordsTable";
import { LuPencilLine, LuTrash2 } from "react-icons/lu";

export default function JobData({ token, role, setAlert }) {
  const [deleteJob, { isLoading: deleting }] = useDeleteJobMutation();
  const [showModal, setShowModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);

  // --- Filters ---
  const [serviceFilter, setServiceFilter] = useState("");
  const [assignedToFilter, setAssignedToFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  const {
    data: jobs = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useFetchJobsQuery(undefined, { skip: !token });

  // --- Error handling ---
  useEffect(() => {
    if (isError) {
      console.error("Fetch jobs error:", error);
      setAlert({
        type: "danger",
        message: "Failed to load jobs. Please try again later.",
      });
    }
  }, [isError, error, setAlert]);

  const uniqueServices = useMemo(
    () => [...new Set(jobs.map((j) => j.service_name).filter(Boolean))],
    [jobs],
  );
  const uniqueAssignees = useMemo(
    () => [...new Set(jobs.map((j) => j.assigned_to_name || "Unassigned"))],
    [jobs],
  );

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchService = !serviceFilter || job.service_name === serviceFilter;
      const matchAssigned =
        !assignedToFilter ||
        (assignedToFilter === "Unassigned" && !job.assigned_to_name) ||
        job.assigned_to_name === assignedToFilter;
      const matchStatus = !statusFilter || job.status === statusFilter;
      const matchStart =
        !startDateFilter ||
        new Date(job.scheduled_date) >= new Date(startDateFilter);
      const matchEnd =
        !endDateFilter ||
        new Date(job.scheduled_date) <= new Date(endDateFilter);
      return (
        matchService && matchAssigned && matchStatus && matchStart && matchEnd
      );
    });
  }, [
    jobs,
    serviceFilter,
    assignedToFilter,
    statusFilter,
    startDateFilter,
    endDateFilter,
  ]);

  const handleDeleteClick = (id) => {
    setSelectedJobId(id);
    setShowModal(true);
  };

  const confirmDelete = async (e) => {
    e.preventDefault();
    if (!selectedJobId) return;

    try {
      await deleteJob(selectedJobId).unwrap();
      refetch();
      setAlert({
        type: "success",
        message: "Job deleted successfully!",
      });
    } catch (err) {
      console.error("Failed to delete job:", err);
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
      width: "20%",
      className: "px-4 py-3 font-semibold text-slate-900",
      render: (job) => job.title || "—",
    },
    {
      key: "service",
      title: "Service",
      width: "20%",
      render: (job) => job.service_name || "—",
    },
    {
      key: "assigned",
      title: "Assigned To",
      width: "20%",
      render: (job) => job.assigned_to_name || "Unassigned",
    },
    {
      key: "scheduled",
      title: "Scheduled",
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
        role === "MANAGER" ? (
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
          <div className="flex-1 min-w-50">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Service
            </label>
            <Dropdown
              id="jobs-service-filter"
              value={serviceFilter}
              onChange={setServiceFilter}
              placeholder="Select Service"
              options={uniqueServices}
              buttonClassName="h-11 rounded-lg border-gray-300 px-4 text-sm text-gray-900"
              menuClassName="rounded-lg"
            />
          </div>

          <div className="flex-1 min-w-50">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Assigned To
            </label>
            <Dropdown
              id="jobs-assignedto-filter"
              value={assignedToFilter}
              onChange={setAssignedToFilter}
              placeholder="Select Assignee"
              options={uniqueAssignees}
              buttonClassName="h-11 rounded-lg border-gray-300 px-4 text-sm text-gray-900"
              menuClassName="rounded-lg"
            />
          </div>

          <div className="flex-1 min-w-50">
            <label
              htmlFor="jobs-status-filter"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Status
            </label>
            <Dropdown
              id="jobs-status-filter"
              value={statusFilter}
              onChange={setStatusFilter}
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
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="jobdata-start-date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
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
            <label className="mb-2 block text-sm font-medium text-gray-700">
              End Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="jobdata-end-date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
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
        <RecordsTable
          columns={columns}
          tableClassName="min-w-[700px] sm:min-w-[900px]"
          rows={filteredJobs}
          rowKey={(job) => job.id}
          empty={
            <div className="text-center text-sm text-slate-500">
              {jobs.length ? "No jobs match your filters." : "No jobs found."}
            </div>
          }
          footer={
            <p>
              Showing {filteredJobs.length} of {jobs.length} jobs
            </p>
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
