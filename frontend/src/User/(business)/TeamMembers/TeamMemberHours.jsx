import { useState } from "react";
import { LuClock3 } from "react-icons/lu";
import { useFetchTeamMemberHoursQuery } from "../../../store";

const VIEWS = [
  { key: "daily", label: "Daily", hint: "Last 30 days" },
  { key: "monthly", label: "Monthly", hint: "Last 12 months" },
  { key: "yearly", label: "Yearly", hint: "All years" },
];

const fmt = (value) => {
  const hours = Number(value || 0);
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(2).replace(/0$/, "");
};

const labelFor = (view, row) => {
  if (view === "daily") {
    const [y, m, d] = row.date.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (view === "monthly") {
    const [y, m] = row.month.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }
  return String(row.year);
};

function StatTile({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">
        {fmt(value)} <span className="text-sm font-medium text-slate-500">h</span>
      </p>
    </div>
  );
}

// Hours a team member logged on completed jobs, by day, month and year.
export default function TeamMemberHours({ token, memberId }) {
  const [view, setView] = useState("daily");
  const [showTable, setShowTable] = useState(false);
  const [hover, setHover] = useState(null);
  const { data, isLoading, error } = useFetchTeamMemberHoursQuery(memberId, {
    skip: !token || !memberId,
  });

  const rows = data?.[view] || [];
  const max = Math.max(0, ...rows.map((row) => Number(row.hours)));
  const scaleMax = max > 0 ? Math.ceil(max) : 1;
  const current = VIEWS.find((item) => item.key === view);

  return (
    <section className="space-y-4 rounded-2xl bg-white p-4 shadow-md md:p-10" aria-labelledby="member-hours-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="member-hours-title" className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <LuClock3 className="h-5 w-5 text-slate-400" /> Hours worked
        </h2>
        <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1" role="tablist">
          {VIEWS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={view === item.key}
              onClick={() => setView(item.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                view === item.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-rose-600">Could not load hours.</p>
      ) : isLoading ? (
        <p className="text-sm text-slate-500">Loading hours...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="Today" value={data?.today} />
            <StatTile label="This month" value={data?.this_month} />
            <StatTile label="This year" value={data?.this_year} />
            <StatTile label="All time" value={data?.total} />
          </div>

          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              {current.hint} · hours from completed jobs, counted on the day each job was completed
            </span>
            <button
              type="button"
              className="font-semibold text-accent hover:underline"
              onClick={() => setShowTable((value) => !value)}
            >
              {showTable ? "Show chart" : "Show table"}
            </button>
          </div>

          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No hours logged yet.</p>
          ) : showTable ? (
            <div className="max-h-80 overflow-y-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2">{current.label === "Daily" ? "Day" : current.label === "Monthly" ? "Month" : "Year"}</th>
                    <th className="px-4 py-2 text-right">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...rows].reverse().map((row) => (
                    <tr key={row.date || row.month || row.year}>
                      <td className="px-4 py-2 text-slate-700">{labelFor(view, row)}</td>
                      <td className="px-4 py-2 text-right font-medium text-slate-900">{fmt(row.hours)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <figure className="relative" aria-label={`Hours worked, ${current.hint.toLowerCase()}`}>
              <div className="flex">
                <div className="flex h-48 w-8 shrink-0 flex-col justify-between pr-2 text-right text-xs text-slate-400">
                  <span>{scaleMax}</span>
                  <span>{fmt(scaleMax / 2)}</span>
                  <span>0</span>
                </div>
                <div className="relative h-48 flex-1 border-b border-slate-200">
                  <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-slate-100" />
                  <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-slate-100" />
                  <div className="absolute inset-0 flex items-end gap-[2px]">
                    {rows.map((row, index) => {
                      const hours = Number(row.hours);
                      const label = labelFor(view, row);
                      return (
                        <button
                          key={row.date || row.month || row.year}
                          type="button"
                          className="group relative flex h-full flex-1 items-end focus:outline-none"
                          onMouseEnter={() => setHover(index)}
                          onMouseLeave={() => setHover(null)}
                          onFocus={() => setHover(index)}
                          onBlur={() => setHover(null)}
                          aria-label={`${label}: ${fmt(hours)} hours`}
                        >
                          <span
                            className={`block w-full rounded-t-[4px] transition-colors ${
                              hover === index ? "bg-accentLight" : "bg-accent"
                            }`}
                            style={{ height: hours > 0 ? `${Math.max((hours / scaleMax) * 100, 1.5)}%` : 0 }}
                          />
                          {hover === index && (
                            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg">
                              <span className="block text-slate-300">{label}</span>
                              <span className="font-semibold">{fmt(hours)} h</span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <figcaption className="mt-1 flex justify-between pl-8 text-xs text-slate-400">
                <span>{labelFor(view, rows[0])}</span>
                <span>{labelFor(view, rows[rows.length - 1])}</span>
              </figcaption>
            </figure>
          )}
        </>
      )}
    </section>
  );
}
