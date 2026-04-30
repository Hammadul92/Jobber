import { useState } from "react";
import { LuInfo, LuX } from "react-icons/lu";
import { useCreateServiceMutation } from "../../../../store";
import SubmitButton from "../../../../Components/ui/SubmitButton";
import { countries, provinces } from "../../../../constants/locations";
import Dropdown from "../../../../Components/ui/Dropdown";

export default function CreateClientServiceForm({
  showModal,
  setShowModal,
  clientId,
  businessId,
  clientName,
  serviceOptions = [],
  setAlert,
}) {
  const [serviceName, setServiceName] = useState("");
  const [serviceType, setServiceType] = useState("ONE_TIME");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("CAD");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [billingCycle, setBillingCycle] = useState("");
  const [description, setDescription] = useState("");

  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("CA");
  const [provinceState, setProvinceState] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [autoGenerateQuote, setAutoGenerateQuote] = useState(false);
  const [autoGenerateInvoices, setAutoGenerateInvoices] = useState(false);

  const [createService, { isLoading }] = useCreateServiceMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createService({
        client: clientId,
        business: businessId,
        service_name: serviceName,
        service_type: serviceType,
        price,
        currency,
        start_date: startDate,
        end_date: endDate || null,
        billing_cycle: billingCycle || null,
        description,
        street_address: streetAddress,
        city,
        country,
        province_state: provinceState,
        postal_code: postalCode,

        auto_generate_quote: autoGenerateQuote,
        auto_generate_invoices: autoGenerateInvoices,
      }).unwrap();

      setAlert({
        type: "success",
        message: "Service created successfully!",
      });

      // Reset form
      setServiceName("");
      setServiceType("ONE_TIME");
      setPrice("");
      setCurrency("CAD");
      setStartDate("");
      setEndDate("");
      setBillingCycle("");
      setDescription("");
      setStreetAddress("");
      setCity("");
      setCountry("CA");
      setProvinceState("");
      setPostalCode("");
      setAutoGenerateQuote(false);
      setAutoGenerateInvoices(false);

      setShowModal(false);
    } catch (err) {
      const msg = Array.isArray(err?.data)
        ? err.data.join(", ")
        : typeof err?.data === "object"
          ? Object.entries(err.data)
              .map(
                ([field, messages]) =>
                  `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`,
              )
              .join(" | ")
          : err?.data?.detail || "Failed to create service.";
      setAlert({
        type: "danger",
        message: msg,
      });
    }
  };

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => setShowModal(false)}
            role="button"
            tabIndex={-1}
            aria-label="Close modal backdrop"
          />

          <div
            className="absolute right-0 top-0 h-full w-full bg-white shadow-2xl"
            style={{ maxWidth: "520px" }}
          >
            <div className="flex h-full flex-col">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h5 className="text-3xl font-semibold text-slate-900">
                      Add a New Service
                    </h5>
                    <p className="mt-1 text-sm text-slate-500">
                      Create a service for {clientName || "client"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-0.5 text-slate-400 transition hover:text-slate-700"
                    onClick={() => setShowModal(false)}
                    aria-label="Close"
                  >
                    <LuX className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex h-full flex-col">
                <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5 pb-24">
                  <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-3 text-xs font-semibold text-orange-600">
                    <LuInfo className="mt-px h-4 w-4 shrink-0" />
                    Service details and location will be saved to the client's profile.
                  </div>

                  <div>
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Service Details
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label htmlFor="service_name" className="mb-1 block text-xs font-semibold text-slate-600">
                          Service Name <span className="text-accent">*</span>
                        </label>
                        <Dropdown
                          id="service_name"
                          value={serviceName}
                          onChange={setServiceName}
                          placeholder="Digital Service Name"
                          options={serviceOptions}
                          buttonClassName="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-slate-700"
                        />
                      </div>

                      <div>
                        <label htmlFor="start_date" className="mb-1 block text-xs font-semibold text-slate-600">
                          Start Date <span className="text-accent">*</span>
                        </label>
                        <input
                          type="date"
                          id="start_date"
                          className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-slate-700 focus:border-accent focus:outline-none"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="end_date" className="mb-1 block text-xs font-semibold text-slate-600">
                          End Date <span className="text-accent">*</span>
                        </label>
                        <input
                          type="date"
                          id="end_date"
                          className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-slate-700 focus:border-accent focus:outline-none"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>

                      <div>
                        <label htmlFor="price" className="mb-1 block text-xs font-semibold text-slate-600">
                          Price <span className="text-accent">*</span>
                        </label>
                        <input
                          type="number"
                          id="price"
                          className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-slate-700 focus:border-accent focus:outline-none"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="Price"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="currency" className="mb-1 block text-xs font-semibold text-slate-600">
                          Currency <span className="text-accent">*</span>
                        </label>
                        <Dropdown
                          id="currency"
                          value={currency}
                          onChange={setCurrency}
                          options={[{ value: "CAD", label: "CAD" }, { value: "USD", label: "USD" }]}
                          buttonClassName="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-slate-700"
                        />
                      </div>

                      <div>
                        <label htmlFor="service_type" className="mb-1 block text-xs font-semibold text-slate-600">
                          Service Type <span className="text-accent">*</span>
                        </label>
                        <Dropdown
                          id="service_type"
                          value={serviceType}
                          onChange={(v) => {
                            setServiceType(v);
                            setBillingCycle("");
                          }}
                          options={[{ value: "ONE_TIME", label: "One Time" }, { value: "SUBSCRIPTION", label: "Subscription" }]}
                          buttonClassName="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-slate-700"
                        />
                      </div>

                      {serviceType !== "ONE_TIME" && (
                        <div>
                          <label htmlFor="billing_cycle" className="mb-1 block text-xs font-semibold text-slate-600">
                            Billing Cycle <span className="text-accent">*</span>
                          </label>
                          <Dropdown
                            id="billing_cycle"
                            value={billingCycle}
                            onChange={setBillingCycle}
                            options={[{ value: "MONTHLY", label: "Monthly" }, { value: "YEARLY", label: "Yearly" }]}
                            placeholder="Select Billing Cycle"
                            buttonClassName="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-slate-700"
                          />
                        </div>
                      )}

                      <div className="space-y-2 pt-1">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <input
                            id="generate_quote"
                            type="checkbox"
                            className="h-3.5 w-3.5 rounded-full border border-gray-300 text-accent focus:ring-accent"
                            checked={autoGenerateQuote}
                            onChange={() => setAutoGenerateQuote(!autoGenerateQuote)}
                          />
                          Auto Generate Quote
                        </label>
                        {autoGenerateQuote && (
                          <div className="mt-2 flex items-start gap-2 rounded-md border border-secondary bg-secondary/10 px-3 py-2 text-xs font-semibold text-secondary">
                            <LuInfo className="mt-px h-4 w-4 shrink-0" />
                            Quotes will be automatically generated for this service when enabled.
                          </div>
                        )}
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <input
                            id="generate_invoices"
                            type="checkbox"
                            className="h-3.5 w-3.5 rounded-full border border-gray-300 text-accent focus:ring-accent"
                            checked={autoGenerateInvoices}
                            onChange={() => setAutoGenerateInvoices(!autoGenerateInvoices)}
                          />
                          Auto Generate Invoice(s)
                        </label>
                        {autoGenerateInvoices && (
                          <div className="mt-2 flex items-start gap-2 rounded-md border border-secondary bg-secondary/10 px-3 py-2 text-xs font-semibold text-secondary">
                            <LuInfo className="mt-px h-4 w-4 shrink-0" />
                            Invoices will be automatically created for this service on the selected billing cycle.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Service Address
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="street_address" className="mb-1 block text-xs font-semibold text-slate-600">
                          Street Address
                        </label>
                        <input
                          id="street_address"
                          className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-slate-700 focus:border-accent focus:outline-none"
                          value={streetAddress}
                          onChange={(e) => setStreetAddress(e.target.value)}
                          placeholder="STREET ADDRESS"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="city" className="mb-1 block text-xs font-semibold text-slate-600">
                            City
                          </label>
                          <input
                            id="city"
                            className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-slate-700 focus:border-accent focus:outline-none"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="City"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="province" className="mb-1 block text-xs font-semibold text-slate-600">
                            Province/State
                          </label>
                          <Dropdown
                            id="province"
                            value={provinceState}
                            onChange={setProvinceState}
                            options={provinces[country] || []}
                            placeholder="Select State/Province"
                            buttonClassName="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-slate-700"
                            disabled={!country}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="country" className="mb-1 block text-xs font-semibold text-slate-600">
                          Country
                        </label>
                        <Dropdown
                          id="country"
                          value={country}
                          onChange={(v) => {
                            setCountry(v);
                            setProvinceState("");
                          }}
                          options={countries}
                          buttonClassName="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-slate-700"
                        />
                      </div>

                      <div>
                        <label htmlFor="postal_code" className="mb-1 block text-xs font-semibold text-slate-600">
                          Postal/Zip Code
                        </label>
                        <input
                          id="postal_code"
                          className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-slate-700 focus:border-accent focus:outline-none"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="Postal/Zip Code"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Service Description
                    </p>
                    <textarea
                      id="client-service-description"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                      style={{ minHeight: "90px" }}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Service Description"
                      rows={4}
                    />
                  </div>
                </div>

                <div className="sticky bottom-0 z-40 bg-white border-t border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-gray-100"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <SubmitButton
                      isLoading={isLoading}
                      btnClass="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accentLight disabled:opacity-60"
                      btnName="Add Service"
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
