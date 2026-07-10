import { useState, useEffect } from "react";
import { LuInfo, LuX } from "react-icons/lu";
import { useCreateServiceMutation, useUpdateServiceMutation } from "../../../../store";
import SubmitButton from "../../../../Components/ui/SubmitButton";
import { countries, provinces } from "../../../../constants/locations";
import Dropdown from "../../../../Components/ui/Dropdown";
import Input from "../../../../Components/ui/Input";
import Textarea from "../../../../Components/ui/Textarea";

export default function CreateClientServiceForm({
  showModal,
  setShowModal,
  clientId,
  businessId,
  clientName,
  serviceOptions = [],
  setAlert,
  mode = "create",
  initialData = null,
}) {
  const isEditMode = mode === "edit" && Boolean(initialData);
  const lockToStatusOnly = isEditMode && initialData?.status !== "PENDING";
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
  const [status, setStatus] = useState("PENDING");

  const [createService, { isLoading: isCreating }] = useCreateServiceMutation();
  const [updateService, { isLoading: isUpdating }] = useUpdateServiceMutation();
  const isLoading = isCreating || isUpdating;

  const resetForm = () => {
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
    setStatus("PENDING");
  };

  // Reset form when modal opens for creating a new service.
  useEffect(() => {
    if (!showModal) return;

    if (!isEditMode) {
      resetForm();
    }
  }, [showModal, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
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
        status,
        auto_generate_quote: autoGenerateQuote,
        auto_generate_invoices: autoGenerateInvoices,
      };

      if (isEditMode) {
        await updateService({
          id: initialData.id,
          ...payload,
        }).unwrap();
        setAlert({
          type: "success",
          message: "Service updated successfully!",
        });
      } else {
        await createService({
          client: clientId,
          business: businessId,
          ...payload,
        }).unwrap();
        setAlert({
          type: "success",
          message: "Service created successfully!",
        });
      }

      resetForm();
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
          : err?.data?.detail || `Failed to ${isEditMode ? "update" : "create"} service.`;
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
            className="absolute right-0 top-0 flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl"
            style={{ maxWidth: "520px" }}
          >
            <div className="shrink-0 border-b border-gray-200 px-6 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h5 className="text-3xl font-semibold text-slate-900">
                    {isEditMode ? "Edit Service" : "Add a New Service"}
                  </h5>
                  <p className="mt-1 text-sm text-slate-500">
                    {isEditMode ? "Update service details" : `Create a service for ${clientName || "client"}`}
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

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5 pb-6">
                <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-3 text-xs font-semibold text-orange-600">
                  <LuInfo className="mt-px h-4 w-4 shrink-0" />
                  Service details and location will be saved to the client's
                  profile.
                </div>

                <div className="space-y-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Service Details
                  </p>

                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="service_name"
                        className="mb-1 block text-sm uppercase font-semibold text-gray-500"
                      >
                        Service Name <span className="text-accent">*</span>
                      </label>
                      <Dropdown
                        id="service_name"
                        value={serviceName}
                        onChange={setServiceName}
                        placeholder="Digital Service Name"
                        options={serviceOptions}
                        buttonClassName="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-slate-700"
                        disabled={lockToStatusOnly}
                      />
                    </div>

                      <div>
                        <Input
                          type="date"
                          id="start_date"
                          label="Start Date"
                          value={startDate}
                          onChange={setStartDate}
                          isRequired
                          fieldClass="mb-0 h-11 rounded-lg px-3 py-2 text-sm"
                          isDisabled={lockToStatusOnly}
                        />
                      </div>

                      <div>
                        <Input
                          type="date"
                          id="end_date"
                          label="End Date"
                          value={endDate}
                          onChange={setEndDate}
                          fieldClass="mb-0 h-11 rounded-lg px-3 py-2 text-sm"
                          isDisabled={lockToStatusOnly}
                        />
                      </div>

                      <div>
                        <Input
                          type="number"
                          id="price"
                          label="Price"
                          value={price}
                          onChange={setPrice}
                          isRequired
                          fieldClass="mb-0 h-11 rounded-lg px-3 py-2 text-sm"
                          isDisabled={lockToStatusOnly}
                        />
                      </div>

                    <div>
                      <label
                        htmlFor="currency"
                        className="mb-1 block text-sm uppercase font-semibold text-gray-500"
                      >
                        Currency <span className="text-accent">*</span>
                      </label>
                      <Dropdown
                        id="currency"
                        value={currency}
                        onChange={setCurrency}
                        options={[
                          { value: "CAD", label: "CAD" },
                          { value: "USD", label: "USD" },
                        ]}
                        buttonClassName="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-slate-700"
                        disabled={lockToStatusOnly}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="service_type"
                        className="mb-1 block text-sm uppercase font-semibold text-gray-500"
                      >
                        Service Type <span className="text-accent">*</span>
                      </label>
                      <Dropdown
                        id="service_type"
                        value={serviceType}
                        onChange={(v) => {
                          setServiceType(v);
                          setBillingCycle("");
                        }}
                        options={[
                          { value: "ONE_TIME", label: "One Time" },
                          { value: "SUBSCRIPTION", label: "Subscription" },
                        ]}
                        buttonClassName="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-slate-700"
                        disabled={lockToStatusOnly}
                      />
                    </div>

                    {serviceType !== "ONE_TIME" && (
                      <div>
                        <label
                          htmlFor="billing_cycle"
                          className="mb-1 block text-sm uppercase font-semibold text-gray-500"
                        >
                          Billing Cycle <span className="text-accent">*</span>
                        </label>
                        <Dropdown
                          id="billing_cycle"
                          value={billingCycle}
                          onChange={setBillingCycle}
                          options={[
                            { value: "MONTHLY", label: "Monthly" },
                            { value: "YEARLY", label: "Yearly" },
                          ]}
                          placeholder="Select Billing Cycle"
                          buttonClassName="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-slate-700"
                          disabled={lockToStatusOnly}
                        />
                        </div>
                      )}

                      {isEditMode && (
                        <div>
                          <label htmlFor="status" className="mb-1 block text-sm uppercase font-semibold text-gray-500">
                            Status <span className="text-accent">*</span>
                          </label>
                          <Dropdown
                            id="status"
                            value={status}
                            onChange={setStatus}
                            options={[
                              { value: "PENDING", label: "Pending" },
                              { value: "ACTIVE", label: "Active" },
                              { value: "COMPLETED", label: "Completed" },
                              { value: "CANCELLED", label: "Cancelled" },
                            ]}
                            buttonClassName="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-slate-700"
                            disabled={false}
                        />
                      </div>
                    )}

                    <div className="space-y-6 pt-1">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <input
                          id="generate_quote"
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded-full border border-gray-300 text-accent focus:ring-accent"
                          checked={autoGenerateQuote}
                          onChange={() =>
                            setAutoGenerateQuote(!autoGenerateQuote)
                          }
                          disabled={lockToStatusOnly}
                        />
                        Auto Generate Quote
                      </label>
                      {autoGenerateQuote && (
                        <div className="mt-2 flex items-start gap-2 rounded-md border border-secondary bg-secondary/10 px-3 py-2 text-xs font-semibold text-secondary">
                          <LuInfo className="mt-px h-4 w-4 shrink-0" />
                          Quotes will be automatically generated for this
                          service when enabled.
                        </div>
                      )}
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <input
                          id="generate_invoices"
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded-full border border-gray-300 text-accent focus:ring-accent"
                          checked={autoGenerateInvoices}
                          onChange={() =>
                            setAutoGenerateInvoices(!autoGenerateInvoices)
                          }
                          disabled={lockToStatusOnly}
                        />
                        Auto Generate Invoice(s)
                      </label>
                      {autoGenerateInvoices && (
                        <div className="mt-2 flex items-start gap-2 rounded-md border border-secondary bg-secondary/10 px-3 py-2 text-xs font-semibold text-secondary">
                          <LuInfo className="mt-px h-4 w-4 shrink-0" />
                          Invoices will be automatically created for this
                          service on the selected billing cycle.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                  <div className="space-y-6">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Service Address
                    </p>
                    <div className="space-y-6">
                      <div>
                        <Input
                          id="street_address"
                          label="Street Address"
                          value={streetAddress}
                          onChange={setStreetAddress}
                          isRequired
                          fieldClass="mb-0 h-11 rounded-lg px-3 py-2 text-sm"
                          isDisabled={lockToStatusOnly}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Input
                            id="city"
                            label="City"
                            value={city}
                            onChange={setCity}
                            isRequired
                            fieldClass="mb-0 h-11 rounded-lg px-3 py-2 text-sm"
                            isDisabled={lockToStatusOnly}
                          />
                        </div>

                      <div>
                        <label
                          htmlFor="province"
                          className="mb-1 block text-sm uppercase font-semibold text-gray-500"
                        >
                          Province/State
                        </label>
                        <Dropdown
                          id="province"
                          value={provinceState}
                          onChange={setProvinceState}
                          options={provinces[country] || []}
                          placeholder="Select State/Province"
                          buttonClassName="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-slate-700"
                          disabled={lockToStatusOnly || !country}
                        />
                      </div>
                    </div>

                    <div className="-mt-6">
                      <label
                        htmlFor="country"
                        className="mb-1 block text-sm uppercase font-semibold text-gray-500"
                      >
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
                        buttonClassName="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-slate-700"
                        disabled={lockToStatusOnly}
                      />
                    </div>

                      <div>
                        <Input
                          id="postal_code"
                          label="Postal/Zip Code"
                          value={postalCode}
                          onChange={setPostalCode}
                          isRequired
                          fieldClass="mb-0 h-11 rounded-lg px-3 py-2 text-sm"
                          isDisabled={lockToStatusOnly}
                        />
                      </div>
                    </div>
                  </div>

                <div className="space-y-6 pb-1">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Service Description
                  </p>
                  <Textarea
                    id="client-service-description"
                    label="Description"
                    value={description}
                    onChange={setDescription}
                    placeholder="Service Description"
                    rows={4}
                    fieldClass="mb-0 rounded-lg px-3 py-2 text-sm"
                    isDisabled={lockToStatusOnly}
                  />
                </div>
              </div>

              <div className="shrink-0 border-t border-gray-200 bg-white px-6 py-3">
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-gray-100"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <SubmitButton
                    isLoading={isLoading}
                    btnClass="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentLight disabled:opacity-60"
                    btnName={isEditMode ? "Update Service" : "Add Service"}
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
