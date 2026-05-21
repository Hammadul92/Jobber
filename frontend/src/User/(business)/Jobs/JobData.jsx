import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useFetchJobsQuery, useDeleteJobMutation } from "../../../store";
import SubmitButton from "../../../Components/ui/SubmitButton";
import Dropdown from "../../../Components/ui/Dropdown";
import { MdOutlineHomeRepairService } from "react-icons/md";
import { LuCalendarDays, LuPencilLine } from "react-icons/lu";

export default function JobData({ token, role, setAlert }) {
  const [deleteJob, { isLoading: deleting }] = useDeleteJobMutation();
  const [showModal, setShowModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);

  // --- Filters ---
  const [serviceFilter, setServiceFilter] = useState("");
  const [assignedToFilter, setAssignedToFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [activeTab, setActiveTab] = useState("PENDING");

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
      const matchStart =
        !startDateFilter ||
        new Date(job.scheduled_date) >= new Date(startDateFilter);
      const matchEnd =
        !endDateFilter ||
        new Date(job.scheduled_date) <= new Date(endDateFilter);
      return matchService && matchAssigned && matchStart && matchEnd;
    });
  }, [jobs, serviceFilter, assignedToFilter, startDateFilter, endDateFilter]);

  const groupedJobs = useMemo(() => {
    const groups = {
      PENDING: [],
      IN_PROGRESS: [],
      COMPLETED: [],
      CANCELLED: [],
    };
    filteredJobs.forEach((job) => {
      if (groups[job.status]) groups[job.status].push(job);
      else groups.PENDING.push(job);
    });
    return groups;
  }, [filteredJobs]);

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

  // Helper function removed - no longer used

  const statusColumns = useMemo(
    () => [
      {
        key: "PENDING",
        label: "Pending",
        color: "bg-amber-50 text-amber-700",
      },
      {
        key: "IN_PROGRESS",
        label: "In Progress",
        color: "bg-blue-50 text-blue-700",
      },
      {
        key: "COMPLETED",
        label: "Completed",
        color: "bg-emerald-50 text-emerald-700",
      },
      {
        key: "CANCELLED",
        label: "Cancelled",
        color: "bg-rose-50 text-rose-700",
      },
    ],
    [],
  );

  if (isLoading)
    return (
      <div className="py-10 text-center text-sm text-gray-500">
        Loading jobs...
      </div>
    );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end gap-3 bg-white p-4 rounded-2xl border border-gray-200">
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
              className="date-input-no-icon w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-11 text-sm text-gray-900 placeholder-gray-500 transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
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
              className="date-input-no-icon w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-11 text-sm text-gray-900 placeholder-gray-500 transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
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

      {/* Tabs */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 w-full gap-2">
        {statusColumns.map(({ key, label, color }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex-1 rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${isActive
                  ? `${color} border border-current/35 shadow-sm`
                  : "border border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Job Cards Grid */}
      <div className="">
        <div className="grid gap-6 md:grid-cols-2">
          {groupedJobs[activeTab]?.length ? (
            groupedJobs[activeTab].map((job) => (
              <div
                key={job.id}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                {/* Top Section: Icon + Title/Subtitle */}
                <div className="mb-4 flex items-start gap-4">
                  {/* Left Icon */}
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-orange-100">
                    <svg
                      className="h-10 w-10 text-orange-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>

                  {/* Title and Subtitle */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-gray-900">
                      {job.assigned_to_name || "Unassigned"}
                    </h3>
                    <p className="text-lg -mt-1 -mb-2 text-gray-500">
                      {job.title}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="mb-4 border-t border-gray-100"></div>

                {/* Body */}
                <div className="flex flex-col md:flex-row md:items-end-safe md:justify-between gap-6">
                  {/* Info Rows */}
                  <div className="space-y-3 md:w-3/5">
                    {/* Service Row */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100">
                        <MdOutlineHomeRepairService className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Service</p>
                        <p className="font-medium text-gray-900">
                          {job.service_name}
                        </p>
                      </div>
                    </div>

                    {/* Scheduled Row */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100">
                        <LuCalendarDays className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Scheduled</p>
                        <p className="font-medium text-gray-900">
                          {new Date(job.scheduled_date).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "long", day: "numeric" },
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {role === "MANAGER" && (
                    <div className="flex items-end justify-end gap-3 md:w-2/5">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
                        onClick={() => handleDeleteClick(job.id)}
                        title="Delete Job"
                      >
                        Delete
                      </button>
                      <Link
                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-accent px-6 py-2 text-sm font-semibold text-white transition hover:bg-accentLight"
                        to={`/user/business/job/${job.id}`}
                        title="Edit Job"
                      >
                        <LuPencilLine className="h-4 w-4" />
                        Edit
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-full py-12 text-center text-sm font-semibold text-gray-400">
              No{" "}
              {statusColumns
                .find((s) => s.key === activeTab)
                ?.label.toLowerCase()}{" "}
              jobs
            </p>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-gray-900/40"
            onClick={() => setShowModal(false)}
          ></div>

          <form
            onSubmit={confirmDelete}
            className="relative z-10 w-2/7 max-w-md rounded-2xl bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between">
              <h5 className="text-lg font-semibold text-gray-900">
                Delete Job
              </h5>
              <button
                type="button"
                className="text-gray-400 transition hover:text-gray-600"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-sm text-gray-600">
              Are you sure you want to delete this job?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <SubmitButton
                isLoading={deleting}
                btnClass="bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"
                btnName="Delete"
              />
            </div>
          </form>
        </div>
      )}
    </>
  );
}
