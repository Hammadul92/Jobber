import { useEffect, useLayoutEffect, useRef, useState } from "react";
import RichTextContent from "./RichTextContent";

// A long field shown as a clipped preview; clicking it opens the full text in
// a modal. Pass `html` for read-only rich text, or `value` for plain text.
// With `onChange` and isEditable, the modal holds a textarea for editing; the
// value stays in the caller's state, so the page's own Save keeps it.
export default function ExpandableField({
  id,
  label,
  html,
  value,
  onChange,
  isEditable = false,
  emptyText = "Nothing added.",
  placeholder,
  maxLength,
}) {
  const [open, setOpen] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const previewRef = useRef(null);
  const closeButtonRef = useRef(null);
  const isRich = html !== undefined;
  const editable = isEditable && !isRich && typeof onChange === "function";
  const isEmpty = isRich ? !html || html === "<p><br></p>" : !value?.trim();

  useLayoutEffect(() => {
    const el = previewRef.current;
    if (el) setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [html, value]);

  // Focus moves into the modal only when it opens, not on every keystroke.
  useEffect(() => {
    if (open && !editable) closeButtonRef.current?.focus();
  }, [open, editable]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const canOpen = editable || overflowing;
  const openModal = () => canOpen && setOpen(true);
  const actionLabel = editable ? (isEmpty ? "Add" : "Edit") : "View full";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <span id={`${id}-label`} className="block text-sm font-semibold uppercase text-gray-500">
          {label}
        </span>
        {canOpen && (
          <button
            type="button"
            onClick={openModal}
            className="text-sm font-semibold text-accent hover:underline"
          >
            {actionLabel}
          </button>
        )}
      </div>

      <div
        id={id}
        role={canOpen ? "button" : undefined}
        tabIndex={canOpen ? 0 : undefined}
        aria-labelledby={`${id}-label`}
        onClick={openModal}
        onKeyDown={(event) => {
          if (canOpen && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            openModal();
          }
        }}
        className={`relative rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-slate-700 ${
          canOpen ? "cursor-pointer transition hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent/30" : ""
        }`}
      >
        <div ref={previewRef} className="max-h-28 overflow-hidden">
          {isRich ? (
            <RichTextContent html={html} emptyText={emptyText} />
          ) : isEmpty ? (
            <p className="text-slate-500">{emptyText}</p>
          ) : (
            <p className="whitespace-pre-wrap break-words">{value}</p>
          )}
        </div>
        {overflowing && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 rounded-b-lg bg-gradient-to-t from-gray-50 to-transparent" />
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-modal-title`}
            className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id={`${id}-modal-title`} className="border-b border-gray-100 px-6 py-4 text-xl font-semibold text-slate-900">
              {label}
            </h2>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 text-sm text-slate-700">
              {isRich ? (
                <RichTextContent html={html} emptyText={emptyText} />
              ) : editable ? (
                <textarea
                  autoFocus
                  aria-labelledby={`${id}-modal-title`}
                  value={value}
                  onChange={(event) => onChange(event.target.value)}
                  maxLength={maxLength}
                  placeholder={placeholder || label}
                  rows={14}
                  className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              ) : isEmpty ? (
                <p className="text-slate-500">{emptyText}</p>
              ) : (
                <p className="whitespace-pre-wrap break-words">{value}</p>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
              <p className="text-xs text-slate-500">
                {editable ? "Save Changes on the page to keep your edits." : ""}
              </p>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-gray-50"
              >
                {editable ? "Done" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
