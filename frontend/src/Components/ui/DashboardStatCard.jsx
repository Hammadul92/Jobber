import { LuArrowDownRight, LuArrowUpRight } from "react-icons/lu";
export default function DashboardStatCard({ icon, title, value, change }) {
  const IconComponent = icon;
  const trendTone =
    change?.tone === "positive"
      ? "text-emerald-600"
      : change?.tone === "negative"
        ? "text-rose-600"
        : "text-slate-500";
  const TrendIcon =
    change?.tone === "negative" ? LuArrowDownRight : LuArrowUpRight;

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 text-accent">
          <IconComponent className="w-5 h-5" />
        </div>
        {change && (
          <TrendIcon
            className={`h-5 w-5 ${change.tone === "negative" ? "text-rose-500" : "text-emerald-500"}`}
          />
        )}
      </div>

      <div className="mt-3">
        <p className="text-3xl font-medium tracking-tight text-slate-900">
          {value}
        </p>
        <p className="mt-1 text-slate-500">{title}</p>
        {change && (
          <p className={`mt-1 text-sm font-medium ${trendTone}`}>
            {change.value} {change.label}
          </p>
        )}
      </div>
    </div>
  );
}
