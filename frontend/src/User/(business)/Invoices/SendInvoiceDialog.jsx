import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LuCreditCard, LuLandmark, LuPaperclip } from "react-icons/lu";

// Lets the manager choose how the client pays before the invoice is emailed:
// a secure online payment link, or Interac e-Transfer instructions.
export default function SendInvoiceDialog({
  open,
  invoiceNumber,
  clientName,
  defaultOption = "PAYMENT_LINK",
  etransferEmail,
  isResend = false,
  isLoading = false,
  onSend,
  onCancel,
}) {
  const cancelButtonRef = useRef(null);
  const hasEtransfer = Boolean(etransferEmail);
  const [option, setOption] = useState(defaultOption);

  // Pick the starting option and focus only when the dialog opens, so parent
  // re-renders (refetches, alerts) never reset the manager's choice.
  useEffect(() => {
    if (!open) return;
    setOption(defaultOption === "ETRANSFER" && !hasEtransfer ? "PAYMENT_LINK" : defaultOption);
    cancelButtonRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isLoading) onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, isLoading, onCancel]);

  if (!open) return null;

  const options = [
    {
      value: "PAYMENT_LINK",
      icon: LuCreditCard,
      title: "Send with payment link",
      description: "The email includes a secure link so the client can view and pay by card online.",
    },
    {
      value: "ETRANSFER",
      icon: LuLandmark,
      title: "Send with e-Transfer details",
      description: hasEtransfer ? (
        <>
          The email asks the client to send an Interac e-Transfer to{" "}
          <span className="font-semibold text-slate-700">{etransferEmail}</span>. No payment link is included.
        </>
      ) : (
        <>
          Add your e-Transfer email in{" "}
          <Link to="/user/banking" className="font-semibold text-secondary underline hover:text-accent">
            Banking
          </Link>{" "}
          to use this option.
        </>
      ),
      disabled: !hasEtransfer,
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-invoice-title"
        className="shrink-0 rounded-2xl bg-white p-6 shadow-2xl"
        style={{ width: "min(32rem, calc(100vw - 2rem))", maxWidth: "32rem" }}
      >
        <h2 id="send-invoice-title" className="text-xl font-semibold text-slate-900">
          {isResend ? "Resend invoice" : "Send invoice"}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Choose how {clientName || "the customer"} should pay invoice {invoiceNumber}.
        </p>

        <fieldset className="mt-5 space-y-3">
          <legend className="sr-only">Payment option</legend>
          {options.map(({ value, icon, title, description, disabled }) => {
            const Icon = icon;
            const selected = option === value;
            return (
              <label
                key={value}
                className={`flex gap-3 rounded-xl border p-4 transition has-focus-visible:ring-2 has-focus-visible:ring-accent ${
                  disabled
                    ? "cursor-not-allowed border-gray-200 bg-gray-50"
                    : selected
                      ? "cursor-pointer border-secondary bg-secondary/5 ring-1 ring-secondary"
                      : "cursor-pointer border-gray-200 hover:border-secondary/50"
                }`}
              >
                <input
                  type="radio"
                  name="payment_option"
                  value={value}
                  checked={selected}
                  disabled={disabled || isLoading}
                  onChange={() => setOption(value)}
                  className="sr-only"
                />
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    selected ? "bg-secondary text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-semibold ${disabled ? "text-slate-400" : "text-slate-900"}`}>
                    {title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
                </span>
                <span
                  aria-hidden="true"
                  className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${
                    selected ? "border-secondary bg-secondary shadow-[inset_0_0_0_2px_white]" : "border-gray-300"
                  }`}
                />
              </label>
            );
          })}
        </fieldset>

        <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <LuPaperclip className="h-3.5 w-3.5" />
          A PDF copy of the invoice is attached to the email.
        </p>

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
            onClick={() => onSend(option)}
            disabled={isLoading || (option === "ETRANSFER" && !hasEtransfer)}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accentLight disabled:opacity-60"
          >
            {isLoading ? "Sending..." : isResend ? "Resend Invoice" : "Send Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
