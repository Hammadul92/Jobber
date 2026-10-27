import { useEffect, useRef } from "react";

export default function ConfirmCustomerNotification({
  open,
  detail,
  onYes,
  onNo,
  isLoading = false,
}) {
  const noButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    noButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isLoading) onNo();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, isLoading, onNo]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4" role="presentation">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="customer-notification-title"
        aria-describedby="customer-notification-detail"
        className="shrink-0 rounded-2xl bg-white p-6 shadow-2xl"
        style={{ width: "min(28rem, calc(100vw - 2rem))", maxWidth: "28rem" }}
      >
        <h2 id="customer-notification-title" className="text-xl font-semibold text-slate-900">
          Send customer notification?
        </h2>
        <p id="customer-notification-detail" className="mt-3 text-sm text-slate-700">
          Are you sure you would like to proceed and send customer notification?
          {detail && <span className="mt-2 block text-slate-500">{detail}</span>}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={noButtonRef}
            type="button"
            onClick={onNo}
            disabled={isLoading}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-gray-50 disabled:opacity-60"
          >
            No
          </button>
          <button
            type="button"
            onClick={onYes}
            disabled={isLoading}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accentLight disabled:opacity-60"
          >
            {isLoading ? "Sending..." : "Yes"}
          </button>
        </div>
      </div>
    </div>
  );
}
