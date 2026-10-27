export default function LineItemsTable({ items = [], currency = "CAD", subtotal, taxRate, taxLabel = "Tax", taxAmount, total, billingCycle }) {
  const money = (value) => `$${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200" aria-label="Service price breakdown">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"><span>Service item</span><span>Price</span></div>
      {items.map((item, index) => (
        <div key={`${index}-${item.title}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-t border-slate-100 px-4 py-4 text-sm">
          <div className="min-w-0"><p className="font-semibold text-slate-900">{item.title}</p>{item.description && <p className="mt-1 whitespace-pre-wrap text-slate-600">{item.description}</p>}</div>
          <span className="whitespace-nowrap font-semibold text-slate-900">{money(item.price)}</span>
        </div>
      ))}
      <div className="space-y-2 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{money(subtotal)}</span></div>
        {taxRate != null && <div className="flex justify-between text-slate-600"><span>{taxLabel} ({taxRate}%)</span><span>{money(taxAmount)}</span></div>}
        <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900"><span>{billingCycle === "MONTHLY" ? "Total per month" : "Total"}</span><span>{money(total ?? subtotal)}</span></div>
      </div>
    </div>
  );
}
