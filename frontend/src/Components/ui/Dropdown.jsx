import { useEffect, useMemo, useRef, useState } from "react";
import { LuCheck, LuChevronRight } from "react-icons/lu";

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
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const normalizedOptions = useMemo(
    () => options.map(normalizeOption).filter((option) => option.value !== undefined),
    [options],
  );

  const selectedOption = useMemo(
    () => normalizedOptions.find((option) => option.value === value),
    [normalizedOptions, value],
  );

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSelect = (nextValue) => {
    onChange?.(nextValue);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        className={`flex h-11 w-full items-center justify-between rounded-xl border border-accent px-4 text-left transition hover:border-accentLight disabled:cursor-not-allowed disabled:opacity-60 ${buttonClassName}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        >
        <span className="flex min-w-0 items-center gap-3">
          {LeftIcon && <LeftIcon className="h-5 w-5 text-slate-400" />}
          <span
            className={`truncate text-base ${selectedOption ? "text-slate-700" : "text-slate-400"}`}
          >
            {selectedOption?.label || placeholder}
          </span>
        </span>

        <LuChevronRight
          className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-30 mt-2 rounded-xl border border-gray-200 bg-white p-3 shadow-[0_14px_28px_rgba(15,23,42,0.08)] ${menuClassName}`}
        >
          <ul role="listbox" aria-labelledby={id} className="space-y-2">
            {normalizedOptions.map((option) => {
              const isSelected = option.value === value;

              return (
                <li key={String(option.value)} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between rounded-lg px-4 py-2 text-left font-medium transition ${
                      isSelected
                        ? "bg-accent/15 text-slate-800"
                        : "text-slate-700 hover:bg-accent/10"
                    }`}
                    onClick={() => handleSelect(option.value)}
                  >
                    <span>{option.label}</span>
                    {isSelected && <LuCheck className="h-5 w-5 text-slate-500" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
