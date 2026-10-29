import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuChevronRight,
  LuCircleAlert,
  LuCircleCheck,
  LuClock3,
  LuListTodo,
  LuX,
} from "react-icons/lu";
import { useFetchDashboardTodosQuery } from "../store";

const EMPTY_TODOS = [];

export default function DashboardTodos({ token, user, business }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const isManager = user?.role === "MANAGER";
  const shouldSkip = !token || !isManager || !business?.id;

  // The server builds the list over every record; `count` can exceed the
  // items it returns.
  const { data, isFetching } = useFetchDashboardTodosQuery(undefined, {
    skip: shouldSkip,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const todos = shouldSkip ? EMPTY_TODOS : data?.items || EMPTY_TODOS;
  const todoCount = shouldSkip ? 0 : data?.count ?? todos.length;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (containerRef.current?.contains(event.target)) return;
      setIsOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!isManager) return null;

  return (
    <div
      ref={containerRef}
      className="fixed bottom-5 right-5 z-10 flex flex-col items-end md:bottom-7 md:right-7"
    >
      {isOpen && (
        <div className="mb-4 w-[calc(100vw-2.5rem)] max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 sm:w-[28rem]">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-500">
                Todos
              </p>
              <h2 className="text-xl font-bold text-slate-950">
                Pending Tasks
              </h2>
              <p className="text-sm text-slate-500">
                {todoCount
                  ? `${todoCount} item${todoCount === 1 ? "" : "s"} need attention`
                  : "Everything is caught up"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
              aria-label="Close todos"
            >
              <LuX className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[min(28rem,calc(100vh-12rem))] overflow-y-auto px-3 py-3">
            {isFetching && !todos.length ? (
              <div className="flex min-h-36 items-center justify-center">
                <div className="grid grid-cols-2 gap-1.5">
                  {[0, 1, 2, 3].map((item) => (
                    <span
                      key={item}
                      className="h-3 w-3 animate-pulse rounded bg-orange-500"
                      style={{ animationDelay: `${item * 120}ms` }}
                    />
                  ))}
                </div>
              </div>
            ) : todos.length ? (
              <div className="space-y-2">
                {todos.map((todo) => (
                  <Link
                    key={todo.id}
                    to={todo.to}
                    onClick={() => setIsOpen(false)}
                    className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 transition hover:border-orange-200 hover:bg-orange-50"
                  >
                    <span
                      className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        todo.priority === "high"
                          ? "bg-orange-100 text-orange-600"
                          : "bg-white text-slate-500"
                      }`}
                    >
                      {todo.priority === "high" ? (
                        <LuCircleAlert className="h-4 w-4" />
                      ) : (
                        <LuClock3 className="h-4 w-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold text-slate-950">
                          {todo.title}
                        </span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          {todo.type}
                        </span>
                      </span>
                      <span className="mt-1 block text-sm leading-5 text-slate-600">
                        {todo.description}
                      </span>
                    </span>
                    <LuChevronRight className="mt-2 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-orange-500" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex min-h-44 flex-col items-center justify-center px-5 text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                  <LuCircleCheck className="h-6 w-6" />
                </span>
                <p className="text-base font-bold text-slate-950">
                  No pending tasks
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  New todos will appear here automatically when something needs
                  attention.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-xl shadow-orange-500/30 transition hover:-translate-y-0.5 hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-200"
        aria-label="Open todos"
        aria-expanded={isOpen}
      >
        <span className="pointer-events-none absolute right-full top-1/2 mr-3 inline-flex h-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950 px-8 text-sm font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
          Todos
        </span>
        <LuListTodo className="h-6 w-6" />
        {todoCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-slate-950 px-1.5 text-xs font-bold text-white">
            {todoCount > 99 ? "99+" : todoCount}
          </span>
        )}
      </button>
    </div>
  );
}
