import { useCallback, useEffect, useMemo, useState } from "react";

const SEARCH_DELAY_MS = 300;

// Table state that is sent to the API: paging, sorting, search and filters.
// Changing what is listed returns to page 1 and clears the row selection.
export default function useServerTable({
  initialOrdering = "",
  initialFilters = {},
  initialPageSize = 25,
} = {}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [ordering, setOrdering] = useState(initialOrdering);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [selectedIds, setSelectedIds] = useState([]);

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
    setFilters(initialFilters);
    setSearchInput("");
    restart();
    // initialFilters is a caller constant.
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
      ([key, value]) => (initialFilters[key] ?? "") !== value,
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
