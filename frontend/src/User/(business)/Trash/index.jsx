import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LuInfo, LuRotateCcw } from "react-icons/lu";
import {
  useFetchTrashQuery,
  useRestoreRecordMutation,
  useRestoreRecordsMutation,
  TRASH_RESOURCES,
} from "../../../store";
import TableToolbar, { tableCardClass } from "../../../Components/ui/TableToolbar";
import RecordsTable from "../../../Components/ui/RecordsTable";
import TablePagination from "../../../Components/ui/TablePagination";
import LoadingScreen from "../../../Components/ui/LoadingScreen";
import BulkActionBar from "../../../Components/ui/BulkActionBar";
import { pluralize } from "../../../utils/pluralize";
import useAlert from "../../../hooks/useAlert";
import { apiErrorMessage } from "../../../utils/apiError";

const RESOURCE_KEYS = Object.keys(TRASH_RESOURCES);
const SEARCH_DELAY_MS = 300;

const formatDeletedAt = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

// Soft-deleted records, one table per kind of record. Owners can restore a
// record (and whatever was deleted along with it); nothing can be purged
// from here, so deleted records stay available as proof of past work.
export default function Trash({ token }) {
  const setAlert = useAlert();
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("type");
  const resource = RESOURCE_KEYS.includes(requested) ? requested : RESOURCE_KEYS[0];
  const config = TRASH_RESOURCES[resource];

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [restoringId, setRestoringId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  // Labels of the rows in the last bulk restore, for its result summary
  // (restored rows leave the page on refetch).
  const [bulkLabels, setBulkLabels] = useState({});

  useEffect(() => {
    const next = searchInput.trim();
    if (next === search) return undefined;
    const timer = setTimeout(() => {
      setSearch(next);
      setPage(1);
      setSelectedIds([]);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  const queryArgs = { resource, page, page_size: pageSize };
  if (search) queryArgs.search = search;
  const { data, isLoading, isFetching, error } = useFetchTrashQuery(queryArgs, {
    skip: !token,
  });
  const [restoreRecord] = useRestoreRecordMutation();
  const [restoreRecords] = useRestoreRecordsMutation();

  useEffect(() => {
    if (error) {
      setAlert({
        type: "danger",
        message: apiErrorMessage(error, "Failed to load deleted records."),
      });
    }
  }, [error, setAlert]);

  const selectResource = (key) => {
    setSearchParams({ type: key }, { replace: true });
    setSearchInput("");
    setSearch("");
    setPage(1);
    setSelectedIds([]);
  };

  const goToPage = (next) => {
    setPage(next);
    setSelectedIds([]);
  };

  const handleRestore = async (row) => {
    setRestoringId(row.id);
    try {
      const result = await restoreRecord({ resource, id: row.id }).unwrap();
      setAlert({
        type: "success",
        message: result?.detail || `“${row.label}” was restored.`,
      });
      // Restoring the last row on a page leaves it empty; step back.
      if (data?.results?.length === 1 && page > 1) goToPage(page - 1);
      setSelectedIds((ids) => ids.filter((id) => id !== row.id));
    } catch (err) {
      setAlert({
        type: "danger",
        message: apiErrorMessage(err, `Could not restore “${row.label}”.`),
      });
    } finally {
      setRestoringId(null);
    }
  };

  const rows = data?.results || [];

  const labelFor = (id) =>
    rows.find((row) => String(row.id) === String(id))?.label ||
    bulkLabels[String(id)] ||
    `#${id}`;

  const runBulkRestore = async () => {
    setBulkLabels(Object.fromEntries(rows.map((row) => [String(row.id), row.label])));
    const result = await restoreRecords({ resource, ids: selectedIds }).unwrap();
    setSelectedIds([]);
    if (result.succeeded === rows.length && page > 1) goToPage(page - 1);
    return result;
  };

  const bulkActions = [
    {
      key: "restore",
      label: "Restore",
      tone: "primary",
      describeRow: labelFor,
      confirmContent: (labels) => (
        <div className="space-y-3">
          <p>
            {labels.length === 1
              ? `This ${config.singular} will be restored:`
              : `These ${labels.length} ${config.label.toLowerCase()} will be restored:`}
          </p>
          <ul className="max-h-48 list-disc space-y-0.5 overflow-y-auto rounded-xl border border-gray-200 bg-slate-50 py-2 pl-8 pr-3 font-semibold text-slate-900">
            {labels.map((label, index) => (
              <li key={`${label}-${index}`} className="break-words">
                {label}
              </li>
            ))}
          </ul>
          <p className="text-slate-500">
            Anything deleted along with them comes back too. Records whose
            parent is still in Trash are skipped.
          </p>
        </div>
      ),
      successMessage: (count) =>
        `${pluralize(count, config.singular)} restored.`,
    },
  ];

  const columns = [
    {
      key: "record",
      title: config.label,
      width: "50%",
      className: "px-4 py-3",
      render: (row) => (
        <div className="min-w-0">
          <p className="break-words font-semibold text-slate-900">{row.label}</p>
          {row.detail && (
            <p className="mt-0.5 break-words text-sm text-slate-500">
              {row.detail}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "deleted",
      title: "Deleted",
      width: "30%",
      className: "px-4 py-3 text-slate-700",
      render: (row) => (
        <div>
          <p className="whitespace-nowrap">{formatDeletedAt(row.deleted_at)}</p>
          {row.deleted_by && (
            <p className="text-sm text-slate-500">by {row.deleted_by}</p>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      width: "20%",
      className: "px-4 py-3",
      render: (row) =>
        row.blocked_reason ? (
          <p className="max-w-56 text-xs text-slate-500">{row.blocked_reason}</p>
        ) : (
          <button
            type="button"
            onClick={() => handleRestore(row)}
            disabled={restoringId !== null}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={`Restore ${row.label}`}
          >
            <LuRotateCcw className="h-4 w-4" aria-hidden="true" />
            {restoringId === row.id ? "Restoring..." : "Restore"}
          </button>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-2xl font-semibold text-primary md:text-3xl">Trash</h4>
        <p className="mt-2 flex items-start gap-2 text-sm text-slate-600">
          <LuInfo className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Deleted records are kept here as a record of past work. Restoring
          one also brings back anything that was deleted along with it.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Kind of record"
        className="flex gap-2 overflow-x-auto pb-1"
      >
        {RESOURCE_KEYS.map((key) => {
          const selected = key === resource;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => selectResource(key)}
              className={`h-9 shrink-0 rounded-xl border px-3 text-sm font-semibold transition ${
                selected
                  ? "border-accent bg-accent text-white"
                  : "border-gray-200 bg-white text-slate-700 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              {TRASH_RESOURCES[key].label}
            </button>
          );
        })}
      </div>

      <div className={tableCardClass}>
        <TableToolbar
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder={`Search deleted ${config.label.toLowerCase()}`}
          isFiltered={Boolean(search)}
          onClear={() => setSearchInput("")}
        />
        <BulkActionBar
          selectedCount={selectedIds.length}
          selectedIds={selectedIds}
          actions={bulkActions}
          onRun={runBulkRestore}
          onClear={() => setSelectedIds([])}
        />
        {isLoading ? (
          <LoadingScreen label="Loading deleted records" />
        ) : (
          <RecordsTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            isFetching={isFetching}
            selection={{
              selectedIds,
              onToggle: (id) =>
                setSelectedIds((ids) =>
                  ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id],
                ),
              onToggleAll: (ids) =>
                setSelectedIds((current) =>
                  ids.length && ids.every((id) => current.includes(id)) ? [] : ids,
                ),
            }}
            empty={
              <p className="text-center text-slate-500">
                {search
                  ? `No deleted ${config.label.toLowerCase()} match “${search}”.`
                  : `No deleted ${config.label.toLowerCase()}.`}
              </p>
            }
            footer={
              <TablePagination
                page={page}
                pageSize={pageSize}
                count={data?.count}
                totalPages={data?.total_pages}
                isFetching={isFetching}
                noun={`deleted ${config.label.toLowerCase()}`}
                onPageChange={goToPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  goToPage(1);
                }}
              />
            }
          />
        )}
      </div>
    </div>
  );
}
