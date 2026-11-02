import { Children, useId, useState } from "react";
import { LuChevronDown, LuSearch, LuSlidersHorizontal, LuX } from "react-icons/lu";
import Dropdown from "./Dropdown";

// Shared chrome for dashboard tables: the card, its stat tiles, and one
// filter bar (search, filters, clear, extra actions) so every table filters
// the same way.

export const toolbarButtonClass =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60";

const activeFieldClass = "border-accent/60 bg-orange-50/40";

export const tableCardClass =
  "rounded-2xl border border-gray-200 bg-white shadow-sm";

export function TableStats({ stats }) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
        >
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-semibold leading-none text-slate-900">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

// Matches the form fields on detail pages: uppercase label above an h-10 field.
const labelClass = "mb-1 block text-sm font-semibold uppercase text-gray-500";
const fieldWrapClass = "min-w-0";

// One open/closed preference shared by every table, so collapsing filters
// sticks across pages and reloads.
const filtersOpenKey = "tableFiltersOpen";

function readFiltersOpen() {
  try {
    return localStorage.getItem(filtersOpenKey) === "true";
  } catch {
    return false;
  }
}

export default function TableToolbar({
  title,
  description,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search",
  isFiltered = false,
  onClear,
  actions,
  children,
}) {
  const searchId = useId();
  const [filtersOpen, setFiltersOpen] = useState(readFiltersOpen);
  const hasFilters = Children.count(children) > 0;
  // Filter fields are ToolbarSelect/ToolbarDate, so a set value means active.
  const activeFilterCount = Children.toArray(children).filter(
    (child) => child?.props?.value,
  ).length;

  const toggleFilters = () => {
    setFiltersOpen((open) => {
      try {
        localStorage.setItem(filtersOpenKey, String(!open));
      } catch {
        // Storage can be blocked; the toggle still works for this page.
      }
      return !open;
    });
  };

  return (
    <div className="@container border-b border-gray-200 px-4 py-4 md:px-6">
      {title && (
        <div className="mb-4">
          <h4 className="text-xl font-semibold text-primary">{title}</h4>
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full min-w-0 sm:w-80">
          <label htmlFor={searchId} className="sr-only">
            Search
          </label>
          <LuSearch
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id={searchId}
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className={`block h-10 w-full appearance-none rounded-xl border bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
              searchValue ? activeFieldClass : "border-gray-200"
            }`}
          />
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={toggleFilters}
            aria-expanded={filtersOpen}
            className={`${toolbarButtonClass} ${
              activeFilterCount ? activeFieldClass : ""
            }`}
          >
            <LuSlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters
            {activeFilterCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
            <LuChevronDown
              className={`h-4 w-4 transition-transform ${
                filtersOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>
        )}

        {isFiltered && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-slate-500 transition hover:text-slate-800"
          >
            <LuX className="h-4 w-4" aria-hidden="true" />
            Clear filters
          </button>
        )}

        {actions && (
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        )}
      </div>

      {hasFilters && filtersOpen && (
        <div className="mt-4 grid grid-cols-1 items-end gap-3 @sm:grid-cols-2 @xl:grid-cols-3 @4xl:grid-cols-6">
          {children}
        </div>
      )}
    </div>
  );
}

// The first option should be the "All …" choice with value "".
export function ToolbarSelect({ id, label, value, options, onChange }) {
  return (
    <div className={fieldWrapClass}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <Dropdown
        id={id}
        value={value || ""}
        options={options}
        onChange={onChange}
        placeholder={label}
        buttonClassName={`h-10! rounded-xl px-3 text-sm ${value ? activeFieldClass : ""}`}
        menuClassName="z-40 text-sm"
        textClassName="text-sm"
        menuMaxHeight="16rem"
      />
    </div>
  );
}

export function ToolbarDate({ id, label, value, onChange, min, max }) {
  return (
    <div className={fieldWrapClass}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value || ""}
        min={min || undefined}
        max={max || undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`h-10 w-full rounded-xl border bg-white px-3 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
          value ? activeFieldClass : "border-gray-200"
        }`}
      />
    </div>
  );
}
