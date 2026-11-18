// Checkbox list for choosing several team members (job assignees).
// `members` are team-member records; `value` is an array of their ids.
export default function MemberPicker({
  id,
  label = "Team members",
  members = [],
  value = [],
  onChange,
  isDisabled = false,
  emptyText = "No active team members yet.",
}) {
  const selected = new Set(value.map(String));
  const ids = members.map((member) => String(member.id));
  const allSelected = ids.length > 0 && ids.every((memberId) => selected.has(memberId));

  const toggle = (memberId) => {
    const next = new Set(selected);
    if (next.has(memberId)) next.delete(memberId);
    else next.add(memberId);
    onChange(ids.filter((item) => next.has(item)));
  };

  return (
    <fieldset id={id} className="mb-4" disabled={isDisabled}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <legend className="text-sm font-medium text-slate-700">{label}</legend>
        {!isDisabled && ids.length > 1 && (
          <button
            type="button"
            onClick={() => onChange(allSelected ? [] : ids)}
            className="text-xs font-semibold text-accent hover:underline"
          >
            {allSelected ? "Clear all" : "Select all"}
          </button>
        )}
      </div>
      {members.length ? (
        <div className="flex flex-wrap gap-2">
          {members.map((member) => {
            const memberId = String(member.id);
            const checked = selected.has(memberId);
            return (
              <label
                key={memberId}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                  checked
                    ? "border-accent bg-accent/10 font-semibold text-slate-900"
                    : "border-gray-200 bg-white text-slate-600 hover:bg-gray-50"
                } ${isDisabled ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#ff6a00]"
                  checked={checked}
                  onChange={() => toggle(memberId)}
                />
                {member.employee_name || member.name}
              </label>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500">{emptyText}</p>
      )}
    </fieldset>
  );
}
