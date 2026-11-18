import { useEffect, useMemo, useRef, useState } from "react";
import { LuCheck, LuChevronRight, LuSearch } from "react-icons/lu";

function normalizeOption(option) {
  if (typeof option === "string") {
    return { value: option, label: option };
  }

  return {
    value: option?.value,
    label: option?.label ?? String(option?.value ?? ""),
  };
}

export default function Dropdown({
  id,
  value,
  options = [],
  onChange,
  placeholder = "Select option",
  leftIcon: LeftIcon,
  disabled = false,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  menuMaxHeight = "240px",
  textClassName = "text-base",
  searchable = true,
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const normalizedOptions = useMemo(
    () =>
      options
        .map(normalizeOption)
        .filter((option) => option.value !== undefined),
    [options],
  );

  const selectedOption = useMemo(
    () => normalizedOptions.find((option) => option.value === value),
    [normalizedOptions, value],
  );

  // Typing filters by label; every word must appear, in any order.
  const visibleOptions = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return normalizedOptions;
    return normalizedOptions.filter((option) => {
      const label = String(option.label).toLowerCase();
      return terms.every((term) => label.includes(term));
    });
  }, [normalizedOptions, query]);

  const open = () => {
    setQuery("");
    const selectedIndex = normalizedOptions.findIndex((option) => option.value === value);
    setActiveIndex(Math.max(selectedIndex, 0));
    setIsOpen(true);
  };

  const close = (refocus = false) => {
    setIsOpen(false);
    setQuery("");
    if (refocus) buttonRef.current?.focus();
  };

  useEffect(() => {
    if (isOpen && searchable) searchRef.current?.focus();
  }, [isOpen, searchable]);

  // Keep the highlighted option scrolled into view.
  useEffect(() => {
    if (!isOpen) return;
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, isOpen]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
        setQuery("");
      }
    };

    const handleEscape = (event) => {
      if (
        event.key === "Escape" &&
        isOpen &&
        wrapperRef.current?.contains(document.activeElement)
      ) {
        setIsOpen(false);
        setQuery("");
        buttonRef.current?.focus();
      }
    };

    // pointerdown, not mousedown: iOS Safari skips mouse events for taps on
    // non-clickable areas, so taps outside the menu would never close it.
    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (nextValue) => {
    onChange?.(nextValue);
    close(true);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, visibleOptions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = visibleOptions[activeIndex];
      if (option) handleSelect(option.value);
    } else if (event.key === "Tab") {
      close();
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative ${className}`}
      onBlur={(event) => {
        // Safari doesn't focus tapped buttons, so tapping an option blurs the
        // toggle with no relatedTarget; closing then would unmount the option
        // before its click lands. Taps outside are handled by pointerdown.
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget)
        ) {
          close();
        }
      }}
    >
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        tabIndex={0}
        className={`flex h-11 w-full items-center justify-between rounded-xl bg-white disabled:bg-[#FAFAFA] disabled:cursor-not-allowed! border border-gray-200 px-4 text-left transition hover:border-accentLight ${buttonClassName}`}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={(event) => {
          // Start typing on a closed dropdown to open it and search.
          if (!isOpen && searchable && event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
            event.preventDefault();
            open();
            setQuery(event.key);
          } else if (!isOpen && (event.key === "ArrowDown" || event.key === "Enter")) {
            event.preventDefault();
            open();
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex min-w-0 items-center gap-3">
          {LeftIcon && <LeftIcon className="h-5 w-5 text-slate-400" />}
          <span
            className={`truncate ${textClassName} ${selectedOption ? "text-slate-700" : "text-slate-400"}`}
          >
            {selectedOption?.label || placeholder}
          </span>
        </span>

        <LuChevronRight
          className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
        />
      </button>

      {required && (
        // Lets the form's own validation block submit until a value is picked.
        <input
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-4 h-px w-px opacity-0"
          value={value ?? ""}
          onChange={() => {}}
          onFocus={() => buttonRef.current?.focus()}
          required
        />
      )}

      {isOpen && searchable && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
          <div className="pointer-events-auto relative h-full">
            <LuSearch
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={selectedOption?.label || "Search..."}
              aria-label="Search options"
              aria-controls={id ? `${id}-listbox` : undefined}
              aria-activedescendant={
                visibleOptions[activeIndex] && id ? `${id}-option-${activeIndex}` : undefined
              }
              className={`box-border h-full w-full min-w-0 rounded-xl border border-accentLight bg-white pl-10 pr-10 text-slate-700 outline-none ring-2 ring-accent/20 placeholder:text-slate-400 ${textClassName}`}
              autoComplete="off"
            />
            <LuChevronRight
              className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 rotate-90 text-slate-400"
              aria-hidden="true"
            />
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-30 mt-2 rounded-xl border border-gray-200 bg-white p-3 shadow-[0_14px_28px_rgba(15,23,42,0.08)] ${menuClassName}`}
          style={{ maxHeight: menuMaxHeight, overflow: "auto" }}
        >
          <ul
            ref={listRef}
            id={id ? `${id}-listbox` : undefined}
            role="listbox"
            aria-labelledby={id}
            className="space-y-2"
          >
            {visibleOptions.length === 0 ? (
              <li className="rounded-lg px-4 py-2 text-sm text-slate-400">
                {query ? `No matches for “${query}”` : "No Option to Show"}
              </li>
            ) : (
              visibleOptions.map((option, index) => {
                const isSelected = option.value === value;
                const isActive = searchable && index === activeIndex;

                return (
                  <li
                    key={String(option.value)}
                    id={id ? `${id}-option-${index}` : undefined}
                    data-index={index}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <button
                      type="button"
                      tabIndex={searchable ? -1 : 0}
                      className={`flex w-full items-center justify-between rounded-lg px-4 py-2 text-left font-medium transition ${
                        isSelected
                          ? "bg-accent/15 text-slate-800"
                          : isActive
                            ? "bg-accent/10 text-slate-800"
                            : "text-slate-700 hover:bg-accent/10"
                      }`}
                      onMouseEnter={() => searchable && setActiveIndex(index)}
                      onClick={() => handleSelect(option.value)}
                    >
                      <span>{option.label}</span>
                      {isSelected && (
                        <LuCheck className="h-5 w-5 text-slate-500" />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
