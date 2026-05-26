import { useEffect, useState } from "react";
import { CgClose } from "react-icons/cg";
import Dropdown from "../../../Components/ui/Dropdown";
import Input from "../../../Components/ui/Input";
import SubmitButton from "../../../Components/ui/SubmitButton";
import Textarea from "../../../Components/ui/Textarea";
import {
  useCreateInvoiceMutation,
  useFetchClientsQuery,
  useFetchServicesQuery,
} from "../../../store";

function FieldLabel({ htmlFor, children }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm uppercase font-semibold text-gray-500"
    >
      {children}
    </label>
  );
}

export default function CreateInvoiceForm({
  token,
  showModal,
  setShowModal,
  setAlert,
  business,
}) {
  const [clientId, setClientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState("CAD");
  const [subtotal, setSubtotal] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [notes, setNotes] = useState("");

  const {
    data: clients = [],
    isLoading: loadingClients,
    isError: errorClients,
  } = useFetchClientsQuery(undefined, { skip: !token });

  const {
    data: services = [],
    isLoading: loadingServices,
    isError: errorServices,
  } = useFetchServicesQuery(clientId, { skip: !clientId || !token });

  const [createInvoice, { isLoading: isCreating }] = useCreateInvoiceMutation();

  useEffect(() => {
    if (errorClients) {
      setAlert({
        type: "danger",
        message: "Failed to load clients. Please refresh.",
      });
    }

    if (errorServices) {
      setAlert({
        type: "danger",
        message: "Failed to load services for selected client.",
      });
    }
  }, [errorClients, errorServices, setAlert]);

  useEffect(() => {
    if (serviceId && services.length) {
      const selectedService = services.find(
        (service) => service.id === Number(serviceId),
      );
      if (selectedService) {
        const taxRatePercent = (selectedService.tax_rate || 0) * 100;
        const price = parseFloat(selectedService.price) || 0;
        const tax = ((price * taxRatePercent) / 100).toFixed(2);
        const total = (price + parseFloat(tax)).toFixed(2);

        setSubtotal(price);
        setTaxRate(taxRatePercent);
        setTaxAmount(tax);
        setTotalAmount(total);
        setCurrency(selectedService.currency || "CAD");
      }
    }
  }, [serviceId, services]);

  useEffect(() => {
    if (subtotal !== "" && taxRate !== "") {
      const tax = ((parseFloat(subtotal) * parseFloat(taxRate)) / 100).toFixed(
        2,
      );
      const total = (parseFloat(subtotal) + parseFloat(tax)).toFixed(2);
      setTaxAmount(tax);
      setTotalAmount(total);
    }
  }, [subtotal, taxRate]);

  useEffect(() => {
    if (!serviceId) {
      setSubtotal("");
      setTaxRate("");
      setTaxAmount("");
      setTotalAmount("");
      setCurrency("CAD");
    }
  }, [serviceId]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await createInvoice({
        business: business?.id,
        client: clientId,
        service: serviceId,
        due_date: dueDate,
        currency,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        notes,
      }).unwrap();

      setAlert({ type: "success", message: "Invoice created successfully!" });
      setClientId("");
      setServiceId("");
      setDueDate("");
      setSubtotal("");
      setTaxRate("");
      setTaxAmount("");
      setTotalAmount("");
      setCurrency("CAD");
      setNotes("");
      setShowModal(false);
    } catch (err) {
      const message =
        err?.data?.error ||
        err?.data?.detail ||
        "Failed to create invoice. Please try again.";
      setAlert({ type: "danger", message });
    }
  };

  const serviceOptions =
    !loadingServices && services
      ? services
          .filter(
            (service) =>
              service.status === "ACTIVE" &&
              service?.quotations.find((quote) => quote.status === "SIGNED"),
          )
          .map((service) => ({
            value: service.id,
            label: `${service.service_name} (${service.client_name} - ${service.street_address})`,
          }))
      : [];

  const clientOptions =
    !loadingClients && clients?.results
      ? clients.results.map((client) => ({
          value: client.id,
          label: client.client_name,
        }))
      : [];

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />

          <div
            className="absolute right-0 top-0 flex h-full w-full flex-col overflow-hidden border-l border-gray-200 bg-white shadow-2xl md:w-4/6 lg:w-2/6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-gray-100 px-6 pt-5 pb-4">
              <div>
                <h5 className="text-[28px] font-semibold leading-tight text-slate-900">
                  Create New Invoice
                </h5>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Create new invoices for clients
                </p>
              </div>

              <button
                type="button"
                className="text-slate-400 transition hover:text-slate-600"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                <CgClose className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="rounded-2xl border border-blue-100 bg-[#f5f8ff] px-4 py-3 text-[12px] leading-5 text-blue-700">
                  <strong>Note:</strong> To create an invoice, you must have a
                  client associated with the service. Only services assigned to
                  a client will appear in the list below. If you don&apos;t see
                  a service, make sure it has been set up for a client first.
                </div>

                <section className="mt-6">
                  <h6 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-700">
                    Invoice Details
                  </h6>

                  <div className="mt-4 space-y-4">
                    <div>
                      <FieldLabel htmlFor="invoice-service">Service</FieldLabel>
                      <Dropdown
                        id="invoice-service"
                        value={serviceId}
                        onChange={setServiceId}
                        disabled={!clientId}
                        placeholder={
                          clientId ? "Select Service" : "Select Client first"
                        }
                        options={serviceOptions}
                        buttonClassName="border-gray-200 bg-white text-sm text-slate-700"
                        menuClassName="z-50"
                      />
                    </div>

                    <div>
                      <FieldLabel htmlFor="invoice-client">Client</FieldLabel>
                      <Dropdown
                        id="invoice-client"
                        value={clientId}
                        onChange={(value) => {
                          setClientId(value);
                          setServiceId("");
                        }}
                        placeholder="Select Client"
                        options={clientOptions}
                        buttonClassName="border-gray-200 bg-white text-sm text-slate-700"
                        menuClassName="z-50"
                      />
                    </div>

                    <Input
                      type="date"
                      value={dueDate}
                      onChange={setDueDate}
                      isRequired={true}
                      label="Due Date"
                      id="invoice-due-date"
                      fieldClass="h-11 text-sm"
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel htmlFor="invoice-currency">
                          Currency
                        </FieldLabel>
                        <Dropdown
                          id="invoice-currency"
                          value={currency}
                          onChange={setCurrency}
                          options={[
                            { value: "CAD", label: "CAD" },
                            { value: "USD", label: "USD" },
                          ]}
                          buttonClassName="border-gray-200 bg-white text-sm text-slate-700"
                          menuClassName="z-50"
                        />
                      </div>

                      <Input
                        type="number"
                        value={subtotal}
                        onChange={setSubtotal}
                        isRequired={true}
                        label="Subtotal"
                        id="invoice-subtotal"
                        fieldClass="h-11 text-sm"
                      />
                    </div>

                    <Input
                      type="number"
                      value={taxRate}
                      onChange={setTaxRate}
                      isRequired={true}
                      label="Tax Rate (%)"
                      id="invoice-tax-rate"
                      fieldClass="h-11 text-sm"
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        type="number"
                        value={taxAmount}
                        onChange={() => {}}
                        isDisabled={true}
                        isRequired={true}
                        label="Tax Amount"
                        id="invoice-tax-amount"
                        fieldClass="h-11 text-sm"
                      />

                      <Input
                        type="number"
                        value={totalAmount}
                        onChange={() => {}}
                        isDisabled={true}
                        isRequired={true}
                        label="Total Amount"
                        id="invoice-total-amount"
                        fieldClass="h-11 text-sm"
                      />
                    </div>

                    <Textarea
                      id="invoice-notes"
                      label="Description"
                      value={notes}
                      onChange={setNotes}
                      isRequired={false}
                      fieldClass="w-full"
                      rows={5}
                      placeholder="Optional notes or invoice description......"
                    />
                  </div>
                </section>
              </div>

              <div className="border-t border-gray-100 bg-white px-6 py-4">
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <SubmitButton
                    isLoading={isCreating}
                    btnClass="rounded-xl border border-accent bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accentLight"
                    btnName="Create invoice"
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
