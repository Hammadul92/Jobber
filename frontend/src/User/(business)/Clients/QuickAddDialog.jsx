import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuArrowLeft, LuCircleAlert, LuCircleCheck, LuSparkles, LuX } from "react-icons/lu";
import { useCreateClientMutation, useCreateServiceMutation } from "../../../store";
import { missingFields, parseQuickAdd, PROVINCES } from "../../../utils/quickAddParser";
import { apiErrorMessage } from "../../../utils/apiError";
import Dropdown from "../../../Components/ui/Dropdown";
import useAlert from "../../../hooks/useAlert";

const EXAMPLE =
  "John Smith, john@example.com, 403-555-0123\n" +
  "123 Main St NW, Calgary AB T2T 2T2\n" +
  "Billing: 50 Oak Ave, Edmonton AB T5K 1A1\n" +
  "Snow removal every month starting Dec 1. Driveway and front walk.\n" +
  "- Driveway clearing $95\n" +
  "- Salting $25";

const LABELS = {
  client_name: "Name",
  client_email: "Email",
  client_phone: "Phone",
  company_name: "Company",
  street_address: "Street address",
  city: "City",
  province_state: "Province / state",
  postal_code: "Postal / ZIP code",
  billing_street_address: "Billing street address",
  billing_city: "Billing city",
  billing_province_state: "Billing province / state",
  billing_postal_code: "Billing postal / ZIP code",
  service_name: "Service",
  price: "Price",
  start_date: "Start date",
  end_date: "End date",
  description: "Description",
};

const BILLING_REQUIRED = ["billing_street_address", "billing_city", "billing_province_state", "billing_postal_code"];

const Code = ({ children }) => (
  <code className="rounded bg-white px-1 py-0.5 font-mono text-[0.8em] text-slate-800 ring-1 ring-gray-200">{children}</code>
);

// The rules in utils/quickAddParser.js, in plain words. Keep the two in step.
const GUIDE = (serviceOptions) => [
  [
    "Name",
    <>
      The first part of the first line that is 2–4 words of letters only, e.g. <Code>John Smith, john@…</Code>. If
      there is none, it is taken from an email like <Code>john.smith@…</Code>. Label: <Code>Name:</Code>,{" "}
      <Code>Client:</Code> or <Code>Customer:</Code>.
    </>,
  ],
  ["Email", <>The first email address anywhere in the note. Label: <Code>Email:</Code>.</>],
  [
    "Phone",
    <>
      The first 10-digit number, in any format: <Code>403-555-0123</Code>, <Code>(403) 555 0123</Code>,{" "}
      <Code>+1 403 555 0123</Code>. Label: <Code>Phone:</Code>, <Code>Cell:</Code> or <Code>Mobile:</Code>.
    </>,
  ],
  [
    "Company (optional)",
    <>
      A name ending in Inc, Ltd, LLC, Corp or Co, e.g. <Code>Acme Landscaping Ltd</Code>. Label:{" "}
      <Code>Company:</Code>.
    </>,
  ],
  [
    "Service address",
    <>
      <b>Street:</b> a house number, up to four words, then a street type (St, Ave, Rd, Dr, Blvd, Way, Cres, Ct, Ln,
      Pl, Trail, Hwy…), with an optional NW/NE/SW/SE and unit, e.g. <Code>Unit 4, 123 Main St NW</Code>.{" "}
      <b>City:</b> the words right after the street, or right before the province or postal code, or a known city name.{" "}
      <b>Province / state:</b> the full name or its capital-letter code (<Code>AB</Code>, <Code>Ontario</Code>,{" "}
      <Code>NY</Code>); if missing, worked out from the postal or ZIP code. <b>Postal / ZIP code:</b> a Canadian code
      like <Code>T2T 2T2</Code> or a 5-digit ZIP like <Code>90210</Code>, which also sets the country. Labels:{" "}
      <Code>Address:</Code>, <Code>City:</Code>, <Code>Province:</Code> / <Code>State:</Code>, <Code>Postal:</Code> /{" "}
      <Code>ZIP:</Code>.
    </>,
  ],
  [
    "Billing address (optional)",
    <>
      Only when it differs from the service address. Start a line with <Code>Billing:</Code>,{" "}
      <Code>Billing address:</Code>, <Code>Bill to:</Code> or <Code>Mailing address:</Code> and write the full address
      after it, e.g. <Code>Billing: 50 Oak Ave, Edmonton AB T5K 1A1</Code>. The address can also go on the next line
      (or the next two, with the postal code on the second). It is read with the same rules as the service address. With
      no billing line, the service address is used for billing.
    </>,
  ],
  [
    "Service",
    <>
      Matched to your services
      {serviceOptions.length
        ? ` (${serviceOptions.slice(0, 4).join(", ")}${serviceOptions.length > 4 ? "…" : ""})`
        : ""}{" "}
      by its exact name, or by shared words, so “plowing snow” finds Snow Removal. Label: <Code>Service:</Code> or{" "}
      <Code>Job:</Code>.
    </>,
  ],
  [
    "Line items (optional)",
    <>
      One per line, starting with <Code>-</Code>, <Code>*</Code>, <Code>•</Code> or <Code>1.</Code> and ending in a
      price: <Code>- Salting $25</Code>. When there are items, the price is their total.
    </>,
  ],
  [
    "Price",
    <>
      The first amount with a dollar sign (<Code>$120</Code>), or followed by “dollars”, “CAD” or “USD”, or after
      price, cost, rate or fee (<Code>cost 120</Code>). Label: <Code>Price:</Code> (a plain number is fine there).
    </>,
  ],
  [
    "Currency",
    <>USD if the note says USD or US$, or the address is in the US; otherwise CAD.</>,
  ],
  [
    "Type & billing",
    <>
      A subscription if the note says monthly, weekly, every month, per year, annual, seasonal, recurring or
      subscription. Yearly, annual and seasonal bill yearly; everything else bills monthly. Otherwise it is a one-time
      job.
    </>,
  ],
  [
    "Start date",
    <>
      The date after start, starting, begin, from or on: <Code>Dec 1</Code>, <Code>1 December 2026</Code>,{" "}
      <Code>2026-12-01</Code>, <Code>12/01/2026</Code> (month first), today, tomorrow or next Monday. A date with no
      year means the next one coming. If none is found, today. Label: <Code>Start:</Code>.
    </>,
  ],
  [
    "End date (optional)",
    <>
      The date after until, till, through, ending or ends, in the same formats. Label: <Code>End:</Code>.
    </>,
  ],
  [
    "Description",
    <>
      The rest of the note, leaving out lines with the email, phone, postal code or a label. Label:{" "}
      <Code>Notes:</Code> to set it exactly.
    </>,
  ],
];

const inputClass =
  "h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

function Field({ name, fields, found, onChange, type = "text", children, required }) {
  const value = fields[name] ?? "";
  const missing = required && !String(value).trim();
  const guessed = !missing && found[name] === false && String(value).trim();
  // A <label> around a dropdown would re-open it when an option is clicked.
  const Wrapper = children ? "div" : "label";
  return (
    <Wrapper className="block text-sm">
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
    </Wrapper>
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
  const [separateBilling, setSeparateBilling] = useState(false);
  const [createdClientId, setCreatedClientId] = useState(null);
  const [createClient, { isLoading: creatingClient }] = useCreateClientMutation();
  const [createService, { isLoading: creatingService }] = useCreateServiceMutation();
  const busy = creatingClient || creatingService;

  const serviceOptions = useMemo(() => business?.services_offered || [], [business]);
  const missing = [
    ...missingFields(fields),
    ...(separateBilling ? BILLING_REQUIRED.filter((key) => !String(fields[key] ?? "").trim()) : []),
  ];

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
    setSeparateBilling(false);
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
    setSeparateBilling(BILLING_REQUIRED.some((key) => parsed.found[key]));
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
    const billing = separateBilling
      ? {
          street_address: fields.billing_street_address.trim(),
          city: fields.billing_city.trim(),
          country: fields.billing_country || "CA",
          province_state: fields.billing_province_state,
          postal_code: fields.billing_postal_code.trim(),
        }
      : address;

    try {
      // 1. Client (kept if a later step fails, so a retry doesn't duplicate it).
      let clientId = createdClientId;
      if (!clientId) {
        const client = await createClient({
          client_name: fields.client_name.trim(),
          client_email: fields.client_email.trim(),
          client_phone: fields.client_phone || "",
          company_name: (fields.company_name || "").trim(),
          billing_street_address: billing.street_address,
          billing_city: billing.city,
          billing_country: billing.country,
          billing_province_state: billing.province_state,
          billing_postal_code: billing.postal_code,
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
  const billingProvinceOptions = PROVINCES[fields.billing_country || "CA"] || {};

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
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm leading-relaxed focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-700">Sample note</p>
                  <button
                    type="button"
                    onClick={() => setText(EXAMPLE)}
                    className="text-sm font-semibold text-accent hover:underline"
                  >
                    Use this sample
                  </button>
                </div>
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-white px-3 py-2 font-mono text-xs leading-relaxed text-slate-700 ring-1 ring-gray-200">
                  {EXAMPLE}
                </pre>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-slate-600">
                <p className="font-semibold text-slate-700">How each field is read</p>
                <p className="mt-1">
                  Write naturally, or put a field on its own line as <Code>Label: value</Code> (for example{" "}
                  <Code>Phone: 403-555-0123</Code>). A labelled line always wins over a guess. You can fix anything on
                  the next step.
                </p>
                <dl className="mt-3 space-y-2.5">
                  {GUIDE(serviceOptions).map(([term, body]) => (
                    <div key={term}>
                      <dt className="font-semibold text-slate-700">{term}</dt>
                      <dd className="mt-0.5 leading-relaxed">{body}</dd>
                    </div>
                  ))}
                </dl>
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
                  2 · Service address{separateBilling ? "" : " (also used for billing)"}
                </h6>
                <Field name="street_address" required fields={fields} found={found} onChange={change} />
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field name="city" required fields={fields} found={found} onChange={change} />
                  <Field name="province_state" required fields={fields} found={found} onChange={change}>
                    <Dropdown
                      value={fields.province_state || ""}
                      onChange={(value) => change("province_state", value)}
                      placeholder="Select"
                      options={Object.entries(provinceOptions).map(([code, name]) => ({ value: code, label: name }))}
                      buttonClassName={`h-10! rounded-lg! px-3! ${!fields.province_state ? "border-rose-300! bg-rose-50/40!" : "border-gray-200"}`} textClassName="text-sm" menuClassName="z-50"
                    />
                  </Field>
                  <Field name="postal_code" required fields={fields} found={found} onChange={change} />
                </div>
                <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                  Country
                  <Dropdown
                    className="w-44"
                    value={fields.country || "CA"}
                    onChange={(value) => {
                      change("country", value);
                      change("province_state", "");
                    }}
                    options={[{ value: "CA", label: "Canada" }, { value: "US", label: "United States" }]}
                    buttonClassName="h-9! rounded-lg! px-3! border-gray-200" textClassName="text-sm" menuClassName="z-50"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#ff6a00]"
                    checked={separateBilling}
                    onChange={(event) => setSeparateBilling(event.target.checked)}
                  />
                  Billing address is different from the service address
                </label>
              </section>

              {separateBilling && (
                <section className="space-y-3">
                  <h6 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Billing address</h6>
                  <Field name="billing_street_address" required fields={fields} found={found} onChange={change} />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field name="billing_city" required fields={fields} found={found} onChange={change} />
                    <Field name="billing_province_state" required fields={fields} found={found} onChange={change}>
                      <Dropdown
                        value={fields.billing_province_state || ""}
                        onChange={(value) => change("billing_province_state", value)}
                        placeholder="Select"
                        options={Object.entries(billingProvinceOptions).map(([code, name]) => ({ value: code, label: name }))}
                        buttonClassName={`h-10! rounded-lg! px-3! ${!fields.billing_province_state ? "border-rose-300! bg-rose-50/40!" : "border-gray-200"}`} textClassName="text-sm" menuClassName="z-50"
                      />
                    </Field>
                    <Field name="billing_postal_code" required fields={fields} found={found} onChange={change} />
                  </div>
                  <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                    Country
                    <Dropdown
                      className="w-44"
                      value={fields.billing_country || "CA"}
                      onChange={(value) => {
                        change("billing_country", value);
                        change("billing_province_state", "");
                      }}
                      options={[{ value: "CA", label: "Canada" }, { value: "US", label: "United States" }]}
                      buttonClassName="h-9! rounded-lg! px-3! border-gray-200" textClassName="text-sm" menuClassName="z-50"
                    />
                  </div>
                </section>
              )}

              <section className="space-y-3">
                <h6 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  3 · Service &amp; quote
                </h6>
                <Field name="service_name" required fields={fields} found={found} onChange={change}>
                  {serviceOptions.length ? (
                    <Dropdown
                      value={fields.service_name || ""}
                      onChange={(value) => change("service_name", value)}
                      placeholder="Select a service"
                      options={serviceOptions}
                      buttonClassName={`h-10! rounded-lg! px-3! ${!fields.service_name ? "border-rose-300! bg-rose-50/40!" : "border-gray-200"}`} textClassName="text-sm" menuClassName="z-50"
                    />
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
                  <div className="inline-flex items-center gap-2">
                    <span className="font-medium">Type</span>
                    <Dropdown
                      className="w-40"
                      value={fields.service_type || "ONE_TIME"}
                      onChange={(value) => change("service_type", value)}
                      options={[{ value: "ONE_TIME", label: "One time" }, { value: "SUBSCRIPTION", label: "Subscription" }]}
                      buttonClassName="h-9! rounded-lg! px-3! border-gray-200" textClassName="text-sm" menuClassName="z-50"
                    />
                  </div>
                  {fields.service_type === "SUBSCRIPTION" && (
                    <div className="inline-flex items-center gap-2">
                      <span className="font-medium">Billed</span>
                      <Dropdown
                        className="w-36"
                        value={fields.billing_cycle || "MONTHLY"}
                        onChange={(value) => change("billing_cycle", value)}
                        options={[{ value: "MONTHLY", label: "Monthly" }, { value: "YEARLY", label: "Yearly" }]}
                        buttonClassName="h-9! rounded-lg! px-3! border-gray-200" textClassName="text-sm" menuClassName="z-50"
                      />
                    </div>
                  )}
                  <div className="inline-flex items-center gap-2">
                    <span className="font-medium">Currency</span>
                    <Dropdown
                      className="w-28"
                      value={fields.currency || "CAD"}
                      onChange={(value) => change("currency", value)}
                      options={["CAD", "USD"]}
                      buttonClassName="h-9! rounded-lg! px-3! border-gray-200" textClassName="text-sm" menuClassName="z-50"
                    />
                  </div>
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
