import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  LuArrowDownRight,
  LuArrowUpRight,
  LuBriefcase,
  LuCalendarDays,
  LuClock3,
  LuClipboardList,
  LuDollarSign,
  LuFileText,
  LuInfo,
  LuReceipt,
  LuUsers,
} from "react-icons/lu";
import {
  useFetchClientsQuery,
  useFetchInvoicesQuery,
  useFetchJobsQuery,
  useFetchQuotesQuery,
  useFetchServiceQuestionnairesQuery,
  useFetchServicesQuery,
  useFetchTeamMembersQuery,
} from "../../../store";
import { formatDate } from "../../../utils/formatDate";
import {
  buildRevenueSeries,
  isPaidInvoice,
  parseInvoiceAmount,
} from "./dashboardMetrics";

const CHART_RANGES = ["Monthly", "Weekly", "Yearly"];

const quoteStatusTone = {
  SENT: "bg-blue-100 text-blue-700",
  SIGNED: "bg-emerald-100 text-emerald-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  DRAFT: "bg-slate-100 text-slate-600",
  DECLINED: "bg-rose-100 text-rose-700",
};

const invoiceStatusTone = {
  PAID: "bg-emerald-100 text-emerald-700",
  SENT: "bg-blue-100 text-blue-700",
  DRAFT: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-rose-100 text-rose-700",
  OVERDUE: "bg-amber-100 text-amber-700",
};

const jobStatusTone = {
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  PENDING: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-rose-100 text-rose-700",
};

const progressTone = {
  IN_PROGRESS: "bg-blue-600",
  PENDING: "bg-orange-500",
  COMPLETED: "bg-green-600",
  CANCELLED: "bg-red-500",
};

const currencyFallback = "USD";

function parseApiDate(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split("-").map(Number);
      return new Date(year, month - 1, day);
    }

    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
      return new Date(value.replace(" ", "T"));
    }
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfWeek(date) {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

function addMonths(date, count) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function addWeeks(date, count) {
  const next = new Date(date);
  next.setDate(next.getDate() + count * 7);
  return next;
}

function isSameMonth(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  );
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatCurrency(value, currency = "USD", compact = false) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
  });

  return formatter.format(Number(value || 0));
}

function formatMoneyFromRecord(record, amountKey = "total_amount") {
  return formatCurrency(record?.[amountKey], record?.currency || currencyFallback);
}

function getQuoteAmount(quote) {
  return formatCurrency(
    quote?.service_data?.price || 0,
    quote?.service_data?.currency || currencyFallback,
  );
}

function getQuoteStatusPresentation(status) {
  if (status === "SIGNED") {
    return {
      label: "Approved",
      toneMap: { Approved: "bg-emerald-100 text-emerald-700" },
    };
  }

  return {
    label: status || "Unknown",
    toneMap: quoteStatusTone,
  };
}

function getInvoiceStatusPresentation(status) {
  return {
    label: status || "Unknown",
    toneMap: invoiceStatusTone,
  };
}

function getJobStatusPresentation(status) {
  if (status === "PENDING") {
    return {
      label: "Scheduled",
      toneMap: { Scheduled: "bg-amber-100 text-amber-700" },
    };
  }

  const label = status ? status.replaceAll("_", " ") : "Unknown";
  return {
    label,
    toneMap: { [label]: jobStatusTone[status] || "bg-slate-100 text-slate-600" },
  };
}

function getChangeMeta(currentValue, previousValue) {
  if (!previousValue && !currentValue) {
    return {
      value: "0%",
      label: "from last month",
      tone: "neutral",
    };
  }

  if (!previousValue) {
    return {
      value: "+100%",
      label: "from last month",
      tone: "positive",
    };
  }

  const delta = ((currentValue - previousValue) / previousValue) * 100;
  const rounded = Math.round(delta);

  if (rounded === 0) {
    return {
      value: "0%",
      label: "from last month",
      tone: "neutral",
    };
  }

  return {
    value: `${rounded > 0 ? "+" : ""}${rounded}%`,
    label: "from last month",
    tone: rounded > 0 ? "positive" : "negative",
  };
}

function StatusBadge({ label, toneMap }) {
  const className = toneMap[label] || "bg-slate-100 text-slate-600";

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

function StatsCard({ icon, title, value, change }) {
  const IconComponent = icon;
  const trendTone =
    change.tone === "positive"
      ? "text-emerald-600"
      : change.tone === "negative"
        ? "text-rose-600"
        : "text-slate-500";
  const TrendIcon =
    change.tone === "negative" ? LuArrowDownRight : LuArrowUpRight;

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 text-accent">
          <IconComponent className="w-5 h-5" />
        </div>
        <TrendIcon
          className={`h-5 w-5 ${change.tone === "negative" ? "text-rose-500" : "text-emerald-500"}`}
        />
      </div>

      <div className="mt-3">
        <p className="text-3xl font-medium tracking-tight text-slate-900">
          {value}
        </p>
        <p className="mt-1 text-slate-500">{title}</p>
        <p className={`mt-1 text-sm font-medium ${trendTone}`}>
          {change.value} {change.label}
        </p>
      </div>
    </div>
  );
}

function RevenueChart({ chartData, maxChartValue }) {
  const width = 900;
  const height = 300;
  const left = 46;
  const right = 16;
  const top = 14;
  const bottom = 246;
  const labelY = 280;
  const chartWidth = width - left - right;
  const chartHeight = bottom - top;
  const safeMax = Math.max(maxChartValue, 1);
  const slotWidth = chartWidth / Math.max(chartData.length, 1);
  const yForValue = (value) =>
    bottom - (Number(value || 0) / safeMax) * chartHeight;
  const billedPoints = chartData.map((item, index) => {
    const x = left + slotWidth * index + slotWidth / 2;
    const y = yForValue(item.revenue);
    return { x, y, ...item };
  });
  const collectedPoints = chartData.map((item, index) => {
    const x = left + slotWidth * index + slotWidth / 2;
    const y = yForValue(item.collected);
    return { x, y, ...item };
  });
  const billedPath = buildSmoothPath(billedPoints);
  const collectedPath = buildSmoothPath(collectedPoints);
  const gridLines = Array.from({ length: 5 }, (_, index) => {
    const y = top + (chartHeight / 4) * index;
    return y;
  });

  return (
    <div className="h-[300px] w-full overflow-hidden">
      <svg
        className="h-full w-full"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Revenue overview chart"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="revenue-line-glow" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="0 0 0 0 0.12 0 0 0 0 0.32 0 0 0 0 0.9 0 0 0 0.22 0"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={width} height={height} fill="#ffffff" />

        {gridLines.map((y) => (
          <line
            key={y}
            className="revenue-chart-grid"
            x1={left}
            x2={width - right}
            y1={y}
            y2={y}
            stroke="#e2e8f0"
            strokeDasharray="5 7"
            strokeWidth="1"
          />
        ))}

        {chartData.map((item, index) => (
          <text
            key={item.label}
            className="revenue-chart-label"
            x={left + slotWidth * index + slotWidth / 2}
            y={labelY}
            textAnchor="middle"
            fill="#64748b"
            fontSize="14"
            fontWeight="500"
          >
            {item.label}
          </text>
        ))}

        <path
          className="revenue-chart-line revenue-chart-line-billed"
          d={billedPath}
          fill="none"
          stroke="#ff8a1f"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
          filter="url(#revenue-line-glow)"
        />

        <path
          className="revenue-chart-line revenue-chart-line-collected"
          d={collectedPath}
          fill="none"
          stroke="#2563eb"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
          filter="url(#revenue-line-glow)"
        />

        {billedPoints.map((point, index) =>
          Number(point.revenue || 0) > 0 ? (
            <circle
              key={`${point.label}-billed`}
              className="revenue-chart-dot"
              cx={point.x}
              cy={point.y}
              r="5"
              fill="#ff8a1f"
              stroke="#ffffff"
              strokeWidth="3"
              style={{ "--dot-delay": `${0.55 + index * 0.04}s` }}
            >
              <title>
                {`${point.label} billed: ${formatCurrency(point.revenue, "USD")}`}
              </title>
            </circle>
          ) : null,
        )}

        {collectedPoints.map((point, index) =>
          Number(point.collected || 0) > 0 ? (
            <circle
              key={`${point.label}-collected`}
              className="revenue-chart-dot"
              cx={point.x}
              cy={point.y}
              r="5"
              fill="#2563eb"
              stroke="#ffffff"
              strokeWidth="3"
              style={{ "--dot-delay": `${0.75 + index * 0.04}s` }}
            >
              <title>
                {`${point.label} collected: ${formatCurrency(point.collected, "USD")}`}
              </title>
            </circle>
          ) : null,
        )}
      </svg>
    </div>
  );
}

function buildSmoothPath(points) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;

    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

function RevenueOverview({ chartData, chartRange, setChartRange }) {
  const hasChartData = chartData.some(
    (item) => Number(item.revenue || 0) > 0 || Number(item.collected || 0) > 0,
  );
  const maxChartValue = Math.max(
    ...chartData.map((item) =>
      Math.max(Number(item.revenue || 0), Number(item.collected || 0)),
    ),
    0,
  );
  const yAxisMax = maxChartValue > 0 ? Math.ceil(maxChartValue * 1.2) : 100;
  const billedTotal = chartData.reduce(
    (sum, item) => sum + Number(item.revenue || 0),
    0,
  );
  const collectedTotal = chartData.reduce(
    (sum, item) => sum + Number(item.collected || 0),
    0,
  );

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h3 className="text-2xl font-medium tracking-tight text-slate-900">
          Revenue Overview
        </h3>

        <div className="inline-flex p-1 w-fit rounded-2xl bg-slate-50">
          {CHART_RANGES.map((range) => {
            const active = chartRange === range;
            return (
              <button
                key={range}
                type="button"
                onClick={() => setChartRange(range)}
                className={`rounded-xl px-3.5 py-1.5 text-sm font-medium transition ${active
                  ? "bg-orange-100 text-accent"
                  : "text-slate-500 hover:text-slate-900"
                  }`}
              >
                {range}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 h-[360px]">
        {hasChartData ? (
          <>
            <RevenueChart
              chartData={chartData}
              maxChartValue={yAxisMax}
            />
            <div className="mt-4 flex flex-wrap items-center justify-end gap-4 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <span className="h-1 w-5 rounded-full bg-orange-400" />
                Billed
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-1 w-5 rounded-full bg-blue-600" />
                Collected
              </span>
              <span>
                Billed:{" "}
                <strong className="font-semibold text-slate-900">
                  {formatCurrency(billedTotal, "USD")}
                </strong>
              </span>
              <span>
                Collected:{" "}
                <strong className="font-semibold text-slate-900">
                  {formatCurrency(collectedTotal, "USD")}
                </strong>
              </span>
            </div>
          </>
        ) : (
          <EmptyState message="No revenue data available yet." />
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex items-center justify-center px-6 text-base text-center border border-gray-200 border-dashed min-h-48 rounded-2xl bg-slate-50 text-slate-500">
      {message}
    </div>
  );
}

function RecentRecords({ recentQuotes, recentInvoices, activeTab, setActiveTab }) {
  const rows = activeTab === "quotes" ? recentQuotes : recentInvoices;

  return (
    <div className="rounded-3xl border border-gray-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="px-6 pt-5 border-b border-gray-200">
        <div className="flex flex-wrap gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("quotes")}
            className={`border-b-2 pb-3 text-base font-medium transition ${activeTab === "quotes"
              ? "border-accent text-accent"
              : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
          >
            Recent Quotes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("invoices")}
            className={`border-b-2 pb-3 text-base font-medium transition ${activeTab === "invoices"
              ? "border-accent text-accent"
              : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
          >
            Recent Invoices
          </button>
        </div>
      </div>

      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-[0.05em] text-slate-500">
                <th className="px-6 py-3 font-semibold">ID</th>
                <th className="px-2 py-3 font-semibold">Client</th>
                <th className="px-2 py-3 font-semibold">Service</th>
                <th className="px-2 py-3 font-semibold">Amount</th>
                <th className="px-2 py-3 font-semibold">Status</th>
                <th className="px-2 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isQuote = activeTab === "quotes";
                const statusPresentation = isQuote
                  ? getQuoteStatusPresentation(row.status)
                  : getInvoiceStatusPresentation(row.status);
                const amount = isQuote ? getQuoteAmount(row) : formatMoneyFromRecord(row);

                return (
                  <tr key={`${activeTab}-${row.id}`} className="text-sm border-t border-gray-100 text-slate-700">
                    <td className="px-6 fon4t-medium py- text-accent">
                      {isQuote ? row.quote_number : row.invoice_number}
                    </td>
                    <td className="px-2 py-4">{row.client_name}</td>
                    <td className="px-2 py-4">{row.service_name || row.service_data?.service_name || "-"}</td>
                    <td className="px-2 py-4">{amount}</td>
                    <td className="px-2 py-4">
                      <StatusBadge
                        label={statusPresentation.label}
                        toneMap={statusPresentation.toneMap}
                      />
                    </td>
                    <td className="px-4 py-5 text-slate-500">
                      {formatDate(isQuote ? row.created_at : row.due_date, false)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6">
          <EmptyState
            message={
              activeTab === "quotes"
                ? "No recent quotes to display yet."
                : "No recent invoices to display yet."
            }
          />
        </div>
      )}
    </div>
  );
}

function UpcomingJobs({ jobs }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-2xl font-medium tracking-tight text-slate-900">
          Upcoming Jobs
        </h3>
        <Link
          to="/user/business/jobs"
          className="inline-flex items-center gap-1 font-medium transition text-accent hover:text-accentLight"
        >
          View All <LuArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="mt-6 space-y-5">
        {jobs.length ? (
          jobs.map((job) => (
            <Link
              key={job.id}
              to={`/user/business/job/${job.id}`}
              className="block px-3 py-3 transition border border-gray-200 rounded-3xl bg-slate-50 hover:border-accent/40 hover:bg-white"
            >
              <div className="flex items-start min-w-0 gap-4">
                <div className="inline-flex items-center justify-center w-12 h-12 shrink-0 rounded-2xl bg-orange-50 text-accent">
                  <LuBriefcase className="w-7 h-7" />
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h4 className="text-xl font-medium text-slate-900">
                      {job.title || job.service_name || "Untitled Job"}
                    </h4>
                    <p className="text-base text-slate-500">
                      {job.service_name} • {job.assigned_to_name || "Unassigned"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-end justify-between gap-4">
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                  <LuClock3 className="w-4 h-4" />
                  <span>{formatDate(job.scheduled_date)}</span>
                </div>
                <StatusBadge {...getJobStatusPresentation(job.status)} />
              </div>
            </Link>
          ))
        ) : (
          <EmptyState message="No upcoming jobs scheduled yet." />
        )}
      </div>
    </div>
  );
}

function JobsStatusCard({ stats }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <h3 className="text-2xl font-medium tracking-tight text-slate-900">
        Jobs Status
      </h3>

      <div className="mt-6 space-y-4">
        {stats.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <span className="text-slate-700">{item.label}</span>
              <span className="font-medium text-slate-900">{item.value}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200">
              <div
                className={`h-2 rounded-full ${item.barClass}`}
                style={{ width: `${item.width}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestionnaireCard({
  newSubmissions,
  pendingReview,
  completedReviews,
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="flex items-center gap-2">
        <h3 className="text-2xl font-medium tracking-tight text-slate-900">
          Questionnaires
        </h3>
        <div className="group relative inline-flex">
          <button
            type="button"
            aria-label="Questionnaire stats information"
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-accent hover:text-accent focus:border-accent focus:text-accent focus:outline-none"
          >
            <LuInfo className="h-4 w-4" />
          </button>
          <div className="pointer-events-none absolute left-1/2 top-8 z-20 min-w-72 -translate-x-1/2 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-slate-600 opacity-0 shadow-[0_16px_40px_rgba(15,23,42,0.14)] transition group-hover:opacity-100 group-focus-within:opacity-100">
            <p>
              <strong className="text-slate-900">New:</strong> recently submitted
              client answers.
            </p>
            <p className="mt-2">
              <strong className="text-slate-900">Pending:</strong> submitted
              answers waiting for review.
            </p>
            <p className="mt-2">
              <strong className="text-slate-900">Done:</strong> submitted answers
              for active or completed services.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex items-end justify-between gap-1 px-3 py-2 rounded-2xl bg-blue-50">
          <div>
            <p className="text-sm text-slate-700">New</p>
            <span className="text-2xl font-medium text-blue-700">
              {newSubmissions}
            </span>
          </div>
          <LuClipboardList className="text-blue-400 h-9 w-9" />
        </div>

        <div className="flex items-end justify-between gap-1 px-4 py-2 rounded-2xl bg-amber-50">
          <div>
            <p className="text-sm text-slate-700">Pending</p>
            <span className="text-2xl font-medium text-amber-600">
              {pendingReview}
            </span>
          </div>
          <LuClock3 className="h-9 w-9 text-amber-400" />
        </div>

        <div className="flex items-end justify-between gap-1 px-4 py-3 rounded-2xl bg-emerald-50">
          <div>
            <p className="text-sm text-slate-700">Done</p>
            <span className="text-2xl font-medium text-emerald-600">
              {completedReviews}
            </span>
          </div>
          <LuClipboardList className="h-9 w-9 text-emerald-400" />
        </div>
      </div>

      <Link
        to="/user/business/service-questionnaires"
        className="inline-flex items-center justify-center w-full px-4 py-2.5 mt-5 text-sm font-medium transition border rounded-xl border-accent text-accent hover:bg-orange-50"
      >
        View Questionnaires
      </Link>
    </div>
  );
}

export default function DashboardHome({ token, onRecentActivityChange }) {
  const [chartRange, setChartRange] = useState("Monthly");
  const [recordsTab, setRecordsTab] = useState("quotes");

  const { data: clientData, isLoading: loadingClients } = useFetchClientsQuery(
    undefined,
    { skip: !token },
  );
  const { data: teamMembersData, isLoading: loadingTeamMembers } =
    useFetchTeamMembersQuery(undefined, { skip: !token });
  const { data: quoteData, isLoading: loadingQuotes } = useFetchQuotesQuery(
    undefined,
    { skip: !token },
  );
  const { data: jobsData, isLoading: loadingJobs } = useFetchJobsQuery(
    undefined,
    { skip: !token },
  );
  const { data: invoiceData, isLoading: loadingInvoices } =
    useFetchInvoicesQuery({ page_size: 100 }, { skip: !token });
  const { data: questionnaireData, isLoading: loadingQuestionnaires } =
    useFetchServiceQuestionnairesQuery(undefined, { skip: !token });
  const { data: servicesData, isLoading: loadingServices } =
    useFetchServicesQuery(undefined, { skip: !token });

  const clients = useMemo(() => clientData?.results || [], [clientData]);
  const clientsCount = clientData?.count ?? clients.length;
  const teamMembers = useMemo(() => teamMembersData || [], [teamMembersData]);
  const quotes = useMemo(() => quoteData || [], [quoteData]);
  const jobs = useMemo(() => jobsData || [], [jobsData]);
  const invoices = useMemo(
    () => (Array.isArray(invoiceData) ? invoiceData : invoiceData?.results || []),
    [invoiceData],
  );
  const questionnaires = useMemo(
    () => questionnaireData || [],
    [questionnaireData],
  );
  const services = useMemo(() => servicesData || [], [servicesData]);

  const dashboardData = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const previousMonthStart = addMonths(currentMonthStart, -1);
    const currentWeekStart = startOfWeek(now);
    const previousWeekStart = addWeeks(currentWeekStart, -1);

    const openQuotes = quotes.filter((quote) =>
      ["DRAFT", "SENT"].includes(quote.status),
    );
    const activeJobs = jobs.filter((job) => job.status === "IN_PROGRESS");
    const unpaidInvoices = invoices.filter(
      (invoice) => !["PAID", "CANCELLED"].includes(invoice.status),
    );

    const paidInvoices = invoices.filter(isPaidInvoice);
    const currentMonthRevenue = paidInvoices
      .filter((invoice) => {
        const paidDate = parseApiDate(invoice.paid_at || invoice.updated_at);
        return paidDate ? isSameMonth(paidDate, now) : false;
      })
      .reduce((sum, invoice) => sum + parseInvoiceAmount(invoice), 0);

    const previousMonthRevenue = paidInvoices
      .filter((invoice) => {
        const paidDate = parseApiDate(invoice.paid_at || invoice.updated_at);
        return paidDate ? isSameMonth(paidDate, previousMonthStart) : false;
      })
      .reduce((sum, invoice) => sum + parseInvoiceAmount(invoice), 0);

    const servicesWithResponses = services.filter(
      (service) =>
        service.filled_questionnaire &&
        Object.keys(service.filled_questionnaire).length > 0,
    );

    const newSubmissions = servicesWithResponses.filter((service) => {
      const updatedAt = parseApiDate(service.updated_at);
      return updatedAt ? updatedAt >= previousWeekStart : false;
    }).length;

    const pendingReview = servicesWithResponses.filter(
      (service) => service.status === "PENDING",
    ).length;

    const completedReviews = servicesWithResponses.filter((service) =>
      ["ACTIVE", "COMPLETED"].includes(service.status),
    ).length;

    const jobsStatusCounts = [
      {
        key: "IN_PROGRESS",
        label: "In Progress",
      },
      {
        key: "PENDING",
        label: "Scheduled",
      },
      {
        key: "COMPLETED",
        label: "Completed",
      },
      {
        key: "CANCELLED",
        label: "Cancelled",
      },
    ].map((item) => ({
      ...item,
      value: jobs.filter((job) => job.status === item.key).length,
    }));

    const maxStatusCount = Math.max(
      ...jobsStatusCounts.map((item) => item.value),
      1,
    );

    const jobsStatusStats = jobsStatusCounts.map((item) => ({
      ...item,
      width: Math.max((item.value / maxStatusCount) * 100, item.value ? 8 : 0),
      barClass: progressTone[item.key] || "bg-slate-400",
    }));

    const upcomingJobs = [...jobs]
      .filter((job) => !["COMPLETED", "CANCELLED"].includes(job.status))
      .sort((left, right) => {
        const leftDate = parseApiDate(left.scheduled_date)?.getTime() || 0;
        const rightDate = parseApiDate(right.scheduled_date)?.getTime() || 0;
        return leftDate - rightDate;
      })
      .slice(0, 3);

    const recentQuotes = [...quotes]
      .sort((left, right) => {
        const leftDate = parseApiDate(left.updated_at || left.created_at)?.getTime() || 0;
        const rightDate =
          parseApiDate(right.updated_at || right.created_at)?.getTime() || 0;
        return rightDate - leftDate;
      })
      .slice(0, 6);

    const recentInvoices = [...invoices]
      .sort((left, right) => {
        const leftDate = parseApiDate(left.updated_at || left.created_at)?.getTime() || 0;
        const rightDate =
          parseApiDate(right.updated_at || right.created_at)?.getTime() || 0;
        return rightDate - leftDate;
      })
      .slice(0, 6);

    const recentActivity = [
      ...[...clients]
        .sort((left, right) => {
          const leftDate =
            parseApiDate(left.updated_at || left.created_at)?.getTime() || 0;
          const rightDate =
            parseApiDate(right.updated_at || right.created_at)?.getTime() || 0;
          return rightDate - leftDate;
        })
        .map((client) => ({
          id: `client-${client.id}`,
          title: "New client added",
          description: `${client.client_name} registered`,
          date: parseApiDate(client.created_at),
        })),
      ...quotes
        .filter((quote) => ["SIGNED", "SENT"].includes(quote.status))
        .map((quote) => ({
          id: `quote-${quote.id}`,
          title:
            quote.status === "SIGNED" ? "Quote approved" : "Quote sent",
          description: `${quote.quote_number} for ${quote.client_name}`,
          date: parseApiDate(quote.updated_at || quote.created_at),
        })),
      ...invoices
        .filter((invoice) => ["PAID", "SENT"].includes(invoice.status))
        .map((invoice) => ({
          id: `invoice-${invoice.id}`,
          title:
            isPaidInvoice(invoice) ? "Invoice paid" : "Invoice sent",
          description: `${invoice.invoice_number} for ${invoice.client_name}`,
          date: parseApiDate(invoice.paid_at || invoice.updated_at),
        })),
    ]
      .filter((item) => item.date)
      .sort((left, right) => right.date - left.date)
      .map((item) => ({
        ...item,
        time: formatRelativeTime(item.date, now),
      }));

    const chartData = buildRevenueSeries({
      invoices,
      range: chartRange,
      now,
    });

    return {
      statsCards: [
        {
          title: "Total Clients",
          icon: LuUsers,
          value: loadingClients ? "..." : formatCompactNumber(clientsCount),
          change: getChangeMeta(
            countRecordsInRange(clients, "created_at", currentMonthStart, now),
            countRecordsInRange(
              clients,
              "created_at",
              previousMonthStart,
              currentMonthStart,
            ),
          ),
        },
        {
          title: "Active Jobs",
          icon: LuBriefcase,
          value: loadingJobs ? "..." : formatCompactNumber(activeJobs.length),
          change: getChangeMeta(
            countRecordsByStatusInRange(
              jobs,
              "IN_PROGRESS",
              "scheduled_date",
              currentMonthStart,
              now,
            ),
            countRecordsByStatusInRange(
              jobs,
              "IN_PROGRESS",
              "scheduled_date",
              previousMonthStart,
              currentMonthStart,
            ),
          ),
        },
        {
          title: "Pending Quotes",
          icon: LuFileText,
          value: loadingQuotes ? "..." : formatCompactNumber(openQuotes.length),
          change: getChangeMeta(
            countStatusesInRange(
              quotes,
              ["DRAFT", "SENT"],
              "created_at",
              currentMonthStart,
              now,
            ),
            countStatusesInRange(
              quotes,
              ["DRAFT", "SENT"],
              "created_at",
              previousMonthStart,
              currentMonthStart,
            ),
          ),
        },
        {
          title: "Unpaid Invoices",
          icon: LuReceipt,
          value: loadingInvoices
            ? "..."
            : formatCompactNumber(unpaidInvoices.length),
          change: getChangeMeta(
            countStatusesInRange(
              invoices,
              ["DRAFT", "SENT"],
              "due_date",
              currentMonthStart,
              now,
            ),
            countStatusesInRange(
              invoices,
              ["DRAFT", "SENT"],
              "due_date",
              previousMonthStart,
              currentMonthStart,
            ),
          ),
        },
        {
          title: "Team Members",
          icon: LuUsers,
          value: loadingTeamMembers
            ? "..."
            : formatCompactNumber(teamMembers.length),
          change: getChangeMeta(
            countRecordsInRange(teamMembers, "joined_at", currentMonthStart, now),
            countRecordsInRange(
              teamMembers,
              "joined_at",
              previousMonthStart,
              currentMonthStart,
            ),
          ),
        },
        {
          title: "Monthly Revenue",
          icon: LuDollarSign,
          value: loadingInvoices
            ? "..."
            : formatCurrency(currentMonthRevenue, "USD", true),
          change: getChangeMeta(currentMonthRevenue, previousMonthRevenue),
        },
      ],
      chartData,
      recentQuotes,
      recentInvoices,
      upcomingJobs,
      jobsStatusStats,
      questionnairesCard: {
        templatesCount: questionnaires.length,
        newSubmissions,
        pendingReview,
        completedReviews,
      },
      recentActivity,
    };
  }, [
    chartRange,
    clients,
    clientsCount,
    invoices,
    jobs,
    loadingClients,
    loadingInvoices,
    loadingJobs,
    loadingQuotes,
    loadingTeamMembers,
    questionnaires.length,
    quotes,
    services,
    teamMembers,
  ]);

  const isLoading =
    loadingClients ||
    loadingTeamMembers ||
    loadingQuotes ||
    loadingJobs ||
    loadingInvoices ||
    loadingQuestionnaires ||
    loadingServices;

  useEffect(() => {
    onRecentActivityChange?.(dashboardData.recentActivity);

    return () => {
      onRecentActivityChange?.([]);
    };
  }, [dashboardData.recentActivity, onRecentActivityChange]);

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        {dashboardData.statsCards.map((card) => (
          <StatsCard key={card.title} {...card} />
        ))}
      </section>

      <section className="grid gap-4 grid-cols-1 lg:grid-cols-[1.15fr_1fr]">
        <RevenueOverview
          chartData={dashboardData.chartData}
          chartRange={chartRange}
          setChartRange={setChartRange}
        />

        <RecentRecords
          recentQuotes={dashboardData.recentQuotes}
          recentInvoices={dashboardData.recentInvoices}
          activeTab={recordsTab}
          setActiveTab={setRecordsTab}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-[1.25fr_0.9fr] xl:grid-cols-[1.35fr_0.75fr_0.75fr]">
        <UpcomingJobs jobs={dashboardData.upcomingJobs} />
        <JobsStatusCard stats={dashboardData.jobsStatusStats} />
        <QuestionnaireCard {...dashboardData.questionnairesCard} />
      </section>

      {isLoading && (
        <p className="text-sm text-slate-400">
          Dashboard metrics are refreshing from the latest records.
        </p>
      )}
    </div>
  );
}

function countRecordsInRange(records, key, startDate, endDate) {
  return records.filter((record) => {
    const date = parseApiDate(record[key]);
    return date ? date >= startDate && date < endDate : false;
  }).length;
}

function countRecordsByStatusInRange(records, status, key, startDate, endDate) {
  return records.filter((record) => {
    const date = parseApiDate(record[key]);
    return record.status === status && date
      ? date >= startDate && date < endDate
      : false;
  }).length;
}

function countStatusesInRange(records, statuses, key, startDate, endDate) {
  return records.filter((record) => {
    const date = parseApiDate(record[key]);
    return statuses.includes(record.status) && date
      ? date >= startDate && date < endDate
      : false;
  }).length;
}


function formatRelativeTime(date, now) {
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}
