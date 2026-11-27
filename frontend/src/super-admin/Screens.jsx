import useURLSearch from "./useURLSearch";
import PhotoGallery from "./PhotoGallery";
import TableText from "./TableText";
import { RecordActionButtons, iconButtonClass } from "./RecordActions";
import { Link } from "react-router-dom";
import {
  LuDownload,
  LuArrowUpRight,
  LuX,
  LuPlus,
  LuRefreshCw,
} from "react-icons/lu";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import DashboardStatCard from "../Components/ui/DashboardStatCard";
import RecordsTable from "../Components/ui/RecordsTable";
import RecordLink from "../Components/ui/RecordLink";
import TablePagination from "../Components/ui/TablePagination";
import TableToolbar, {
  ToolbarDate,
  ToolbarSelect,
  tableCardClass,
} from "../Components/ui/TableToolbar";
import Input from "../Components/ui/Input";
import Select from "../Components/ui/Select";
import { ViewControls } from "./Utilities";
import { label, icons } from "./navigation";
export const panelClass =
  "rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]";
const headingClass = "text-2xl font-medium tracking-tight text-slate-900";

function Status({ value }) {
  const tone =
    {
      PAID: "bg-emerald-100 text-emerald-700",
      SIGNED: "bg-emerald-100 text-emerald-700",
      COMPLETED: "bg-emerald-100 text-emerald-700",
      ACTIVE: "bg-emerald-100 text-emerald-700",
      SENT: "bg-blue-100 text-blue-700",
      IN_PROGRESS: "bg-blue-100 text-blue-700",
      FAILED: "bg-rose-100 text-rose-700",
      CANCELLED: "bg-rose-100 text-rose-700",
      PENDING: "bg-amber-100 text-amber-700",
    }[value] || "bg-slate-100 text-slate-600";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${tone}`}
    >
      {label(
        String(value || "Unknown")
          .toLowerCase()
          .replaceAll("_", "-"),
      )}
    </span>
  );
}
export function Overview({ data, reports = false }) {
  const primary = [
    "users",
    "businesses",
    "clients",
    "services",
    "jobs",
    "invoices",
  ];
  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        {primary.map((key) => (
          <Link key={key} to={`/super-admin/${key}`}>
            <DashboardStatCard
              icon={icons[key]}
              title={`Total ${label(key)}`}
              value={data.counts[key]}
            />
          </Link>
        ))}
      </section>
      <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-4">
        <div className={panelClass}>
          <h2 className={headingClass}>Business Registrations</h2>
          <p className="mt-1 text-sm text-slate-500">Last 90 days · UTC</p>
          {data.business_trend?.length ? (
            <>
              <div className="h-[300px] mt-8" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.business_trend}>
                    <CartesianGrid
                      vertical={false}
                      stroke="#dbe4ef"
                      strokeDasharray="4 4"
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip />
                    <Line
                      dataKey="count"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ fill: "#2563eb", stroke: "#fff", strokeWidth: 3 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <details className="mt-4 text-sm text-slate-500">
                <summary className="cursor-pointer">View chart data</summary>
                <table className="w-full text-left">
                  <caption className="sr-only">
                    Registrations by UTC date
                  </caption>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Businesses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.business_trend.map((r) => (
                      <tr key={r.day}>
                        <th scope="row">{r.day}</th>
                        <td>{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </>
          ) : (
            <div className="flex min-h-64 items-center justify-center text-sm text-slate-500 text-center">
              No businesses registered in this period.
            </div>
          )}
        </div>
        <div className={panelClass}>
          <h2 className={headingClass}>Invoice Overview</h2>
          <p className="mt-1 text-sm text-slate-500">
            Invoice totals grouped by currency and status.
          </p>
          <div className="mt-6">
            <RecordsTable
              columns={[
                {
                  key: "currency",
                  title: "Currency",
                  render: (r) => r.currency,
                },
                {
                  key: "status",
                  title: "Status",
                  render: (r) => <Status value={r.status} />,
                },
                {
                  key: "total",
                  title: "Amount",
                  render: (r) =>
                    new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: r.currency,
                    }).format(r.total),
                },
              ]}
              rows={data.invoice_totals}
              rowKey={(r) => `${r.currency}-${r.status}`}
              empty="No invoices yet."
            />
          </div>
          <Link
            to="/super-admin/invoices?status=SENT"
            className="mt-6 inline-flex items-center gap-1 text-accent font-medium"
          >
            Review outstanding invoices <LuArrowUpRight />
          </Link>
        </div>
      </section>
      <section className={panelClass}>
        <h2 className={headingClass}>Platform Records</h2>
        <p className="mt-1 mb-6 text-sm text-slate-500">{data.coverage}</p>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(data.counts)
            .filter(([key]) => !primary.includes(key))
            .map(([key, count]) => (
              <Link
                key={key}
                to={`/super-admin/${key}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-slate-50 p-4 hover:border-accent/40 hover:bg-white transition"
              >
                <span className="text-sm text-slate-500">{label(key)}</span>
                <strong className="text-xl font-medium text-slate-900">
                  {count}
                </strong>
              </Link>
            ))}
        </div>
      </section>
      {reports && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(data.statuses).map(([entity, rows]) => (
            <div className={panelClass} key={entity}>
              <h2 className={headingClass}>{label(entity)} Status</h2>
              <div className="mt-6 space-y-4">
                {rows.map((r) => (
                  <Link
                    key={r.status}
                    to={`/super-admin/${entity}?status=${r.status}`}
                    className="flex items-center justify-between text-slate-700"
                  >
                    <Status value={r.status} />
                    <span>{r.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
function RelationFilter({ field, value, onChange }) {
  const [input, setInput] = useURLSearch(value, onChange);
  return (
    <div className="[&>div]:mb-0">
      <Input
        id={`filter-${field.name}`}
        label={field.label}
        type="text"
        value={input}
        onChange={setInput}
        fieldClass="h-10! py-2! text-sm!"
      />
    </div>
  );
}
export function RecordList({
  resource,
  data,
  params,
  setParams,
  filter,
  visible,
  setVisible,
  busy,
  onExport,
  onAction,
  value,
}) {
  const [searchInput, setSearchInput] = useURLSearch(
    params.get("search") || "",
    (value) => filter("search", value),
  );
  const filters = data.fields.filter(
    (f) =>
      f.choices.length ||
      ["BooleanField", "ForeignKey", "OneToOneField"].includes(f.type),
  );
  const dates = data.fields.filter((f) =>
    ["DateField", "DateTimeField"].includes(f.type),
  );
  const render = (field, row) => {
    const v = row[field.name];
    if (field.primary)
      return (
        <RecordLink
          to={`/super-admin/${resource}/${row.id}?${params}`}
          className="text-accent"
        >
          {row._label}
        </RecordLink>
      );
    if (field.name === "status") return <Status value={v} />;
    const related = row._relations?.[field.name];
    if (related)
      return (
        <RecordLink
          to={
            related.resource
              ? `/super-admin/${related.resource}/${related.id}`
              : undefined
          }
        >
          {related.label}
        </RecordLink>
      );
    if (
      [
        "amount",
        "total_amount",
        "subtotal",
        "refunded_amount",
        "price",
      ].includes(field.name) &&
      row.currency &&
      v !== null
    )
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: row.currency,
      }).format(v);
    return <TableText text={value(v)} label={field.label} />;
  };
  return (
    <div className={tableCardClass}>
      <TableToolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder={`Search ${label(resource).toLowerCase()}…`}
        filterCount={
          filters.filter(
            (f) => params.get(f.name) || params.get(f.name + "_search"),
          ).length + ["from", "to"].filter((k) => params.get(k)).length
        }
        isFiltered={Array.from(params.keys()).some(
          (k) => !["page", "page_size", "ordering", "date_field"].includes(k),
        )}
        onClear={() => {
          setSearchInput("");
          setParams({});
        }}
        actions={
          <>
            {!["audit", "activity"].includes(resource) && (
              <button
                type="button"
                className={iconButtonClass}
                aria-label={`Create ${label(resource)}`}
                title={`Create ${label(resource)}`}
                onClick={() => onAction({ resource, action: "create" })}
              >
                <LuPlus className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              className={iconButtonClass}
              disabled={busy}
              aria-label="Export CSV"
              title="Export CSV"
              onClick={onExport}
            >
              <LuDownload className="h-4 w-4" />
            </button>
          </>
        }
      >
        {filters.map((f) =>
          ["ForeignKey", "OneToOneField"].includes(f.type) ? (
            <RelationFilter
              key={f.name}
              field={f}
              value={
                params.get(f.name + "_search") ||
                (params.get(f.name) ? data.filter_labels?.[f.name] || "" : "")
              }
              onChange={(v) => filter(f.name + "_search", v)}
            />
          ) : (
            <ToolbarSelect
              key={f.name}
              id={`filter-${f.name}`}
              label={f.label}
              value={params.get(f.name) || ""}
              options={[
                { label: `All ${f.label.toLowerCase()}`, value: "" },
                ...(f.choices.length
                  ? f.choices
                  : [
                      ["true", "Yes"],
                      ["false", "No"],
                    ]
                ).map(([v, l]) => ({ value: String(v), label: l })),
              ]}
              onChange={(v) => filter(f.name, v)}
            />
          ),
        )}
        {dates.length > 0 && (
          <ToolbarSelect
            id="date-field"
            label="Date field"
            value={params.get("date_field") || data.date_field || ""}
            options={dates.map((f) => ({ value: f.name, label: f.label }))}
            onChange={(v) => filter("date_field", v)}
          />
        )}
        {dates.length > 0 &&
          ["from", "to"].map((f) => (
            <ToolbarDate
              key={f}
              id={`filter-${f}`}
              label={label(f)}
              value={params.get(f) || ""}
              onChange={(v) => filter(f, v)}
            />
          ))}
      </TableToolbar>
      <div className="px-4 md:px-6">
        <div aria-label="Active filters" className="flex flex-wrap gap-2 pt-3">
          {[...params.entries()]
            .filter(
              ([name]) =>
                !["page", "page_size", "ordering", "date_field"].includes(name),
            )
            .map(([name, val]) => (
              <button
                key={name}
                className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs text-accent break-all"
                onClick={() => filter(name, "")}
              >
                {label(name.replace(/_search$/, ""))}:{" "}
                {data.filter_labels?.[name] || val}
                <LuX className="h-3 w-3" />
              </button>
            ))}
        </div>
        {resource !== "photos" && (
          <ViewControls
            key={resource}
            resource={resource}
            fields={data.fields}
            params={params}
            setParams={setParams}
            visible={visible}
            setVisible={setVisible}
          />
        )}
      </div>
      {resource === "team" && (
        <p className="px-4 py-3 text-sm text-slate-500 md:px-6">
          Active Membership excludes deleted memberships. Removing a membership
          does not disable the person’s login account.
        </p>
      )}
      {resource === "photos" ? (
        <PhotoGallery
          key={params.toString()}
          rows={data.results}
          value={value}
          onAction={onAction}
        />
      ) : (
        <RecordsTable
          rows={data.results}
          tableClassName={
            !["audit", "activity"].includes(resource)
              ? "[&_th:last-child]:min-w-0! [&_th:last-child]:w-px [&_td:last-child]:min-w-0! [&_td:last-child]:w-px"
              : ""
          }
          rowKey={(r) => r.id}
          isFetching={busy}
          empty="No matching records. Try clearing your filters."
          ordering={params.get("ordering") || "-id"}
          onSort={(f) =>
            filter("ordering", params.get("ordering") === f ? `-${f}` : f)
          }
          columns={[
            ...data.fields
              .filter((f) => f.primary || visible.includes(f.name))
              .map((f) => ({
                key: f.name,
                title: f.label,
                sortKey: f.sort_key,
                render: (r) => (
                  <div
                    className={
                      ["TextField", "JSONField"].includes(f.type) ||
                      ["job_duties", "expertise"].includes(f.name)
                        ? "min-w-80 max-w-96"
                        : "min-w-40 max-w-64"
                    }
                  >
                    {f.primary ||
                    ["ForeignKey", "OneToOneField", "Relation"].includes(
                      f.type,
                    ) ? (
                      <div className="line-clamp-3 break-words [overflow-wrap:anywhere]">
                        {render(f, r)}
                      </div>
                    ) : (
                      render(f, r)
                    )}
                  </div>
                ),
              })),
            ...(!["audit", "activity"].includes(resource)
              ? [
                  {
                    key: "actions",
                    title: "Actions",
                    width: "1%",
                    render: (row) => (
                      <RecordActionButtons
                        resource={resource}
                        row={row}
                        onAction={onAction}
                      />
                    ),
                  },
                ]
              : []),
          ]}
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-4 text-sm text-slate-500 md:px-6">
        <TablePagination
          page={data.page}
          pageSize={data.page_size || 25}
          count={data.count}
          totalPages={data.pages}
          isFetching={busy}
          noun="records"
          onPageChange={(v) => filter("page", String(v))}
          onPageSizeChange={(v) => filter("page_size", String(v))}
        />
      </div>
    </div>
  );
}
export function RecordDetail({
  data,
  resource,
  id,
  value,
  comparison,
  onConfirm,
  onAction,
  busy,
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Record Details
            </h2>
            <p className="mt-1 text-sm text-slate-500">{data.record._label}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <RecordActionButtons
              resource={resource}
              row={data.record}
              onAction={onAction}
            />
            {data.documents?.map((d) => (
              <button
                className={iconButtonClass}
                key={d.url}
                aria-label={d.label}
                title={d.label}
                onClick={() => onConfirm(d.url)}
              >
                <LuDownload className="h-4 w-4" />
              </button>
            ))}
            {["payments", "refunds"].includes(resource) && (
              <button
                className={iconButtonClass}
                disabled={busy}
                aria-label="Compare with Stripe"
                title="Compare with Stripe"
                onClick={() => onConfirm({ type: "stripe" })}
              >
                <LuRefreshCw className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </header>
        <dl className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {data.fields.map((f) => (
            <div className="min-w-0" key={f.name}>
              <dt className="mb-1 block text-sm font-semibold uppercase text-gray-500">
                {f.label}
              </dt>
              <dd className="min-h-11 rounded-xl border border-gray-200 bg-[#FAFAFA] px-4 py-3 text-base text-slate-700 whitespace-pre-wrap break-words">
                {f.type === "ImageField" ? (
                  data.record[f.name] ? (
                    <img
                      className="max-h-72 max-w-full object-contain"
                      alt={f.label}
                      src={`/api/super-admin/media/${resource}/${id}/${f.name}/`}
                    />
                  ) : (
                    "No image"
                  )
                ) : f.name === "status" ? (
                  <Status value={data.record[f.name]} />
                ) : data.record._relations?.[f.name] ? (
                  <RecordLink
                    to={
                      data.record._relations[f.name].resource
                        ? `/super-admin/${data.record._relations[f.name].resource}/${data.record._relations[f.name].id}`
                        : undefined
                    }
                  >
                    {data.record._relations[f.name].label}
                  </RecordLink>
                ) : (
                  value(data.record[f.name])
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      {data.links.length > 0 && (
        <section className={panelClass}>
          <h2 className={headingClass}>Related Records</h2>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.links.map((l) => (
              <Link
                key={`${l.label}-${l.query || l.id}`}
                to={
                  l.query
                    ? `/super-admin/${l.resource}?${l.query}`
                    : `/super-admin/${l.resource}/${l.id}`
                }
                className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 hover:border-accent/40 hover:bg-white"
              >
                <span>{l.label}</span>
                <LuArrowUpRight className="text-accent shrink-0 h-4 w-4" />
              </Link>
            ))}
          </div>
        </section>
      )}
      {comparison && (
        <section className={panelClass}>
          <h2 className={headingClass}>Stripe Comparison</h2>
          <p className="mt-2 text-sm text-slate-500">
            Provider amounts use minor currency units (cents). Local financial
            records are unchanged.
          </p>
          <dl className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            {Object.entries(comparison).map(([k, v]) => (
              <div key={k}>
                <dt className="text-sm font-semibold uppercase text-gray-500">
                  {label(k.replaceAll("_", "-"))}
                </dt>
                <dd className="mt-1 text-slate-700">{value(v)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
export function Preferences({ auth, timezone, setTimezone }) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <header className="mb-6 border-b border-gray-100 pb-5">
        <h2 className="text-xl font-semibold text-slate-900">
          Profile & Preferences
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Signed in as {auth.email || auth.name}. Sessions expire after 30
          minutes.
        </p>
      </header>
      <div className="max-w-lg">
        <Select
          id="display-timezone"
          label="Display timezone"
          value={timezone}
          onChange={(v) => {
            localStorage.setItem("super-admin-timezone", v);
            setTimezone(v);
          }}
          options={[
            "UTC",
            Intl.DateTimeFormat().resolvedOptions().timeZone,
            "America/Edmonton",
            "America/Toronto",
            "America/New_York",
            "Asia/Karachi",
          ]
            .filter((v, i, a) => a.indexOf(v) === i)
            .map((v) => ({ value: v, label: v }))}
        />
        <p className="text-sm text-slate-500">
          Record times use your selected timezone. Chart dates remain labeled in
          UTC.
        </p>
      </div>
    </section>
  );
}
export function SystemScreen({ data, value }) {
  return (
    <section className={panelClass}>
      <h2 className={headingClass}>System Status</h2>
      <dl className="mt-6 divide-y divide-gray-100">
        {Object.entries(data).map(([key, v]) => (
          <div key={key} className="grid grid-cols-1 lg:grid-cols-2 gap-2 py-4">
            <dt className="text-sm font-semibold uppercase text-gray-500">
              {label(key.replaceAll("_", "-"))}
            </dt>
            <dd className="text-sm text-slate-700 whitespace-pre-wrap break-words">
              {value(v)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
export function Trash({ resources }) {
  return (
    <section className={panelClass}>
      <h2 className={headingClass}>Deleted Records</h2>
      <p className="mt-1 text-sm text-slate-500">
        Review deleted records by entity.
      </p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        {resources
          .filter((r) => !["audit", "activity"].includes(r))
          .map((r) => (
            <Link
              key={r}
              to={`/super-admin/${r}?is_deleted=true`}
              className="flex items-center justify-between rounded-2xl border border-gray-200 bg-slate-50 p-4 text-slate-700 hover:border-accent/40 hover:bg-white"
            >
              {label(r)}
              <LuArrowUpRight className="text-accent" />
            </Link>
          ))}
      </div>
    </section>
  );
}
