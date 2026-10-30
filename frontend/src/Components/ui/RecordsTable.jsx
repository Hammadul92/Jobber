import { memo, useLayoutEffect, useRef, useState } from "react";
import { LuArrowDown, LuArrowUp, LuArrowUpDown } from "react-icons/lu";

// Shared table shell keeps headers, row spacing, and empty states consistent.
// Optional server features: columns with a sortKey become sortable when
// ordering/onSort are passed, and `selection` adds a checkbox column.
const RecordsTable = memo(function RecordsTable({
  columns,
  rows,
  rowKey,
  empty,
  footer,
  tableClassName = "",
  ordering,
  onSort,
  selection,
  isFetching = false,
}) {
  const viewportRef = useRef(null);
  const tableRef = useRef(null);
  const [scroll, setScroll] = useState({ width: 0, contentWidth: 0, left: 0 });

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const table = tableRef.current;
    if (!viewport || !table) return;

    const updateScroll = () => {
      const next = {
        width: viewport.clientWidth,
        contentWidth: viewport.scrollWidth,
        left: viewport.scrollLeft,
      };
      setScroll((current) =>
        current.width === next.width &&
        current.contentWidth === next.contentWidth &&
        current.left === next.left
          ? current
          : next,
      );
    };

    const observer = new ResizeObserver(updateScroll);
    observer.observe(viewport);
    observer.observe(table);
    viewport.addEventListener("scroll", updateScroll, { passive: true });
    updateScroll();

    return () => {
      observer.disconnect();
      viewport.removeEventListener("scroll", updateScroll);
    };
  }, []);

  const rowIds = selection ? rows.map(rowKey) : [];
  const allSelected =
    rowIds.length > 0 && rowIds.every((id) => selection.selectedIds.includes(id));
  const someSelected =
    !allSelected && rowIds.some((id) => selection?.selectedIds.includes(id));

  const maxScroll = Math.max(0, scroll.contentWidth - scroll.width);
  const thumbWidth = scroll.contentWidth
    ? Math.max(
        36,
        Math.min(scroll.width, scroll.width ** 2 / scroll.contentWidth),
      )
    : 36;

  return (
    <div className="overflow-hidden">
      <div ref={viewportRef} className="records-table-viewport overflow-x-auto">
        <table
          ref={tableRef}
          className={`w-full min-w-full divide-y divide-gray-100 text-sm xl:text-base ${tableClassName}`}
        >
          {columns.some((column) => column.width) && (
            <colgroup>
              {selection && <col style={{ width: "3rem" }} />}
              {columns.map((column) => (
                <col key={column.key} style={{ width: column.width }} />
              ))}
            </colgroup>
          )}
          <thead className="bg-gray-50">
            <tr>
              {selection && (
                <th scope="col" className="w-12 px-4 py-3 text-center align-middle">
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 align-middle accent-[#ff6a00]"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={() => selection.onToggleAll(rowIds)}
                    disabled={!rowIds.length}
                    aria-label="Select all rows on this page"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`${column.key === "actions" ? "min-w-28 sm:min-w-36 xl:min-w-40" : "min-w-20 sm:min-w-36 xl:min-w-40"} whitespace-nowrap px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-4 sm:py-3 xl:text-sm ${
                    column.key === "actions"
                      ? "sticky right-0 z-20 border-l border-gray-100 bg-gray-50 shadow-[-4px_0_8px_-5px_rgba(15,23,42,0.25)]"
                      : ""
                  }`}
                >
                  {column.sortKey && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.sortKey)}
                      className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-slate-800"
                      aria-label={`Sort by ${column.title}`}
                    >
                      {column.title}
                      {ordering === column.sortKey ? (
                        <LuArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : ordering === `-${column.sortKey}` ? (
                        <LuArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <LuArrowUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    column.title
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            className={`divide-y divide-gray-50 bg-white transition-opacity ${isFetching ? "opacity-60" : ""}`}
            aria-busy={isFetching}
          >
            {rows.length ? (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="odd:bg-white even:bg-slate-50 hover:bg-slate-100"
                >
                  {selection && (
                    <td className="w-12 px-4 py-3 text-center align-middle">
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 align-middle accent-[#ff6a00]"
                        checked={selection.selectedIds.includes(rowKey(row))}
                        onChange={() => selection.onToggle(rowKey(row))}
                        aria-label="Select row"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`${column.key === "actions" ? "min-w-28 sm:min-w-36 xl:min-w-40" : "min-w-20 sm:min-w-36 xl:min-w-40"} ${column.className || "px-4 py-3 text-slate-700"} max-sm:px-2 max-sm:py-2 ${
                        column.key === "actions"
                          ? "records-table-actions sticky right-0 z-10 border-l border-gray-100 bg-inherit shadow-[-4px_0_8px_-5px_rgba(15,23,42,0.25)]"
                          : ""
                      }`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + (selection ? 1 : 0)} className="px-4 py-20">
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {maxScroll > 1 && (
        <div className="border-t border-gray-100 bg-white py-0.5">
          <input
            type="range"
            min={0}
            max={Math.ceil(maxScroll)}
            value={Math.min(Math.round(scroll.left), Math.ceil(maxScroll))}
            onChange={(event) => {
              if (viewportRef.current) {
                viewportRef.current.scrollLeft = Number(event.target.value);
              }
            }}
            aria-label="Scroll table horizontally"
            className="records-table-scrollbar"
            style={{ "--thumb-width": `${thumbWidth}px` }}
          />
        </div>
      )}
      {footer && (
        <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          {footer}
        </div>
      )}
    </div>
  );
});

export default RecordsTable;
