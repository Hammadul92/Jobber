import { useEffect } from "react";
import { LuX } from "react-icons/lu";

export default function QuoteSectionPopup({
  open,
  title,
  children,
  onClose,
  widthClass = "max-w-2xl md:w-1/2 lg:w-4/7",
}) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : undefined}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`flex w-full max-h-[90dvh] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] ${widthClass}`}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="min-w-0">
            <h5 className="break-words text-2xl font-semibold tracking-tight text-slate-900">
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
