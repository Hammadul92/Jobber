import { useEffect, useState } from "react";
import { LuClock3, LuPlay, LuCircleCheck } from "react-icons/lu";
import { useCompleteJobMutation, useStartJobMutation } from "../../../store";
import useAlert from "../../../hooks/useAlert";

const formatHours = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const hours = Number(value);
  return `${hours.toFixed(2).replace(/\.00$/, "")} h`;
};

const elapsedHours = (startedAt) => {
  if (!startedAt) return "";
  const ms = Date.now() - new Date(startedAt).getTime();
  return ms > 0 ? (ms / 3_600_000).toFixed(2) : "0";
};

// Start / complete a job and show the hours it took, per team member.
export default function JobWorkPanel({ job, canWork }) {
  const setAlert = useAlert();
  const [startJob, { isLoading: starting }] = useStartJobMutation();
  const [completeJob, { isLoading: completing }] = useCompleteJobMutation();
  const [showComplete, setShowComplete] = useState(false);
  const [hours, setHours] = useState({});

  const members = job.assignee_details || [];
  const status = job.status;

  useEffect(() => {
    if (!showComplete) return;
    const elapsed = elapsedHours(job.started_at);
    setHours(
      Object.fromEntries(
        members.map((member) => [member.id, member.hours_worked ?? elapsed]),
      ),
    );
  }, [showComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = async () => {
    try {
      await startJob(job.id).unwrap();
      setAlert({ type: "success", message: "Job started. The clock is running." });
    } catch (err) {
      setAlert({ type: "danger", message: err?.data?.detail || "Could not start the job." });
    }
  };

  const handleComplete = async (event) => {
    event.preventDefault();
    const memberHours = Object.fromEntries(
      Object.entries(hours).filter(([, value]) => value !== "" && value !== null),
    );
    try {
      await completeJob({ id: job.id, memberHours }).unwrap();
      setShowComplete(false);
      setAlert({ type: "success", message: "Job completed and hours recorded." });
    } catch (err) {
      setAlert({
        type: "danger",
        message: err?.data?.member_hours || err?.data?.detail || "Could not complete the job.",
      });
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <LuClock3 className="h-5 w-5 text-slate-400" /> Work &amp; hours
        </h4>
        {job.hours_worked && (
          <span className="rounded-lg bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
            {formatHours(job.hours_worked)} on this job
            {members.length > 1 && job.person_hours
              ? ` · ${formatHours(job.person_hours)} total crew`
              : ""}
          </span>
        )}
      </div>

      <dl className="mb-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-slate-500">Started</dt>
          <dd className="font-medium text-slate-800">
            {job.started_at ? new Date(job.started_at).toLocaleString() : "Not started"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Completed</dt>
          <dd className="font-medium text-slate-800">
            {job.completed_at ? new Date(job.completed_at).toLocaleString() : "—"}
          </dd>
        </div>
      </dl>

      {members.length > 0 && (
        <ul className="mb-4 divide-y divide-gray-100 rounded-xl border border-gray-100">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="text-slate-700">{member.name}</span>
              <span className="font-semibold text-slate-900">{formatHours(member.hours_worked)}</span>
            </li>
          ))}
        </ul>
      )}

      {canWork && status !== "CANCELLED" && (
        <div className="flex flex-wrap justify-end gap-2">
          {status === "PENDING" && (
            <button
              type="button"
              onClick={handleStart}
              disabled={starting}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
            >
              <LuPlay className="h-4 w-4" /> {starting ? "Starting..." : "Start job"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowComplete(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accentLight"
          >
            <LuCircleCheck className="h-4 w-4" />
            {status === "COMPLETED" ? "Edit hours" : "Complete job"}
          </button>
        </div>
      )}

      {showComplete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4" role="presentation">
          <form
            onSubmit={handleComplete}
            role="dialog"
            aria-modal="true"
            aria-labelledby="complete-job-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 id="complete-job-title" className="text-xl font-semibold text-slate-900">
              {status === "COMPLETED" ? "Edit hours worked" : "Complete job"}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {job.started_at
                ? "Hours are filled in from when the job was started. Adjust anyone who worked less or more."
                : "This job was never started, so enter the hours each person worked."}
            </p>
            <div className="mt-4 space-y-3">
              {members.length ? (
                members.map((member) => (
                  <label key={member.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-700">{member.name}</span>
                    <span className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        step="0.25"
                        value={hours[member.id] ?? ""}
                        onChange={(event) =>
                          setHours((current) => ({ ...current, [member.id]: event.target.value }))
                        }
                        className="h-10 w-24 rounded-lg border border-gray-200 px-3 text-right text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        aria-label={`Hours worked by ${member.name}`}
                      />
                      <span className="text-slate-500">h</span>
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No team members are assigned, so no hours will be recorded.
                </p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowComplete(false)}
                disabled={completing}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={completing}
                className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accentLight disabled:opacity-60"
              >
                {completing ? "Saving..." : status === "COMPLETED" ? "Save hours" : "Complete job"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
