import { useState } from "react";
import Textarea from "../../../Components/ui/Textarea";
import {
  useFetchQuotesQuery,
  useFetchServicesQuery,
  useCreateQuoteMutation,
} from "../../../store";
import SubmitButton from "../../../Components/ui/SubmitButton";
import Select from "../../../Components/ui/Select";
import Input from "../../../Components/ui/Input";
import { LuX } from "react-icons/lu";

export default function CreateQuoteForm({
  token,
  showModal,
  setShowModal,
  setAlert,
}) {
  const [serviceId, setServiceId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [termsConditions, setTermsConditions] = useState("");
  const [notes, setNotes] = useState("");

  const { data: quoteData } = useFetchQuotesQuery(undefined, { skip: !token });
  const { data: services } = useFetchServicesQuery(undefined, { skip: !token });
  const [createQuote, { isLoading: isCreating }] = useCreateQuoteMutation();

  const quoteRows = Array.isArray(quoteData)
    ? quoteData
    : quoteData?.results ?? [];

  const quotedServiceIds = quoteRows
    .filter((quote) => quote?.is_active !== false && quote?.status !== "DECLINED")
    .map((quote) => Number(quote.service))
    .filter((serviceIdValue) => Number.isFinite(serviceIdValue));

  const availableServices = services?.filter(
    (service) => !quotedServiceIds.includes(Number(service.id)),
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createQuote({
        service: serviceId,
        valid_until: validUntil,
        terms_conditions: termsConditions,
        notes,
      }).unwrap();

      setAlert({ type: "success", message: "Quote created successfully!" });
      setServiceId("");
      setValidUntil("");
      setTermsConditions("");
      setNotes("");
      setShowModal(false);
    } catch (err) {
      const message =
        err?.data?.service?.[0] ||
        err?.data?.detail ||
        (err?.data && typeof err.data === "object"
          ? Object.entries(err.data)
              .map(([key, value]) =>
                `${key}: ${Array.isArray(value) ? value.join(", ") : value}`,
              )
              .join(" | ")
          : "") ||
        err?.error ||
        (typeof err?.data === "string" ? err.data : "") ||
        "Something went wrong while creating the quote. Please try again.";

      setAlert({ type: "danger", message });
    }
  };

  return (
    <>
      {showModal && (
        <div
          className="fixed inset-0 z-50 h-screen"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowModal(false)}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            onClick={() => setShowModal(false)}
            aria-label="Close add quote modal"
          />

          <div
            className="absolute right-0 top-0 z-10 flex h-screen w-full md:w-4/6 lg:w-2/6 max-w-105 flex-col overflow-hidden border-l border-gray-200 bg-white shadow-2xl sm:max-w-120"
            onClick={(event) => event.stopPropagation()}
          >
            <form onSubmit={handleSubmit} className="flex h-full flex-col">
              <div className="shrink-0 border-b border-gray-200 px-6 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h5 className="text-3xl font-semibold tracking-tight text-slate-900">
                      Create New Quote
                    </h5>
                    <p className="mt-1 text-sm text-slate-500">
                      Insert following information to add quote
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-slate-400 transition hover:text-slate-700"
                    onClick={() => setShowModal(false)}
                    aria-label="Close"
                  >
                    <LuX className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <div className="space-y-5">
                  <Select
                    id="quote-service"
                    label="Service"
                    value={serviceId}
                    onChange={setServiceId}
                    isRequired={true}
                    options={[
                      { value: "", label: "Select Service" },
                      ...(availableServices
                        ? availableServices
                            .filter((service) => service.status === "ACTIVE")
                            .map((service) => ({
                              value: service.id,
                              label: `${service.service_name} (${service.client_name} - ${service.street_address})`,
                            }))
                        : []),
                    ]}
                    fieldClass="rounded-lg border-gray-200 bg-white px-3 text-sm text-slate-700"
                  />

                  <Input
                    type="date"
                    value={validUntil}
                    onChange={setValidUntil}
                    isRequired={true}
                    label="Valid Until"
                    id="quote-valid-until"
                    fieldClass="h-10 rounded-lg border border-gray-200 px-3 text-base text-slate-700"
                  />

                  <Textarea
                    id="create-quote-terms-conditions"
                    label="Additional Terms & Conditions"
                    value={termsConditions}
                    onChange={setTermsConditions}
                    isRequired={false}
                    fieldClass="h-28 rounded-lg border border-gray-200 px-3 py-3 text-sm text-slate-700"
                    rows={5}
                    placeholder="Add any extra quote-specific terms on top of the service's general terms..."
                  />

                  <Textarea
                    id="create-quote-notes"
                    label="Notes"
                    value={notes}
                    onChange={setNotes}
                    isRequired={true}
                    fieldClass="h-28 rounded-lg border border-gray-200 px-3 py-3 text-sm text-slate-700"
                    rows={5}
                    placeholder="Optional notes or invoice description......."
                  />
                </div>
              </div>

              <div className="shrink-0 border-t border-gray-200 bg-white px-6 py-4">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                    onClick={() => setShowModal(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
                  <SubmitButton
                    isLoading={isCreating}
                    btnClass="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accentLight"
                    btnName="Create Quotes"
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
