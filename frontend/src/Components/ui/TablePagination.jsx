import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

const PAGE_SIZES = [10, 25, 50, 100];
const pageButtonClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50";

// Footer for server-paged tables: totals, page size and previous/next.
export default function TablePagination({
  page,
  pageSize,
  count = 0,
  totalPages = 1,
  isFetching,
  noun = "records",
  onPageChange,
  onPageSizeChange,
}) {
  const first = count ? (page - 1) * pageSize + 1 : 0;
  const last = Math.min(page * pageSize, count);

  return (
    <>
      <p>
        Showing {first}–{last} of {count} {noun}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
        <label className="flex items-center gap-2">
          <span>Rows</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-9 rounded-xl border border-gray-200 bg-white px-2 text-sm text-slate-700"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <p>
          Page {page} of {Math.max(totalPages, 1)}
        </p>
        <button
          type="button"
          className={pageButtonClass}
          disabled={isFetching || page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <LuChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={pageButtonClass}
          disabled={isFetching || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <LuChevronRight className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}
