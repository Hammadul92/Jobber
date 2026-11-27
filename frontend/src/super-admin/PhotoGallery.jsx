import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LuChevronLeft, LuChevronRight, LuImage, LuX } from "react-icons/lu";
import { RecordActionButtons, iconButtonClass } from "./RecordActions";

const imageUrl = (photo) => `/api/super-admin/media/photos/${photo.id}/photo/`;

function Photo({ photo, className }) {
  const [failed, setFailed] = useState(false);
  if (!photo.photo || failed)
    return (
      <span
        className={`${className} flex items-center justify-center gap-2 bg-slate-50 text-sm text-slate-500`}
      >
        <LuImage className="h-5 w-5" /> Photo unavailable
      </span>
    );
  return (
    <img
      src={imageUrl(photo)}
      alt={photo._label}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function PhotoGallery({ rows, value, onAction }) {
  const dialog = useRef(null);
  const [selected, setSelected] = useState(null);
  const photo = rows[selected];
  useEffect(() => {
    if (selected !== null) dialog.current?.showModal();
  }, [selected]);
  const move = (step) =>
    setSelected((index) => (index + step + rows.length) % rows.length);
  return (
    <>
      <div
        className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 md:p-6"
        aria-label="Job photo gallery"
      >
        {rows.map((item, index) => (
          <article
            key={item.id}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <button
              type="button"
              className="block w-full cursor-zoom-in focus-visible:outline-accent"
              aria-label={`Preview ${item._label}`}
              onClick={() => setSelected(index)}
            >
              <Photo photo={item} className="h-52 w-full object-cover" />
            </button>
            <div className="space-y-2 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {item.photo_type === "BEFORE" ? "Before" : "After"}
                  </span>
                  {item.is_deleted && (
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-700">
                      Deleted
                    </span>
                  )}
                </div>
                <time
                  dateTime={item.uploaded_at}
                  className="min-w-0 text-right text-sm text-slate-500"
                >
                  {value(item.uploaded_at)}
                </time>
              </div>
              <Link
                to={`/super-admin/jobs/${item._relations.job.id}`}
                className="block font-medium text-primary hover:text-accent break-words"
              >
                {item._relations.job.label}
              </Link>
              <Link
                to={`/super-admin/photos/${item.id}`}
                className="inline-block text-sm font-medium text-accent"
              >
                View photo details
              </Link>
              <RecordActionButtons
                resource="photos"
                row={item}
                onAction={onAction}
              />
            </div>
          </article>
        ))}
        {!rows.length && (
          <p className="py-12 text-center text-sm text-slate-500 sm:col-span-2 xl:col-span-3">
            No matching photos. Try clearing your filters.
          </p>
        )}
      </div>
      <dialog
        ref={dialog}
        aria-labelledby="photo-preview-title"
        onClose={() => setSelected(null)}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current.close();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            move(-1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            move(1);
          }
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-5xl max-h-[90dvh] rounded-2xl bg-white p-4 shadow-2xl backdrop:bg-black/60 md:p-6"
      >
        {photo && (
          <>
            <header className="mb-4 flex items-center justify-between gap-4">
              <h2
                id="photo-preview-title"
                className="text-lg font-semibold text-slate-900"
              >
                {photo._label}
              </h2>
              <button
                autoFocus
                type="button"
                aria-label="Close photo preview"
                className={iconButtonClass}
                onClick={() => dialog.current.close()}
              >
                <LuX className="h-5 w-5" />
              </button>
            </header>
            <Photo
              key={photo.id}
              photo={photo}
              className="h-[55dvh] w-full rounded-xl bg-slate-50 object-contain"
            />
            <footer className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                {value(photo.uploaded_at)} · {selected + 1} of {rows.length}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={rows.length < 2}
                  aria-label="Previous photo"
                  className={iconButtonClass}
                  onClick={() => move(-1)}
                >
                  <LuChevronLeft />
                </button>
                <button
                  type="button"
                  disabled={rows.length < 2}
                  aria-label="Next photo"
                  className={iconButtonClass}
                  onClick={() => move(1)}
                >
                  <LuChevronRight />
                </button>
              </div>
            </footer>
          </>
        )}
      </dialog>
    </>
  );
}
