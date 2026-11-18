import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuArrowLeft, LuCircleAlert, LuCircleCheck, LuSparkles, LuX } from "react-icons/lu";
import { useCreateClientMutation, useCreateServiceMutation } from "../../../store";
import { missingFields, parseQuickAdd, PROVINCES } from "../../../utils/quickAddParser";
import { apiErrorMessage } from "../../../utils/apiError";
import useAlert from "../../../hooks/useAlert";

const EXAMPLE =
  "John Smith, john@example.com, 403-555-0123\n" +
  "123 Main St NW, Calgary AB T2T 2T2\n" +
  "Snow removal every month, $120, starting Dec 1. Driveway and front walk.";

const LABELS = {
  client_name: "Name",
  client_email: "Email",
  client_phone: "Phone",
  company_name: "Company",
  street_address: "Street address",
  city: "City",
  province_state: "Province / state",
  postal_code: "Postal / ZIP code",
  service_name: "Service",
  price: "Price",
  start_date: "Start date",
  end_date: "End date",
  description: "Description",
};

const inputClass =
  "h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

function Field({ name, fields, found, onChange, type = "text", children, required }) {
  const value = fields[name] ?? "";
  const missing = required && !String(value).trim();
  const guessed = !missing && found[name] === false && String(value).trim();
  return (
    <label className="block text-sm">
      <span className="mb-1 flex items-center gap-1.5 font-medium text-slate-700">
        {LABELS[name]}
        {required && <span className="text-rose-500">*</span>}
        {missing ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
            <LuCircleAlert className="h-3.5 w-3.5" /> needed
          </span>
        ) : guessed ? (
          <span className="text-xs font-semibold text-amber-600">default, check</span>
        ) : found[name] ? (
          <LuCircleCheck className="h-3.5 w-3.5 text-emerald-600" aria-label="Found in your note" />
        ) : null}
      </span>
      {children || (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(name, event.target.value)}
          className={`${inputClass} ${missing ? "border-rose-300 bg-rose-50/40" : ""}`}
        />
      )}
    </label>
  );
}

// Paste or type everything about a new customer job; the note is read into
// client, service and quote fields to review, then all three are created.
export default function QuickAddDialog({ open, onClose, business }) {
  const navigate = useNavigate();
  const setAlert = useAlert();
  const [text, setText] = useState("");
  const [step, setStep] = useState("write");
  const [fields, setFields] = useState({});
  const [found, setFound] = useState({});
  const [autoInvoice, setAutoInvoice] = useState(true);
  const [createdClientId, setCreatedClientId] = useState(null);
  const [createClient, { isLoading: creatingClient }] = useCreateClientMutation();
  const [createService, { isLoading: creatingService }] = useCreateServiceMutation();
  const busy = creatingClient || creatingService;

  const serviceOptions = useMemo(() => business?.services_offered || [], [business]);
  const missing = missingFields(fields);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const reset = () => {
    setText("");
    setStep("write");
    setFields({});
    setFound({});
    setCreatedClientId(null);
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const readNote = () => {
    const parsed = parseQuickAdd(text, { serviceOptions });
    setFields(parsed.fields);
    setFound(parsed.found);
    setStep("review");
  };

  const change = (name, value) => {
    setFields((current) => ({ ...current, [name]: value }));
    setFound((current) => ({ ...current, [name]: true }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (missing.length) {
      setAlert({ type: "danger", message: `Fill in: ${missing.map((key) => LABELS[key]).join(", ")}.` });
      return;
    }
    if (!business?.id) {
      setAlert({ type: "danger", message: "Set up your business before adding clients." });
      return;
    }

    const address = {
      street_address: fields.street_address.trim(),
      city: fields.city.trim(),
      country: fields.country || "CA",
      province_state: fields.province_state,
      postal_code: fields.postal_code.trim(),
    };

    try {
      // 1. Client (kept if a later step fails, so a retry doesn't duplicate it).
      let clientId = createdClientId;
      if (!clientId) {
        const client = await createClient({
          client_name: fields.client_name.trim(),
          client_email: fields.client_email.trim(),
          client_phone: fields.client_phone || "",
          company_name: (fields.company_name || "").trim(),
          billing_street_address: address.street_address,
          billing_city: address.city,
          billing_country: address.country,
          billing_province_state: address.province_state,
          billing_postal_code: address.postal_code,
        }).unwrap();
        clientId = client.id;
        setCreatedClientId(clientId);
      }

      // 2. Service, with the questionnaire skipped so 3. the quote is drafted now.
      const service = await createService({
        client: clientId,
        business: business.id,
        service_name: fields.service_name.trim(),
        service_type: fields.service_type || "ONE_TIME",
        billing_cycle: fields.service_type === "SUBSCRIPTION" ? fields.billing_cycle || "MONTHLY" : null,
        price: Number(fields.price).toFixed(2),
        items: fields.items?.length
          ? fields.items
          : [{ title: fields.service_name.trim(), description: "", price: Number(fields.price).toFixed(2) }],
        currency: fields.currency || "CAD",
        start_date: fields.start_date,
        end_date: fields.end_date || null,
        description: fields.description || "",
        ...address,
        // Active so the drafted quote can be sent right away.
        status: "ACTIVE",
        bypass_questionnaire: true,
        auto_generate_quote: true,
        auto_generate_invoices: autoInvoice,
      }).unwrap();

      const quote = service.quotations?.[0];
      setAlert({
        type: "success",
        message: quote
          ? `${fields.client_name} added with a draft quote. Review it and press Send Quote.`
          : `${fields.client_name} and their service were added.`,
      });
      reset();
      onClose();
      navigate(quote ? `/user/business/quote/${quote.id}` : `/user/business/service/${service.id}`);
    } catch (err) {
      setAlert({
        type: "danger",
        message: apiErrorMessage(
          err,
          createdClientId ? "The client was added, but the service could not be created." : "Could not add the client.",
        ),
      });
    }
  };

  const provinceOptions = PROVINCES[fields.country || "CA"] || {};

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/45" onClick={close} role="presentation" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-add-title"
        className="absolute right-0 top-0 flex h-dvh w-full flex-col overflow-hidden bg-white shadow-2xl"
        style={{ maxWidth: "640px" }}
      >
        <div className="shrink-0 border-b border-gray-200 px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h5 id="quick-add-title" className="flex items-center gap-2 text-3xl font-semibold text-slate-900">
                <LuSparkles className="h-7 w-7 text-accent" /> Quick Add
              </h5>
              <p className="mt-1 text-sm text-slate-500">
                {step === "write"
                  ? "Describe the customer and the job in your own words. We'll create the client, the service and a draft quote."
                  : "Check what we found. Fields marked needed must be filled in."}
              </p>
            </div>
            <button type="button" onClick={close} className="text-slate-400 hover:text-slate-700" aria-label="Close">
              <LuX className="h-4 w-4" />
            </button>
          </div>
        </div>

        {step === "write" ? (
          <>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <textarea
                id="quick-add-text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={10}
                autoFocus
                placeholder={EXAMPLE}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm leading-relaxed focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-slate-600">
                <p className="font-semibold text-slate-700">Include as much as you know:</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  <li>Name, email and phone</li>
                  <li>Service address with city, province and postal code</li>
                  <li>
                    The service
                    {serviceOptions.length ? ` (${serviceOptions.slice(0, 4).join(", ")}${serviceOptions.length > 4 ? "…" : ""})` : ""}
                    , price and start date
                  </li>
                  <li>“monthly” or “every year” for a subscription; one item per line like “- Salting $25”</li>
                </ul>
              </div>
            </div>
            <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={close}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={readNote}
                disabled={!text.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accentLight disabled:opacity-60"
              >
                <LuSparkles className="h-4 w-4" /> Read details
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleCreate} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <section className="space-y-3">
                <h6 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">1 · Client</h6>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field name="client_name" required fields={fields} found={found} onChange={change} />
                  <Field name="client_email" type="email" required fields={fields} found={found} onChange={change} />
                  <Field name="client_phone" type="tel" required fields={fields} found={found} onChange={change} />
                  <Field name="company_name" fields={fields} found={found} onChange={change} />
                </div>
              </section>

              <section className="space-y-3">
                <h6 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  2 · Service address (also used for billing)
                </h6>
                <Field name="street_address" required fields={fields} found={found} onChange={change} />
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field name="city" required fields={fields} found={found} onChange={change} />
                  <Field name="province_state" required fields={fields} found={found} onChange={change}>
                    <select
                      value={fields.province_state || ""}
                      onChange={(event) => change("province_state", event.target.value)}
                      className={`${inputClass} ${!fields.province_state ? "border-rose-300 bg-rose-50/40" : ""}`}
                    >
                      <option value="">Select</option>
                      {Object.entries(provinceOptions).map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field name="postal_code" required fields={fields} found={found} onChange={change} />
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                  Country
                  <select
                    value={fields.country || "CA"}
                    onChange={(event) => {
                      change("country", event.target.value);
                      change("province_state", "");
                    }}
                    className="h-9 rounded-lg border border-gray-200 px-2 text-sm"
                  >
                    <option value="CA">Canada</option>
                    <option value="US">United States</option>
                  </select>
                </label>
              </section>

              <section className="space-y-3">
                <h6 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  3 · Service &amp; quote
                </h6>
                <Field name="service_name" required fields={fields} found={found} onChange={change}>
                  {serviceOptions.length ? (
                    <select
                      value={fields.service_name || ""}
                      onChange={(event) => change("service_name", event.target.value)}
                      className={`${inputClass} ${!fields.service_name ? "border-rose-300 bg-rose-50/40" : ""}`}
                    >
                      <option value="">Select a service</option>
                      {serviceOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : null}
                </Field>

                {fields.items?.length > 0 && (
                  <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100 text-sm">
                    {fields.items.map((item, index) => (
                      <li key={index} className="flex justify-between px-3 py-2">
                        <span className="text-slate-700">{item.title}</span>
                        <span className="font-medium text-slate-900">${item.price}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="grid gap-3 sm:grid-cols-3">
                  <Field name="price" required fields={fields} found={found} onChange={change}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={fields.price ?? ""}
                      disabled={fields.items?.length > 0}
                      onChange={(event) => change("price", event.target.value)}
                      className={`${inputClass} ${!fields.price ? "border-rose-300 bg-rose-50/40" : ""} disabled:bg-gray-50`}
                    />
                  </Field>
                  <Field name="start_date" type="date" required fields={fields} found={found} onChange={change} />
                  <Field name="end_date" type="date" fields={fields} found={found} onChange={change} />
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700">
                  <label className="inline-flex items-center gap-2">
                    <span className="font-medium">Type</span>
                    <select
                      value={fields.service_type || "ONE_TIME"}
                      onChange={(event) => change("service_type", event.target.value)}
                      className="h-9 rounded-lg border border-gray-200 px-2 text-sm"
                    >
                      <option value="ONE_TIME">One time</option>
                      <option value="SUBSCRIPTION">Subscription</option>
                    </select>
                  </label>
                  {fields.service_type === "SUBSCRIPTION" && (
                    <label className="inline-flex items-center gap-2">
                      <span className="font-medium">Billed</span>
                      <select
                        value={fields.billing_cycle || "MONTHLY"}
                        onChange={(event) => change("billing_cycle", event.target.value)}
                        className="h-9 rounded-lg border border-gray-200 px-2 text-sm"
                      >
                        <option value="MONTHLY">Monthly</option>
                        <option value="YEARLY">Yearly</option>
                      </select>
                    </label>
                  )}
                  <label className="inline-flex items-center gap-2">
                    <select
                      value={fields.currency || "CAD"}
                      onChange={(event) => change("currency", event.target.value)}
                      className="h-9 rounded-lg border border-gray-200 px-2 text-sm"
                      aria-label="Currency"
                    >
                      <option value="CAD">CAD</option>
                      <option value="USD">USD</option>
                    </select>
                  </label>
                </div>

                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#ff6a00]"
                    checked={autoInvoice}
                    onChange={(event) => setAutoInvoice(event.target.checked)}
                  />
                  Auto-generate invoices once the quote is signed
                  {fields.service_type === "SUBSCRIPTION" ? " (a new one each billing period)" : ""}
                </label>

                <Field name="description" fields={fields} found={found} onChange={change}>
                  <textarea
                    rows={3}
                    value={fields.description || ""}
                    onChange={(event) => change("description", event.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </Field>
              </section>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setStep("write")}
                disabled={busy || Boolean(createdClientId)}
                className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-40"
              >
                <LuArrowLeft className="h-4 w-4" /> Edit note
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accentLight disabled:opacity-60"
              >
                {busy
                  ? "Creating..."
                  : missing.length
                    ? `${missing.length} field${missing.length === 1 ? "" : "s"} needed`
                    : "Create client, service & quote"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
