import { useLayoutEffect, useRef, useState } from "react";
import { LuX } from "react-icons/lu";
import { iconButtonClass } from "./RecordActions";

export default function TableText({ text, label }) {
  const preview = useRef(null);
  const dialog = useRef(null);
  const [overflowing, setOverflowing] = useState(false);
  useLayoutEffect(() => {
    const element = preview.current;
    const measure = () =>
      setOverflowing(element.scrollHeight > element.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text]);
  return (
    <div>
      <div
        ref={preview}
        className="line-clamp-3 whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
      >
        {text}
      </div>
      {overflowing && (
        <button
          type="button"
          className="mt-1 text-sm font-medium text-accent hover:underline"
          aria-label={`View full ${label}`}
          onClick={() => dialog.current.showModal()}
        >
          View full
        </button>
      )}
      <dialog
        ref={dialog}
        aria-label={label}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current.close();
        }}
        className="m-auto max-h-[85dvh] w-[calc(100vw-2rem)] max-w-2xl rounded-2xl bg-white p-6 shadow-2xl backdrop:bg-black/50"
      >
        <header className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-900">{label}</h2>
          <button
            type="button"
            autoFocus
            aria-label="Close full text"
            className={iconButtonClass}
            onClick={() => dialog.current.close()}
          >
            <LuX className="h-5 w-5" />
          </button>
        </header>
        <p className="whitespace-pre-wrap break-words text-sm text-slate-700 [overflow-wrap:anywhere]">
          {text}
        </p>
      </dialog>
    </div>
  );
}
