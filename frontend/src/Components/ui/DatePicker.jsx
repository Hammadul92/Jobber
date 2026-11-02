import { useEffect, useRef, useState } from "react";
import { LuCalendar, LuChevronLeft, LuChevronRight } from "react-icons/lu";

// A date field with our own calendar popup in place of the browser's native
// picker. Values stay "YYYY-MM-DD" strings, like <input type="date">, so it
// drops in wherever a date input was used.

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const pad = (number) => String(number).padStart(2, "0");
const toIso = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`;

function parseIso(value) {
  if (!ISO_DATE.test(value || "")) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  // Rejects dates like 2026-02-31 that Date would roll into March.
  if (date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return { year, month: month - 1, day };
}

function todayIso() {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth(), now.getDate());
}

// Six full weeks starting on the Sunday on or before the 1st, so the grid
// never changes height between months.
function calendarDays(year, month) {
  const start = new Date(year, month, 1 - new Date(year, month, 1).getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + index,
    );
    return {
      iso: toIso(date.getFullYear(), date.getMonth(), date.getDate()),
      day: date.getDate(),
      inMonth: date.getMonth() === month,
    };
  });
}

const headerSelectClass =
  "cursor-pointer appearance-none rounded-md bg-transparent py-1 pl-1 pr-5 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/30";

export default function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  required = false,
  disabled = false,
  highlighted = false,
  placeholder = "yyyy-mm-dd",
  className = "",
  inputClassName = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [view, setView] = useState(() => {
    const date = parseIso(value) || parseIso(todayIso());
    return { year: date.year, month: date.month };
  });
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setDraft(value || "");
  }, [value]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.focus();
      }
    };

    // pointerdown for the same iOS Safari reason as Dropdown.
    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const isOutOfRange = (iso) => (min && iso < min) || (max && iso > max);

  const openCalendar = () => {
    if (disabled) return;
    const date = parseIso(value) || parseIso(todayIso());
    setView({ year: date.year, month: date.month });
    setIsOpen((open) => !open);
  };

  const selectDate = (iso) => {
    onChange?.(iso);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Typed dates commit once they parse; anything else reverts on blur.
  const commitDraft = () => {
    const text = draft.trim();
    if (text === "") {
      if (value) onChange?.("");
    } else if (parseIso(text) && !isOutOfRange(text)) {
      if (text !== value) onChange?.(text);
    } else {
      setDraft(value || "");
    }
  };

  const shiftMonth = (step) => {
    setView(({ year, month }) => {
      const date = new Date(year, month + step, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  };

  const today = todayIso();
  const minYear = Math.min(parseIso(min)?.year ?? view.year - 50, view.year);
  const maxYear = Math.max(parseIso(max)?.year ?? view.year + 50, view.year);
  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, index) => minYear + index,
  );

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="flex">
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          value={draft}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          pattern="\d{4}-\d{2}-\d{2}"
          autoComplete="off"
          onChange={(event) => {
            setDraft(event.target.value);
            const text = event.target.value.trim();
            if (parseIso(text) && !isOutOfRange(text)) onChange?.(text);
          }}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitDraft();
            } else if (event.key === "ArrowDown" && event.altKey) {
              event.preventDefault();
              openCalendar();
            }
          }}
          className={`h-10 w-full min-w-0 rounded-l-xl rounded-r-none border bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:z-10 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-[#FAFAFA] ${
            highlighted ? "border-accent/60 bg-orange-50/40" : "border-gray-200"
          } ${inputClassName}`}
        />
        <button
          type="button"
          onClick={openCalendar}
          disabled={disabled}
          aria-label="Choose date"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          className="-ml-px inline-flex shrink-0 items-center justify-center rounded-r-xl border border-gray-200 bg-slate-50 px-3 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:z-10 focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-[#FAFAFA]"
        >
          <LuCalendar className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Choose date"
          className="absolute left-0 z-50 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-[0_14px_28px_rgba(15,23,42,0.12)]"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <LuChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1">
              <div className="relative">
                <select
                  aria-label="Month"
                  value={view.month}
                  onChange={(event) =>
                    setView((current) => ({
                      ...current,
                      month: Number(event.target.value),
                    }))
                  }
                  className={headerSelectClass}
                >
                  {MONTHS.map((label, index) => (
                    <option key={label} value={index}>
                      {label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-700">
                  ▼
                </span>
              </div>
              <div className="relative">
                <select
                  aria-label="Year"
                  value={view.year}
                  onChange={(event) =>
                    setView((current) => ({
                      ...current,
                      year: Number(event.target.value),
                    }))
                  }
                  className={headerSelectClass}
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-700">
                  ▼
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <LuChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center">
            {WEEKDAYS.map((weekday) => (
              <span
                key={weekday}
                className="py-1 text-xs font-semibold text-slate-500"
              >
                {weekday}
              </span>
            ))}

            {calendarDays(view.year, view.month).map(({ iso, day, inMonth }) => {
              const isSelected = iso === value;
              const isToday = iso === today;
              const isDisabled = isOutOfRange(iso);

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => selectDate(iso)}
                  aria-pressed={isSelected}
                  aria-label={iso}
                  className={`mx-auto my-0.5 inline-flex h-9 w-9 items-center justify-center rounded-md text-sm transition disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent ${
                    isSelected
                      ? "bg-accent font-semibold text-white"
                      : `${inMonth ? "text-slate-800" : "text-slate-400"} hover:bg-accent/10 ${
                          isToday ? "font-semibold ring-1 ring-inset ring-accent" : ""
                        }`
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
