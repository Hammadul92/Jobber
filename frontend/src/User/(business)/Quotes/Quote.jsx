import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  useFetchQuoteQuery,
  useUpdateQuoteMutation,
  useSendQuoteMutation,
} from "../../../store";
import SubmitButton from "../../../Components/ui/SubmitButton";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import { formatDate } from "../../../utils/formatDate";
import Input from "../../../Components/ui/Input";
import Textarea from "../../../Components/ui/Textarea";
import {
  LuMail,
  LuMapPin,
  LuPhone,
  LuUser,
} from "react-icons/lu";

export default function Quote({ token }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: quoteData,
    isLoading,
    error,
  } = useFetchQuoteQuery(id, { skip: !token });
  const [updateQuote, { isLoading: updating }] = useUpdateQuoteMutation();
  const [sendQuote, { isLoading: sending }] = useSendQuoteMutation();

  const [validUntil, setValidUntil] = useState("");
  const [termsConditions, setTermsConditions] = useState("");
  const [notes, setNotes] = useState("");
  const [alert, setAlert] = useState({ type: "", message: "" });

  useEffect(() => {
    if (quoteData) {
      setValidUntil(quoteData.valid_until || "");
      setTermsConditions(quoteData.terms_conditions || "");
      setNotes(quoteData.notes || "");
    }
  }, [quoteData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateQuote({
        id,
        valid_until: validUntil,
        terms_conditions: termsConditions,
        notes,
      }).unwrap();

      setAlert({ type: "success", message: "Quote updated successfully!" });
    } catch (err) {
      setAlert({
        type: "danger",
        message: err?.data?.detail || "Failed to update quote. Please try again.",
      });
    }
  };

  const handleSendQuote = async () => {
    try {
      await sendQuote(id).unwrap();
      setAlert({ type: "success", message: "Quote email sent successfully!" });
    } catch (err) {
      setAlert({
        type: "danger",
        message: err?.data?.detail || "Failed to send quote email. Please try again.",
      });
    }
  };

  if (isLoading) return <div>Loading quote...</div>;

  if (error) {
    return (
      <div
        className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800"
        role="alert"
      >
        {error?.data?.detail || "Failed to load quote."}
      </div>
    );
  }

  const client = quoteData.client || {};
  const serviceData = quoteData.service_data || {};

  const isSigned = quoteData.status === "SIGNED";
  const isInactiveClient =
    client.is_active === false || client.is_active === "False";
  const isServiceInactive = serviceData.status !== "ACTIVE";
  const isRequiredFieldsMissing = !validUntil || !termsConditions;
  const isExpired = new Date(validUntil) < new Date();

  const disableSendBtn =
    isSigned || isExpired || isInactiveClient || isServiceInactive || isRequiredFieldsMissing;

  const disableReasons = [];
  if (isSigned) disableReasons.push("This quote has already been signed and cannot be resent.");
  if (isExpired && !isSigned)
    disableReasons.push('This quote has expired. Please update the "Valid Until" date before sending.');
  if (isInactiveClient) disableReasons.push("The client is inactive. Reactivate the client before sending.");
  if (isServiceInactive) disableReasons.push("The linked service is inactive. Please ensure it is active.");
  if (isRequiredFieldsMissing)
    disableReasons.push("Please fill in all required fields (Valid Until and Terms & Conditions).");

  const statusColor =
    quoteData.status === "SIGNED"
      ? "bg-emerald-100 text-emerald-700"
      : quoteData.status === "SENT"
        ? "bg-blue-100 text-blue-700"
        : quoteData.status === "EXPIRED"
          ? "bg-rose-100 text-rose-700"
          : quoteData.status === "DECLINED"
            ? "bg-rose-100 text-rose-700"
            : "bg-slate-100 text-slate-600";

  const pillBadge = `inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold ${statusColor}`;
  const btnPrimary =
    "inline-flex items-center rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#ff7a1f] disabled:cursor-not-allowed disabled:opacity-60";
  const cardBase =
    "relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm";

  return (
    <>
      {alert.message && (
        <AlertDispatcher
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: "", message: "" })}
        />
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-3xl font-medium tracking-tight text-slate-900">
            {quoteData.quote_number}
          </h3>
          <span className={pillBadge}>{quoteData.status}</span>
        </div>

        <button
          type="button"
          className={`${btnPrimary} min-w-43 justify-center`}
          onClick={handleSendQuote}
          disabled={disableSendBtn || sending}
        >
          {sending && (
            <span
              className="h-5 w-5 animate-spin rounded-full border-2 border-white/50 border-t-white"
              aria-hidden="true"
            />
          )}
          {sending ? "Sending Quote..." : "Send Quote"}
        </button>
      </div>

      {disableSendBtn && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          <p className="font-semibold">Note:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
            {disableReasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          <div className={cardBase}>
            <div className="absolute right-4 top-5">
              {String(client.is_active) === "True" || client.is_active === true ? (
                <span className="inline-flex items-center rounded-lg bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  ACTIVE
                </span>
              ) : (
                <span className="inline-flex items-center rounded-lg bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                  INACTIVE
                </span>
              )}
            </div>

            <h5 className="text-lg font-semibold text-slate-900">Client Details</h5>

            <div className="mt-5 space-y-4 text-slate-700">
              <div className="flex items-start gap-3">
                <LuUser className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Name</p>
                  <p className="text-base font-medium text-slate-800">
                    {quoteData.client_name || client.name || "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <LuMail className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="text-base font-medium text-slate-800">
                    {client.client_email || client.email || "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <LuPhone className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="text-base font-medium text-slate-800">
                    {client.client_phone || client.phone || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={cardBase}>
            <div className="absolute right-4 top-6 flex flex-wrap items-center justify-end gap-2">
              <span className="inline-flex items-center rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-white">
                {serviceData.service_type || "-"}
              </span>
              <span
                className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold ${
                  ["ACTIVE", "COMPLETED"].includes(serviceData.status)
                    ? "bg-emerald-100 text-emerald-700"
                    : serviceData.status === "PENDING"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-rose-100 text-rose-700"
                }`}
              >
                {serviceData.status || "-"}
              </span>
            </div>

            <h5 className="text-lg font-semibold text-slate-900">Service Details</h5>

            <div className="mt-5 space-y-4 text-slate-700">
              <div>
                <p className="text-sm text-slate-500">Service Name</p>
                <p className="text-base font-semibold text-slate-900">
                  <Link
                    to={`/user/business/service/${serviceData.id}`}
                    className="transition hover:text-[#ff6a00]"
                  >
                    {serviceData.service_name || "-"}
                  </Link>
                </p>
              </div>

              {serviceData.description && (
                <div>
                  <p className="text-sm text-slate-500">Description</p>
                  <p className="text-base font-medium text-slate-900">{serviceData.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-slate-800">
                <div>
                  <p className="text-sm text-slate-500">Price</p>
                  <p className="text-base font-medium">
                    ${serviceData.price || "-"} {serviceData.currency || ""}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Billing Cycle</p>
                  <p className="text-base font-medium">{serviceData.billing_cycle || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-slate-800">
                <div>
                  <p className="text-sm text-slate-500">Start Date</p>
                  <p className="text-base font-medium">{serviceData.start_date || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">End Date</p>
                  <p className="text-base font-medium">{serviceData.end_date || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <LuMapPin className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Service Address</p>
                  <p className="text-base font-medium text-slate-800">
                    {[
                      serviceData.street_address,
                      serviceData.city,
                      serviceData.province_state,
                      serviceData.country,
                      serviceData.postal_code,
                    ]
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                type="text"
                fieldClass="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-800 focus:border-[#ff6a00] focus:outline-none focus:ring-2 focus:ring-[#ff6a00]/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                value={quoteData.signed_at ? formatDate(quoteData.signed_at) : ""}
                onChange={() => {}}
                isDisabled={true}
                label="Signed At"
                id="quote-signed-at"
              />

              <Input
                type="date"
                fieldClass="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-800 focus:border-[#ff6a00] focus:outline-none focus:ring-2 focus:ring-[#ff6a00]/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                value={validUntil}
                onChange={setValidUntil}
                isDisabled={isSigned}
                isRequired={true}
                label="Valid Until"
                id="quote-valid-until"
              />
            </div>

            <div className="mt-5">
              <Textarea
                id="quote-terms-conditions"
                label="Terms & Conditions"
                value={termsConditions}
                onChange={setTermsConditions}
                isRequired={true}
                isDisabled={isSigned}
                fieldClass="h-36 w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-slate-700"
                rows={6}
              />
            </div>

            <div className="mt-5">
              <Textarea
                id="quote-notes"
                label="Notes"
                value={notes}
                onChange={setNotes}
                isRequired={false}
                isDisabled={isSigned}
                fieldClass="h-44 w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-slate-700"
                rows={6}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                onClick={() => navigate("/user/business/quotes")}
              >
                Cancel
              </button>
              {!isSigned && (
                <SubmitButton
                  isLoading={updating}
                  btnClass="bg-accent rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#ff7a1f]"
                  btnName="Save Changes"
                />
              )}
            </div>
          </div>
        </div>
      </form>
    </>
  );
}