import { useEffect, useState } from "react";
import {
  BrowserRouter,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import ConfirmDialog from "../Components/ui/ConfirmDialog";
import LoadingScreen from "../Components/ui/LoadingScreen";
import ActionDialog from "./RecordActions";
import Shell from "./Shell";
import { label as title } from "./navigation";
import Login from "./Login";
import { api } from "./client";
import {
  Overview,
  RecordList,
  RecordDetail,
  Preferences,
  SystemScreen,
  Trash,
} from "./Screens";
import { toolbarButtonClass } from "../Components/ui/TableToolbar";
const resources = [
  "users",
  "admins",
  "businesses",
  "clients",
  "team",
  "services",
  "questionnaires",
  "terms-templates",
  "jobs",
  "assignments",
  "photos",
  "quotes",
  "invoices",
  "payments",
  "refunds",
  "payment-methods",
  "catalog",
  "faqs",
  "audit",
  "activity",
];
const additional = ["reports", "system", "trash", "settings"];

function value(v) {
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v))
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: localStorage.getItem("super-admin-timezone") || "UTC",
    }).format(new Date(v));
  return v === null || v === ""
    ? "Not provided"
    : typeof v === "object"
      ? JSON.stringify(v, null, 2)
      : String(v);
}
function Workspace() {
  const [auth, setAuth] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loadedData, setData] = useState(null),
    [confirm, setConfirm] = useState(false);
  const [actionTarget, setActionTarget] = useState(null);
  useEffect(() => {
    if (!confirm) return;
    const previous = document.activeElement;
    const trap = (event) => {
      if (event.key !== "Tab") return;
      const controls = [
        ...document.querySelectorAll(
          '[role="alertdialog"] button:not([disabled]), [role="alertdialog"] input',
        ),
      ];
      const first = controls[0],
        last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [confirm]);
  const location = useLocation();
  const data =
    loadedData?.route === location.pathname ? loadedData.value : null;
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [visible, setVisible] = useState([]);
  const [comparison, setComparison] = useState(null);
  useEffect(() => setComparison(null), [location.pathname]);
  const [timezone, setTimezone] = useState(
    localStorage.getItem("super-admin-timezone") || "UTC",
  );
  useEffect(() => {
    setVisible([]);
    setData(null);
  }, [location.pathname]);
  const [resource, id] = location.pathname
    .replace(/^\/super-admin\/?/, "")
    .split("/");
  const key = resources.includes(resource) ? resource : "";
  useEffect(() => {
    if (resource === "settings")
      navigate("/super-admin/system", { replace: true });
  }, [resource, navigate]);
  useEffect(() => {
    document.title = `${resource ? title(resource) : "Overview"} | GetContractorz Super-admin`;
  }, [resource]);
  useEffect(() => {
    api("auth/")
      .then(setAuth)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!auth?.authenticated) return;
    if (
      resource &&
      !key &&
      !additional.includes(resource) &&
      resource !== "sign-in"
    ) {
      setBusy(false);
      setError("Page not found. Choose a screen from the navigation.");
      setData(null);
      return;
    }
    let current = true;
    setBusy(true);
    setError("");
    const endpoint = key
      ? `records/${key}/${id ? `${id}/` : `?${params}`}`
      : resource === "system"
        ? "system/"
        : resource === "activity"
          ? `records/audit/?${params}`
          : "overview/";
    api(endpoint)
      .then((d) => {
        if (current) {
          setData({ route: location.pathname, value: d });
          setVisible((previous) =>
            previous.length
              ? previous
              : d.fields
                  ?.filter(
                    (f) =>
                      f.primary ||
                      [
                        "name",
                        "email",
                        "status",
                        "role",
                        "title",
                        "service_name",
                        "quote_number",
                        "invoice_number",
                        "amount",
                        "currency",
                        "is_active",
                        "is_deleted",
                        "business",
                        "client",
                        "action_time",
                        "change_message",
                        "scheduled_date",
                        "due_date",
                        "total_amount",
                        "employee",
                        "owner",
                        "user",
                        "service",
                        "job",
                        "team_member",
                        "entity",
                        "record",
                        "operation",
                        "created_at",
                      ].includes(f.name),
                  )
                  .map((f) => f.name) || [],
          );
        }
      })
      .catch((e) => {
        if (current) {
          setError(e.message);
          if (e.status === 403) setAuth({ authenticated: false });
        }
      })
      .finally(() => {
        if (current) setBusy(false);
      });
    return () => {
      current = false;
    };
  }, [auth, key, id, params, location.pathname, resource]);
  const filter = (name, val) => {
    // Merge rapid control changes against the latest URL, not a stale render.
    const next = new URLSearchParams(window.location.search);
    val ? next.set(name, val) : next.delete(name);
    if (name.endsWith("_search")) next.delete(name.slice(0, -7));
    if (name !== "page") next.delete("page");
    setParams(next);
  };
  async function signin(credentials) {
    setBusy(true);
    setError("");
    try {
      setAuth(
        await api("auth/", {
          method: "POST",
          body: JSON.stringify(credentials),
        }),
      );
      if (resource === "sign-in") navigate("/super-admin", { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function exportCSV() {
    setConfirm(false);
    setBusy(true);
    try {
      const query = new URLSearchParams(params);
      query.set("export", "csv");
      const response = await fetch(
        `/api/super-admin/records/${key}/?${query}`,
        { credentials: "same-origin" },
      );
      if (!response.ok) throw new Error((await response.json()).detail);
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `${key}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!auth)
    return error ? (
      <div className="p-8 text-center text-slate-600" role="alert">
        {error}
        <button
          className={toolbarButtonClass}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    ) : (
      <LoadingScreen fullScreen label="Loading session…" />
    );
  if (!auth.authenticated)
    return <Login onSubmit={signin} busy={busy} error={error} />;
  const descriptions = {
    users: "Review user profiles, roles, and platform access.",
    admins: "Review active and inactive platform superusers.",
    businesses: "Review businesses and their platform activity.",
    clients: "Review client profiles and their linked businesses.",
    services: "Review service agreements, pricing, and automation.",
    jobs: "Review schedules, assignments, and job progress.",
    invoices: "Review invoices, billing periods, and payment status.",
    payments: "Review payment records and provider status.",
    refunds: "Review refunds and their linked payments.",
    quotes: "Review quotes, revisions, and signed agreements.",
    reports: "Explore platform activity and financial summaries.",
    audit: "Review administrative actions and exports.",
    activity: "Review recorded changes across the platform.",
  };
  return (
    <Shell
      recordLabel={data?.record?._label}
      auth={auth}
      resource={resource}
      id={id}
      description={
        descriptions[resource] ||
        `Review ${title(resource || "platform").toLowerCase()} and related records.`
      }
      api={api}
      onLogout={async () => {
        await api("auth/", { method: "DELETE" });
        setAuth({ authenticated: false });
        await api("auth/");
      }}
    >
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
          <button
            className={`${toolbarButtonClass} ml-3`}
            onClick={() => setAuth({ ...auth })}
          >
            Retry
          </button>
        </div>
      )}
      {busy && !data && <LoadingScreen label="Loading records…" />}
      {data?.counts && !["settings", "trash"].includes(resource) && (
        <Overview data={data} reports={resource === "reports"} />
      )}
      {resource === "system" && (
        <Preferences
          auth={auth}
          timezone={timezone}
          setTimezone={setTimezone}
        />
      )}
      {resource === "trash" && <Trash resources={resources} />}
      {data?.database && <SystemScreen data={data} value={value} />}
      {data?.results && (
        <RecordList
          resource={key}
          data={data}
          params={params}
          setParams={setParams}
          filter={filter}
          visible={visible}
          setVisible={setVisible}
          busy={busy}
          onExport={() => setConfirm(true)}
          onAction={setActionTarget}
          value={value}
        />
      )}
      {data?.record && (
        <RecordDetail
          resource={key}
          id={id}
          data={data}
          value={value}
          comparison={comparison}
          onConfirm={setConfirm}
          onAction={setActionTarget}
          busy={busy}
        />
      )}
      {actionTarget && (
        <ActionDialog
          target={actionTarget}
          api={api}
          onClose={() => setActionTarget(null)}
          onDone={(result) => {
            setActionTarget(null);
            setAuth({ ...auth });
            if (actionTarget.action === "create")
              navigate(`/super-admin/${result.resource}/${result.id}`);
            else if (actionTarget.action === "delete" && !result.id)
              navigate(`/super-admin/${result.resource}`);
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(confirm)}
        title={
          typeof confirm === "object"
            ? "Compare with Stripe"
            : typeof confirm === "string"
              ? `Download ${data?.record?._label || title(key)}`
              : `Export ${title(key)}`
        }
        message={
          typeof confirm === "object"
            ? "Retrieve the provider status for this financial record? Local payment and refund data will remain unchanged."
            : typeof confirm === "string"
              ? "Download this document? It may contain customer information. Store it securely."
              : `Download ${data?.count || 0} ${title(key).toLowerCase()} matching your current filters? The file may contain personal information. This export will be recorded in the audit log.`
        }
        confirmLabel={
          typeof confirm === "object"
            ? "Compare"
            : typeof confirm === "string"
              ? "Download PDF"
              : "Export CSV"
        }
        loadingLabel="Exporting…"
        onCancel={() => setConfirm(false)}
        onConfirm={
          typeof confirm === "object"
            ? async () => {
                setConfirm(false);
                setBusy(true);
                try {
                  setComparison(
                    await api(`reconcile/${key}/${id}/`, { method: "POST" }),
                  );
                } catch (e) {
                  setError(e.message);
                } finally {
                  setBusy(false);
                }
              }
            : typeof confirm === "string"
              ? () => {
                  window.location.assign(confirm);
                  setConfirm(false);
                }
              : exportCSV
        }
      />
    </Shell>
  );
}
export default function SuperAdmin() {
  return (
    <BrowserRouter>
      <Workspace />
    </BrowserRouter>
  );
}
