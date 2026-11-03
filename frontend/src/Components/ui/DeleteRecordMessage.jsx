const MAX_LISTED = 10;

// Body of a delete prompt: names exactly which record (or records) will be
// deleted, what goes with it, and that it can be restored from Trash.
// Pass `name` (+ optional `detail`) for one record, or `names` for a bulk
// delete. `kind` is the singular noun ("client"); `kindPlural` defaults to
// kind + "s".
export default function DeleteRecordMessage({
  kind,
  kindPlural = `${kind}s`,
  name,
  detail,
  names,
  alsoDeletes,
  note,
}) {
  const labels = names || [name];
  const many = labels.length > 1;
  const shown = labels.slice(0, MAX_LISTED);
  const hidden = labels.length - shown.length;

  return (
    <div className="space-y-3">
      <p>
        {many
          ? `These ${labels.length} ${kindPlural} will be deleted:`
          : `This ${kind} will be deleted:`}
      </p>
      <div className="rounded-xl border border-rose-100 bg-rose-50/60 px-3 py-2">
        {many ? (
          <ul className="max-h-48 list-disc space-y-0.5 overflow-y-auto pl-5 font-semibold text-slate-900">
            {shown.map((label, index) => (
              <li key={`${label}-${index}`} className="break-words">
                {label}
              </li>
            ))}
            {hidden > 0 && (
              <li className="list-none font-normal text-slate-600">
                and {hidden} more
              </li>
            )}
          </ul>
        ) : (
          <>
            <p className="break-words font-semibold text-slate-900">
              {labels[0]}
            </p>
            {detail && <p className="break-words text-slate-600">{detail}</p>}
          </>
        )}
      </div>
      {alsoDeletes && <p>{alsoDeletes}</p>}
      {note && <p>{note}</p>}
      <p className="text-slate-500">
        {many ? "They move" : "It moves"} to Trash, where you can restore{" "}
        {many ? "them" : "it"} at any time.
      </p>
    </div>
  );
}
