import { useEffect, useRef } from "react";

// Small yes/no prompt for destructive actions such as removing an item from a
// form. Cancel is focused first and Escape cancels.
export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Remove",
  onConfirm,
  onCancel,
}) {
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    cancelButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4" role="presentation">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="shrink-0 rounded-2xl bg-white p-6 shadow-2xl"
        style={{ width: "min(28rem, calc(100vw - 2rem))", maxWidth: "28rem" }}
      >
        <h2 id="confirm-dialog-title" className="text-xl font-semibold text-slate-900">
          {title}
        </h2>
        {message && (
          <p id="confirm-dialog-message" className="mt-3 text-sm text-slate-700">
            {message}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
