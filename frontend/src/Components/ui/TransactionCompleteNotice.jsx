export default function TransactionCompleteNotice({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="transaction-complete-message"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <p id="transaction-complete-message" className="text-lg font-semibold text-slate-900">
          {message}
        </p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accentLight"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
