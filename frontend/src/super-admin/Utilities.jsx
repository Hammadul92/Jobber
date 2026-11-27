import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { label } from "./navigation";
import { LuSearch, LuChevronDown, LuColumns3 } from "react-icons/lu";
import Input from "../Components/ui/Input";
import SubmitButton from "../Components/ui/SubmitButton";
import { toolbarButtonClass } from "../Components/ui/TableToolbar";
export function GlobalSearch({ api }) {
  const [query, setQuery] = useState(""),
    [results, setResults] = useState([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [position, setPosition] = useState({ left: 16, top: 80, width: 384 }),
    [open, setOpen] = useState(false);
  const input = useRef(null),
    container = useRef(null),
    panel = useRef(null),
    trigger = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        input.current?.focus();
      }
      if (e.key === "Escape" && panel.current) {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    const outside = (e) => {
      if (
        !container.current?.contains(e.target) &&
        !panel.current?.contains(e.target)
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", handler);
      document.removeEventListener("pointerdown", outside);
    };
  }, []);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = trigger.current.getBoundingClientRect();
      const width = Math.min(384, window.innerWidth - 32);
      const top = Math.max(
        16,
        Math.min(rect.bottom + 8, window.innerHeight - 120),
      );
      setPosition({
        width,
        top,
        left: Math.max(
          16,
          Math.min(rect.right - width, window.innerWidth - width - 16),
        ),
      });
    };
    place();
    input.current?.focus();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);
  useEffect(() => {
    let active = true;
    setResults([]);
    setError("");
    setLoading(query.trim().length >= 2);
    const timer = setTimeout(() => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      api(`search/?q=${encodeURIComponent(query.trim())}`)
        .then((d) => {
          if (active) {
            setResults(d.results);
            setError("");
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, api]);
  return (
    <div ref={container} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-label="Search platform"
        aria-controls="platform-search-panel"
        title="Search platform (Ctrl/⌘ K)"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition hover:bg-gray-100 hover:text-slate-700"
      >
        <LuSearch className="h-6 w-6" />
      </button>
      {open &&
        createPortal(
          <div
            ref={panel}
            id="platform-search-panel"
            role="dialog"
            aria-label="Search platform records"
            style={{
              ...position,
              maxHeight: `calc(100dvh - ${position.top + 16}px)`,
            }}
            className="fixed z-[70] max-w-none! overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-lg"
          >
            <label className="sr-only" htmlFor="platform-search">
              Search all platform records
            </label>
            <div className="relative">
              <LuSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={input}
                id="platform-search"
                type="search"
                className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Search names, emails, or records…"
                autoComplete="off"
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    panel.current?.querySelector("a")?.focus();
                  }
                }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div
              aria-live="polite"
              className="mt-3 max-h-72 overflow-y-auto text-sm text-slate-500"
            >
              {query.trim().length < 2
                ? "Enter at least two characters."
                : loading
                  ? "Searching…"
                  : error ||
                    (!results.length
                      ? "No matching records."
                      : results.map((r) => (
                          <Link
                            key={`${r.resource}-${r.id}`}
                            onKeyDown={(event) => {
                              if (!["ArrowDown", "ArrowUp"].includes(event.key))
                                return;
                              event.preventDefault();
                              const links = [
                                ...panel.current.querySelectorAll("a"),
                              ];
                              const index = links.indexOf(event.currentTarget);
                              const next =
                                index + (event.key === "ArrowDown" ? 1 : -1);
                              if (next < 0) input.current?.focus();
                              else links[next % links.length]?.focus();
                            }}
                            onClick={() => {
                              setQuery("");
                              setOpen(false);
                            }}
                            to={`/super-admin/${r.resource}/${r.id}`}
                            className="block rounded-xl px-3 py-2 text-slate-700 break-words [overflow-wrap:anywhere] hover:bg-slate-50 hover:text-accent focus-visible:outline-accent"
                          >
                            {r.label}
                            <span className="block text-xs text-slate-400">
                              {label(r.resource)}
                            </span>
                          </Link>
                        )))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
export function ViewControls({
  resource,
  fields,
  params,
  setParams,
  visible,
  setVisible,
}) {
  const storage = `super-admin-views-${resource}`;
  const [views, setViews] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem(storage) || "[]");
      } catch {
        return [];
      }
    }),
    [name, setName] = useState("");
  return (
    <details className="py-3">
      <summary className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800">
        <LuColumns3 className="h-4 w-4" />
        Columns & Saved Views
        <LuChevronDown className="h-4 w-4" />
      </summary>
      <div className="mt-3 rounded-2xl border border-gray-200 bg-slate-50 p-4">
        <fieldset className="flex flex-wrap gap-x-5 gap-y-3">
          <legend className="sr-only">Visible columns</legend>
          {fields.map((f) => (
            <label
              key={f.name}
              className="inline-flex items-center gap-2 text-sm text-slate-600"
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 accent-[#ff7a00]"
                checked={f.primary || visible.includes(f.name)}
                disabled={f.primary}
                onChange={(e) =>
                  setVisible(
                    e.target.checked
                      ? [...visible, f.name]
                      : visible.filter((n) => n !== f.name),
                  )
                }
              />
              {f.label}
            </label>
          ))}
        </fieldset>
        <form
          className="mt-5 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const next = [
              ...views.filter((v) => v.name !== name),
              { name, query: params.toString(), columns: visible },
            ];
            setViews(next);
            localStorage.setItem(storage, JSON.stringify(next));
            setName("");
          }}
        >
          <div className="min-w-0 flex-1 [&>div]:mb-0">
            <Input
              id="saved-view-name"
              label="Saved view name"
              value={name}
              onChange={setName}
              isRequired
              fieldClass="h-10! py-2! text-sm!"
            />
          </div>
          <SubmitButton
            btnName="Save View"
            btnClass="h-10 bg-accent px-4 text-sm text-white shadow-sm hover:bg-accentLight"
          />
        </form>
        <div className="flex flex-wrap gap-2 mt-3">
          {views.map((v) => (
            <button
              key={v.name}
              type="button"
              className={toolbarButtonClass}
              onClick={() => {
                setParams(v.query);
                setVisible(v.columns);
              }}
            >
              {v.name}
            </button>
          ))}
        </div>
      </div>
    </details>
  );
}
