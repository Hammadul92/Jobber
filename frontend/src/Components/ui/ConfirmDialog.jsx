import { useEffect, useRef } from "react";

// Yes/no prompt for destructive actions (deleting a record, removing an item
// from a form). Cancel is focused first and Escape cancels; while isLoading the
// buttons are disabled and the confirm button shows loadingLabel.
export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Remove",
  loadingLabel = "Deleting...",
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    cancelButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isLoading) onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, isLoading, onCancel]);

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
          <div id="confirm-dialog-message" className="mt-3 text-sm text-slate-700">
            {message}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-60"
          >
            {isLoading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
