export default function ServiceItemsEditor({ items, onChange, currency = "CAD", disabled = false }) {
  const update = (index, field, value) => {
    onChange(items.map((item, position) => position === index ? { ...item, [field]: value } : item));
  };
  const total = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  return (
    <section className="space-y-3" aria-label="Service items">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Service items <span className="font-normal text-slate-500">(optional)</span></h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">Add separately priced work. With no items, the service description and price form one line.</p>
        </div>
        <button type="button" disabled={disabled} onClick={() => onChange([...items, { title: "", description: "", price: "" }])}
          className="shrink-0 rounded-lg border border-accent px-3 py-2 text-xs font-semibold text-accent hover:bg-orange-50 disabled:opacity-50">
          + Add item
        </button>
      </div>
      {items.map((item, index) => (
        <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Item {index + 1}</span>
            <button type="button" disabled={disabled} onClick={() => onChange(items.filter((_, position) => position !== index))}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50">Remove</button>
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-600">Item name
              <input required disabled={disabled} maxLength={100} value={item.title} onChange={(event) => update(index, "title", event.target.value)}
                placeholder="Snow plowing" className="mt-1 block h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900" />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Description
              <textarea disabled={disabled} rows={2} value={item.description} onChange={(event) => update(index, "description", event.target.value)}
                placeholder="Area or scope of work" className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Price ({currency})
              <input required disabled={disabled} type="number" min="0" step="0.01" value={item.price} onChange={(event) => update(index, "price", event.target.value)}
                placeholder="0.00" className="mt-1 block h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900" />
            </label>
          </div>
        </div>
      ))}
      {items.length > 0 && <div className="flex justify-between border-t border-slate-200 pt-3 text-sm font-semibold text-slate-900"><span>Service total</span><span>${total.toFixed(2)} {currency}</span></div>}
    </section>
  );
}
