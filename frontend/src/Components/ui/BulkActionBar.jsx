import { useEffect, useState } from "react";
import { LuX } from "react-icons/lu";

const TONES = {
  default:
    "border-gray-200 bg-white text-slate-700 hover:border-gray-300 hover:bg-gray-50",
  primary: "border-accent bg-accent text-white hover:bg-accentLight",
  danger: "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100",
};

// Selected-rows toolbar. Each action is confirmed in a prompt, then the
// per-row results from the bulk endpoint are shown before closing.
export default function BulkActionBar({ selectedCount, actions, onRun, onClear }) {
  const [pending, setPending] = useState(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!pending) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !running) close();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  if (!selectedCount && !pending) return null;

  const close = () => {
    setPending(null);
    setResult(null);
  };

  const confirm = async () => {
    setRunning(true);
    try {
      setResult(await onRun(pending.key));
    } catch (err) {
      setResult({
        error:
          err?.data?.detail ||
          err?.data?.action ||
          err?.data?.ids ||
          "The action could not be run. Please try again.",
      });
    } finally {
      setRunning(false);
    }
  };

  const failures = result?.results?.filter((row) => !row.ok) || [];

  return (
    <>
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-accent/20 bg-accent/5 px-6 py-3 text-sm">
          <span className="font-semibold text-slate-800">
            {selectedCount} selected
          </span>
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => setPending(action)}
              className={`inline-flex h-9 items-center rounded-xl border px-3 font-semibold transition ${TONES[action.tone || "default"]}`}
            >
              {action.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onClear}
            className="ml-auto text-slate-500 underline hover:text-slate-800"
          >
            Clear selection
          </button>
        </div>
      )}

      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-label={pending.label}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h5 className="text-xl font-medium text-gray-900">
                {pending.label}
              </h5>
              <button
                type="button"
                className="rounded-full p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                onClick={close}
                disabled={running}
                aria-label="Close"
              >
                <LuX className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-4 text-sm text-gray-700">
              {!result && (
                <p>
                  {pending.confirmMessage
                    ? pending.confirmMessage(selectedCount)
                    : `Apply "${pending.label}" to ${selectedCount} selected rows?`}
                </p>
              )}
              {result?.error && (
                <p role="alert" className="text-rose-700">
                  {String(result.error)}
                </p>
              )}
              {result && !result.error && (
                <div role="status" className="space-y-2">
                  <p>
                    <span className="font-semibold text-emerald-700">
                      {result.succeeded} succeeded
                    </span>
                    {result.failed > 0 && (
                      <span className="font-semibold text-rose-700">
                        {" "}
                        · {result.failed} failed
                      </span>
                    )}
                  </p>
                  {failures.length > 0 && (
                    <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg bg-rose-50 p-3 text-rose-700">
                      {failures.map((row) => (
                        <li key={row.id}>
                          {pending.describeRow
                            ? pending.describeRow(row.id)
                            : `#${row.id}`}
                          : {row.detail || "Failed."}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-5 py-4">
              {result ? (
                <button
                  type="button"
                  className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accentLight"
                  onClick={close}
                >
                  Done
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    onClick={close}
                    disabled={running}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${TONES[pending.tone === "danger" ? "danger" : "primary"]}`}
                    onClick={confirm}
                    disabled={running}
                  >
                    {running && (
                      <span
                        className="h-4 w-4 animate-spin rounded-full border-2 border-current/40 border-t-current"
                        aria-hidden="true"
                      />
                    )}
                    {pending.confirmLabel || pending.label}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
