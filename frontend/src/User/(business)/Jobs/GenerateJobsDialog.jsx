import { useEffect, useMemo, useState } from "react";
import { LuSearch, LuX, LuZap } from "react-icons/lu";
import {
  useFetchServicesQuery,
  useFetchTeamMembersQuery,
  useGenerateJobsMutation,
} from "../../../store";
import MemberPicker from "../../../Components/ui/MemberPicker";
import useAlert from "../../../hooks/useAlert";

// Stable fallback so effects keyed on the lists don't re-run every render.
const NONE = [];

// Local "YYYY-MM-DDTHH:mm" for a datetime-local input, rounded to the hour.
const nextHourLocal = () => {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:00`;
};

const searchableText = (service) =>
  [
    service.service_name,
    service.description,
    service.client_name,
    ...(Array.isArray(service.items) ? service.items.map((item) => `${item.title} ${item.description || ""}`) : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

// One click to draft jobs for every matching service, e.g. after a snowfall:
// type "snow", keep the matches ticked, pick when and who, and generate.
export default function GenerateJobsDialog({ token, open, onClose }) {
  const setAlert = useAlert();
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [scheduledDate, setScheduledDate] = useState(nextHourLocal);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignees, setAssignees] = useState([]);
  const [includePending, setIncludePending] = useState(false);

  const { data: services = NONE } = useFetchServicesQuery(undefined, { skip: !token || !open });
  const { data: teamMembers = NONE } = useFetchTeamMembersQuery(undefined, { skip: !token || !open });
  const [generateJobs, { isLoading }] = useGenerateJobsMutation();

  const activeMembers = useMemo(
    () => teamMembers.filter((member) => member.is_active === "True"),
    [teamMembers],
  );

  const matches = useMemo(() => {
    const terms = keyword.toLowerCase().split(/\s+/).filter(Boolean);
    return services.filter((service) => {
      const statusOk = service.status === "ACTIVE" || (includePending && service.status === "PENDING");
      if (!statusOk) return false;
      const text = searchableText(service);
      return terms.every((term) => text.includes(term));
    });
  }, [services, keyword, includePending]);

  // New search results start ticked; a fresh dialog starts with the whole team.
  useEffect(() => {
    setSelected(new Set(matches.map((service) => service.id)));
  }, [matches]);

  useEffect(() => {
    if (open) {
      setScheduledDate(nextHourLocal());
      setAssignees(activeMembers.map((member) => String(member.id)));
    }
  }, [open, activeMembers]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === "Escape" && !isLoading && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, isLoading, onClose]);

  if (!open) return null;

  const chosen = matches.filter((service) => selected.has(service.id));
  const toggle = (id) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!chosen.length) {
      setAlert({ type: "danger", message: "Tick at least one service to generate jobs for." });
      return;
    }
    try {
      const jobs = await generateJobs({
        service_ids: chosen.map((service) => service.id),
        // Wall-clock time; the server reads it in the business's timezone.
        scheduled_date: scheduledDate,
        title: title.trim(),
        description: description.trim(),
        assignee_ids: assignees.map(Number),
      }).unwrap();
      setAlert({
        type: "success",
        message: `${jobs.length} job${jobs.length === 1 ? "" : "s"} drafted as Pending. Open a job and press Start job when work begins.`,
      });
      setKeyword("");
      setTitle("");
      setDescription("");
      onClose();
    } catch (err) {
      const data = err?.data || {};
      setAlert({
        type: "danger",
        message: data.detail || data.service_ids || data.scheduled_date || "Could not generate jobs.",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/45" onClick={() => !isLoading && onClose()} role="presentation" />
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="generate-jobs-title"
        className="absolute right-0 top-0 flex h-dvh w-full flex-col overflow-hidden bg-white shadow-2xl"
        style={{ maxWidth: "620px" }}
      >
        <div className="shrink-0 border-b border-gray-200 px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h5 id="generate-jobs-title" className="flex items-center gap-2 text-3xl font-semibold text-slate-900">
                <LuZap className="h-7 w-7 text-accent" /> Generate Jobs
              </h5>
              <p className="mt-1 text-sm text-slate-500">
                Draft a job for every matching service at once, such as all snow clearing after a storm.
              </p>
            </div>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close">
              <LuX className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div>
            <label htmlFor="generate-keyword" className="mb-1 block text-sm font-medium text-slate-700">
              Which services? <span className="font-normal text-slate-500">(matches name, items, description, client)</span>
            </label>
            <div className="relative">
              <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="generate-keyword"
                type="search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="e.g. snow"
                className="h-11 w-full rounded-xl border border-gray-200 pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                autoFocus
              />
            </div>
            <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#ff6a00]"
                checked={includePending}
                onChange={(event) => setIncludePending(event.target.checked)}
              />
              Include services that are still Pending
            </label>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">
                {chosen.length} of {matches.length} service{matches.length === 1 ? "" : "s"} selected
              </span>
              {matches.length > 0 && (
                <button
                  type="button"
                  className="text-xs font-semibold text-accent hover:underline"
                  onClick={() =>
                    setSelected(chosen.length === matches.length ? new Set() : new Set(matches.map((s) => s.id)))
                  }
                >
                  {chosen.length === matches.length ? "Clear all" : "Select all"}
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200">
              {matches.length ? (
                matches.map((service) => (
                  <label
                    key={service.id}
                    className="flex cursor-pointer items-start gap-3 border-b border-gray-100 px-3 py-2 text-sm last:border-b-0 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 accent-[#ff6a00]"
                      checked={selected.has(service.id)}
                      onChange={() => toggle(service.id)}
                    />
                    <span>
                      <span className="font-medium text-slate-900">{service.service_name}</span>
                      <span className="block text-slate-500">
                        {service.client_name}
                        {service.street_address ? ` · ${service.street_address}, ${service.city}` : ""}
                      </span>
                    </span>
                  </label>
                ))
              ) : (
                <p className="px-3 py-6 text-center text-sm text-slate-500">
                  {keyword ? `No active services match “${keyword}”.` : "No active services yet."}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="generate-when" className="mb-1 block text-sm font-medium text-slate-700">
                Scheduled for
              </label>
              <input
                id="generate-when"
                type="datetime-local"
                required
                value={scheduledDate}
                onChange={(event) => setScheduledDate(event.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div>
              <label htmlFor="generate-title" className="mb-1 block text-sm font-medium text-slate-700">
                Job title <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <input
                id="generate-title"
                type="text"
                maxLength={60}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Snow storm"
                className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
          </div>
          <p className="-mt-3 text-xs text-slate-500">
            Titles are made automatically, e.g. “{title.trim() || chosen[0]?.service_name || "Snow removal"} –{" "}
            {chosen[0]?.client_name || "Client"} – {new Date(scheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}”.
          </p>

          <MemberPicker
            id="generate-assignees"
            label="Assign to"
            members={activeMembers}
            value={assignees}
            onChange={setAssignees}
          />

          <div>
            <label htmlFor="generate-notes" className="mb-1 block text-sm font-medium text-slate-700">
              Notes for the crew <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <textarea
              id="generate-notes"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="e.g. Clear driveways and walkways, salt steps."
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !chosen.length}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accentLight disabled:opacity-60"
          >
            <LuZap className="h-4 w-4" />
            {isLoading ? "Generating..." : `Generate ${chosen.length || ""} job${chosen.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </form>
    </div>
  );
}
