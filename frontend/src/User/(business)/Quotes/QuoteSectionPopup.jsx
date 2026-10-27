import { LuX } from "react-icons/lu";

export default function QuoteSectionPopup({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex w-full max-h-[90dvh] max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] md:w-1/2 lg:w-4/7">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h5 className="text-2xl font-semibold tracking-tight text-slate-900">
              {title}
            </h5>
          </div>

          <button
            type="button"
            className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            onClick={onClose}
            aria-label="Close"
          >
            <LuX className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto overscroll-contain px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
