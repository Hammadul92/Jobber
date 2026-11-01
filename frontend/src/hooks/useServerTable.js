import { useCallback, useEffect, useMemo, useState } from "react";

const SEARCH_DELAY_MS = 300;
const STORAGE_PREFIX = "table:";

// Saved state is tagged with the end of the auth token so a different login
// in the same tab starts with clean filters instead of the last user's.
function sessionOwner() {
  try {
    return (localStorage.getItem("token") || "").slice(-8);
  } catch {
    return "";
  }
}

function readSaved(storageKey) {
  if (!storageKey) return null;
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_PREFIX + storageKey));
    return saved?.owner === sessionOwner() ? saved : null;
  } catch {
    return null;
  }
}

function writeSaved(storageKey, state) {
  if (!storageKey) return;
  try {
    sessionStorage.setItem(
      STORAGE_PREFIX + storageKey,
      JSON.stringify({ ...state, owner: sessionOwner() }),
    );
  } catch {
    // Storage may be unavailable (private mode); the table still works.
  }
}

// Table state that is sent to the API: paging, sorting, search and filters.
// Changing what is listed returns to page 1 and clears the row selection.
// With a storageKey, search, filters, sort and page size are kept for the
// browser session; fixedFilters (e.g. from the route) always win over them.
export default function useServerTable({
  storageKey,
  initialOrdering = "",
  initialFilters = {},
  fixedFilters = {},
  initialPageSize = 25,
} = {}) {
  const [saved] = useState(() => readSaved(storageKey));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(
    saved?.pageSize ?? initialPageSize,
  );
  const [ordering, setOrdering] = useState(saved?.ordering ?? initialOrdering);
  const [searchInput, setSearchInput] = useState(saved?.search ?? "");
  const [search, setSearch] = useState(saved?.search ?? "");
  const [filters, setFilters] = useState(() => ({
    ...initialFilters,
    ...saved?.filters,
    ...fixedFilters,
  }));
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    writeSaved(storageKey, { filters, search, ordering, pageSize });
  }, [storageKey, filters, search, ordering, pageSize]);

  const restart = useCallback(() => {
    setPage(1);
    setSelectedIds([]);
  }, []);

  useEffect(() => {
    const next = searchInput.trim();
    if (next === search) return undefined;
    const timer = setTimeout(() => {
      setSearch(next);
      restart();
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchInput, search, restart]);

  const setFilter = useCallback(
    (key, value) => {
      setFilters((current) => ({ ...current, [key]: value }));
      restart();
    },
    [restart],
  );

  const resetFilters = useCallback(() => {
    setFilters({ ...initialFilters, ...fixedFilters });
    setSearchInput("");
    restart();
    // initialFilters and fixedFilters are read when filters are reset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restart]);

  const toggleSort = useCallback(
    (key) => {
      setOrdering((current) =>
        current === key ? `-${key}` : current === `-${key}` ? "" : key,
      );
      restart();
    },
    [restart],
  );

  const goToPage = useCallback((next) => {
    setPage(next);
    setSelectedIds([]);
  }, []);

  const setPageSize = useCallback(
    (size) => {
      setPageSizeState(size);
      restart();
    },
    [restart],
  );

  const toggleSelected = useCallback((id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }, []);

  const toggleAllSelected = useCallback((ids) => {
    setSelectedIds((current) =>
      ids.length && ids.every((id) => current.includes(id)) ? [] : ids,
    );
  }, []);

  const queryArgs = useMemo(() => {
    const args = { page, page_size: pageSize };
    if (ordering) args.ordering = ordering;
    if (search) args.search = search;
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        args[key] = value;
      }
    });
    return args;
  }, [page, pageSize, ordering, search, filters]);

  const hasActiveFilters =
    Boolean(search) ||
    Object.entries(filters).some(
      ([key, value]) => (fixedFilters[key] ?? initialFilters[key] ?? "") !== value,
    );

  return {
    queryArgs,
    page,
    pageSize,
    ordering,
    searchInput,
    filters,
    selectedIds,
    hasActiveFilters,
    setSearchInput,
    setFilter,
    resetFilters,
    toggleSort,
    goToPage,
    setPageSize,
    toggleSelected,
    toggleAllSelected,
    clearSelection: () => setSelectedIds([]),
  };
}
