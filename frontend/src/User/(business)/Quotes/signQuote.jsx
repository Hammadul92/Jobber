import { useState, useEffect, useRef } from "react";
import {
    useParams,
    Link,
} from "react-router-dom";
import {
    useFetchQuoteQuery,
    useSignQuoteMutation,
} from "../../../store";
import { useDispatch } from "react-redux";
import { setTopbar, resetTopbar } from "../../../store/topbarSlice";
import AcceptAndSignQuote from "./AcceptAndSignQuote";
import QuoteSectionPopup from "./QuoteSectionPopup";
import TransactionCompleteNotice from "../../../Components/ui/TransactionCompleteNotice";
import LoadingScreen from "../../../Components/ui/LoadingScreen";
import RichTextContent from "../../../Components/ui/RichTextContent";
import { endOfDate, formatDate } from "../../../utils/formatDate";
import { LuClock3 } from "react-icons/lu";
import { formatAddress } from "../../../utils/formatAddress";
import LineItemsTable from "../../../Components/ui/LineItemsTable";
import { paymentTermsLabel } from "../../../utils/paymentTerms";
import useAlert from "../../../hooks/useAlert";

export default function SignQuote({ token, preview = false }) {
    const { id } = useParams();
    const dispatch = useDispatch();

    const {
        data: quote,
        isLoading,
        error,
    } = useFetchQuoteQuery(id, { skip: !token });
    const [signQuote, { isLoading: signing }] = useSignQuoteMutation();

    const [showSignModal, setShowSignModal] = useState(false);
    const [showSigningComplete, setShowSigningComplete] = useState(false);
    const [showDeclineModal, setShowDeclineModal] = useState(false);
    const [status, setStatus] = useState("");
    const [timeRemaining, setTimeRemaining] = useState("");
    const setAlert = useAlert();
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [canToggleDescription, setCanToggleDescription] = useState(false);
    const [sectionPopup, setSectionPopup] = useState(null);
    const descriptionRef = useRef(null);

    useEffect(() => {
        if (quote) setStatus(quote.status);
    }, [quote]);

    // The preview explains itself in the title bar, beside the back arrow.
    useEffect(() => {
        if (!preview) return undefined;
        dispatch(
            setTopbar({
                title: "Client view preview",
                description: "This quote is read only.",
                action: null,
            }),
        );
        return () => {
            dispatch(resetTopbar());
        };
    }, [dispatch, preview]);

    useEffect(() => {
        if (!quote?.valid_until) return;

        const interval = setInterval(() => {
            const now = new Date();
            const endTime = endOfDate(quote.valid_until);
            const diff = endTime - now;

            if (diff <= 0) {
                setTimeRemaining("Expired");
                clearInterval(interval);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            setTimeRemaining(
                `${days > 0 ? `${days}d ` : ""}${hours}h ${minutes}m ${seconds}s`,
            );
        }, 1000);

        return () => clearInterval(interval);
    }, [quote]);

    const handleDeclineConfirm = async () => {
        if (preview) return;
        try {
            const formData = new FormData();
            formData.append("status", "DECLINED");

            await signQuote({ id, formData }).unwrap();

            setStatus("DECLINED");
            setAlert({ type: "success", message: "Quote declined successfully!" });
        } catch (err) {
            setAlert({
                type: "danger",
                message:
                    err?.data?.detail || "Failed to decline quote. Please try again.",
            });
        }

        setShowDeclineModal(false);
    };

    const handleSignSubmit = async ({ signature }) => {
        if (preview) return;
        try {
            const formData = new FormData();
            formData.append("status", "SIGNED");

            if (signature) {
                if (typeof signature === "string" && signature.startsWith("data:image")) {
                    const blob = await fetch(signature).then((res) => res.blob());
                    formData.append("signature", blob, "signature.png");
                } else {
                    formData.append("signature", signature);
                }
            }

            await signQuote({ id, formData }).unwrap();

            setStatus("SIGNED");
            setShowSigningComplete(true);
        } catch (err) {
            setAlert({
                type: "danger",
                message: err?.data?.detail || "Failed to sign quote. Please try again.",
            });
        }

        setShowSignModal(false);
    };

    useEffect(() => {
        if (!quote?.service_data?.description || !descriptionRef.current) {
            setCanToggleDescription(false);
            setIsDescriptionExpanded(false);
            return;
        }

        const element = descriptionRef.current;
        setCanToggleDescription(element.scrollHeight > element.clientHeight + 1);
        setIsDescriptionExpanded(false);
    }, [quote?.service_data?.description]);

    const openSectionPopup = (section) => {
        setSectionPopup(section);
    };

    const closeSectionPopup = () => {
        setSectionPopup(null);
    };

    if (isLoading) return <LoadingScreen />;

    if (error) {
        return (
            <div
                className="px-4 py-3 border rounded-lg border-rose-200 bg-rose-50 text-rose-800"
                role="alert"
            >
                {error?.data?.detail || "Failed to load quote."}
            </div>
        );
    }

    if (!quote) {
        return (
            <div className="px-4 py-3 my-6 text-center border rounded-lg border-amber-200 bg-amber-50 text-amber-800">
                <i className="mr-2 fa fa-exclamation-circle"></i>
                Quote not found or no longer available.
            </div>
        );
    }

    const client = quote.client || {};
    const serviceData = quote.service_data || {};
    const isFinalized = ["SIGNED", "DECLINED"].includes(status);
    const isClientActive = String(client.is_active) === "True" || client.is_active === true;
    const statusTone = {
        SENT: "bg-blue-100 text-blue-700",
        SIGNED: "bg-emerald-100 text-emerald-700",
        DECLINED: "bg-rose-100 text-rose-700",
    };
    const serviceAddress = [
        serviceData.street_address,
        serviceData.city,
        serviceData.province_state,
        serviceData.country,
        serviceData.postal_code,
    ]
        .filter(Boolean)
        .join(", ");

    return (
        <>
            {!preview && quote.revision_required && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    This quote was revised after service details changed. The business must resend it before you can respond.
                </div>
            )}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="space-y-6 p-4 md:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-6">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                Quote from {quote.business_name}
                            </p>
                            <h3 className="text-2xl font-semibold text-primary">
                                {quote.quote_number}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${statusTone[status] || "bg-gray-100 text-gray-700"}`}>
                                    {status}
                                </span>
                                {quote.payment_terms && (
                                    <span className="rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-semibold uppercase text-secondary">
                                        {paymentTermsLabel(quote.payment_terms)}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 text-slate-800 sm:items-end">
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                Valid Until
                            </p>
                            <p className="text-xl font-medium text-slate-900">
                                {quote.valid_until ? formatDate(quote.valid_until) : "-"}
                            </p>
                            {quote.valid_until && status === "SENT" && timeRemaining && (
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${timeRemaining === "Expired"
                                        ? "bg-rose-100 text-rose-700"
                                        : "bg-emerald-100 text-emerald-700"
                                        }`}
                                >
                                    <LuClock3 className="h-3.5 w-3.5" />
                                    {timeRemaining === "Expired"
                                        ? "Expired"
                                        : `${timeRemaining} left`}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h4 className="text-base font-semibold text-slate-900">Client Details</h4>
                            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${isClientActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                                {isClientActive ? "Active" : "Inactive"}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <InfoField label="Name" value={quote.client_name || client.name} />
                            <InfoField label="Email" value={client.client_email || client.email} />
                            <InfoField label="Phone" value={client.client_phone || client.phone} />
                            {client.company_name && <InfoField label="Company" value={client.company_name} />}
                            <InfoField label="Billing Address" value={formatAddress(client, "billing")} wide />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-base font-semibold text-slate-900">Service Details</h4>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <InfoField
                                label="Service"
                                value={
                                    <Link
                                        to={`/user/business/service/${serviceData.id}`}
                                        className="transition hover:text-accent"
                                    >
                                        {serviceData.service_name || "-"}
                                    </Link>
                                }
                            />
                            <InfoField
                                label="Service Type"
                                value={serviceData.service_type === "SUBSCRIPTION" ? "Subscription" : serviceData.service_type ? "One Time" : ""}
                            />
                            <InfoField label="Billing Cycle" value={serviceData.billing_cycle} />
                            <InfoField
                                label="Dates"
                                value={
                                    serviceData.start_date
                                        ? `${formatDate(serviceData.start_date)}${serviceData.end_date ? ` – ${formatDate(serviceData.end_date)}` : ""}`
                                        : ""
                                }
                            />
                            <InfoField label="Service Address" value={serviceAddress} wide />
                        </div>

                        {serviceData.description && serviceData.items?.length > 0 && (
                            <div>
                                <p className="mb-1 text-sm font-semibold uppercase text-gray-500">Description</p>
                                <p
                                    ref={descriptionRef}
                                    className={`text-sm text-slate-700 ${isDescriptionExpanded ? "" : "line-clamp-3"}`}
                                >
                                    {serviceData.description}
                                </p>
                                {canToggleDescription && (
                                    <button
                                        type="button"
                                        onClick={() => setIsDescriptionExpanded((value) => !value)}
                                        className="mt-1 text-sm font-semibold text-accent hover:underline"
                                    >
                                        {isDescriptionExpanded ? "View Less" : "View More"}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {isFinalized && (
                        <div className={`rounded-xl px-4 py-3 ${status === "DECLINED"
                            ? "border border-rose-200 bg-rose-50 text-rose-800"
                            : "border border-emerald-200 bg-emerald-50 text-emerald-800"
                            }`}
                        >
                            {status === "SIGNED" ? (
                                <div>
                                    <p className="mb-2 font-semibold">This quote has been signed.</p>
                                    <p className="mb-1 text-sm">Signed on <strong>{formatDate(quote.signed_at)}</strong> by <strong>{quote.client.client_name}</strong></p>
                                    {quote.signature && (
                                        <img
                                            src={quote.signature.startsWith("http")
                                                ? quote.signature
                                                : `${import.meta.env.VITE_API_URL || "http://localhost:8000"}${quote.signature}`}
                                            alt="Signed Document"
                                            className="mt-4 max-h-52 w-auto max-w-full rounded-xl border border-gray-200 bg-white p-2 object-contain"
                                        />
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm">
                                    This quote has been <strong>declined</strong>
                                    {quote.signed_at && <> on <strong>{formatDate(quote.signed_at)}</strong></>}
                                </p>
                            )}
                        </div>
                    )}

                    <section className="space-y-4" aria-labelledby="quote-service-items-heading">
                        <h4 id="quote-service-items-heading" className="text-base font-semibold text-slate-900">
                            Service Items
                        </h4>
                        <LineItemsTable
                            items={quote.line_items || []}
                            currency={quote.quoted_currency || serviceData.currency}
                            subtotal={quote.quoted_subtotal}
                            taxRate={quote.quoted_tax_rate}
                            taxLabel={quote.quoted_tax_label || "Tax"}
                            taxAmount={quote.quoted_tax_amount}
                            total={quote.quoted_total}
                            billingCycle={serviceData.billing_cycle}
                        />
                        {status === "SENT" && quote.quoted_tax_rate == null && (
                            <p className="text-sm text-amber-700">This older quote does not state tax. Please ask the business to resend it before signing.</p>
                        )}
                    </section>
                </div>

                <QuoteSectionPopup
                    open={Boolean(sectionPopup)}
                    onClose={closeSectionPopup}
                    title={sectionPopup === "terms" ? "Terms & Conditions" : "Notes"}
                >
                    {sectionPopup === "terms" ? (
                        (() => {
                            const generalTerms = quote.general_terms_conditions || "";
                            const additionalTerms = quote.terms_conditions || "";

                            if (!generalTerms && !additionalTerms) {
                                return (
                                    <p className="text-slate-700">No terms added.</p>
                                );
                            }

                            return (
                                <div className="space-y-4 text-slate-700">
                                    {generalTerms && (
                                        <RichTextContent html={generalTerms} />
                                    )}
                                    {additionalTerms && (
                                        <div>
                                            <div className="mb-4 border-t border-gray-200" />
                                            <p className="font-semibold text-slate-900">
                                                Additional Terms:
                                            </p>
                                            <p className="mt-2 whitespace-pre-wrap">
                                                {additionalTerms}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })()
                    ) : (
                        <p className="text-slate-700">{quote.notes || "No notes added."}</p>
                    )}
                </QuoteSectionPopup>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 px-4 py-4 md:px-6">
                    <div className="flex flex-wrap gap-3">
                        {serviceData.service_questionnaires?.id ? (
                            <Link
                                to={`/user/business/service-questionnaire/${serviceData.service_questionnaires.id}/form/${serviceData.id}`}
                                className="inline-flex items-center rounded-xl border border-secondary bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-secondary/95"
                            >
                                Questionnaire Responses
                            </Link>
                        ) : (
                            <button
                                type="button"
                                disabled
                                className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400 cursor-not-allowed"
                            >
                                Questionnaire Responses
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => openSectionPopup("notes")}
                            className="inline-flex items-center rounded-xl border border-accent bg-white px-4 py-2 text-sm font-semibold text-accent transition hover:bg-slate-50"
                        >
                            View Notes
                        </button>
                        <button
                            type="button"
                            onClick={() => openSectionPopup("terms")}
                            className="inline-flex items-center rounded-xl border border-accent bg-white px-4 py-2 text-sm font-semibold text-accent transition hover:bg-slate-50"
                        >
                            Terms & Conditions
                        </button>
                    </div>
                    {!preview && (
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                className="inline-flex items-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed! disabled:opacity-75"
                                onClick={() => setShowDeclineModal(true)}
                                disabled={signing || timeRemaining === "Expired" || status !== "SENT" || isFinalized || quote.revision_required}
                            >
                                Decline
                            </button>
                            <button
                                type="button"
                                className="inline-flex items-center rounded-xl bg-[#ff6a00] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ff7a1f] disabled:cursor-not-allowed! disabled:opacity-75"
                                onClick={() => setShowSignModal(true)}
                                disabled={signing || timeRemaining === "Expired" || status !== "SENT" || isFinalized || quote.revision_required || quote.quoted_tax_rate == null}
                            >
                                Accept & Sign
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {!preview && showSignModal && (
                <AcceptAndSignQuote
                    handleSignSubmit={handleSignSubmit}
                    signing={signing}
                    setShowSignModal={setShowSignModal}
                />
            )}

            {!preview && (
                <TransactionCompleteNotice
                    message={showSigningComplete ? "Signing complete and a copy has been sent to your email." : ""}
                    onClose={() => setShowSigningComplete(false)}
                />
            )}

            {!preview && showDeclineModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h5 className="flex items-center gap-2 text-xl font-medium text-rose-700">
                                <i className="fa fa-exclamation-triangle"></i>
                                Confirm Decline
                            </h5>
                            <button
                                type="button"
                                className="text-lg text-gray-500 transition hover:text-gray-800"
                                onClick={() => setShowDeclineModal(false)}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>
                        <div className="px-5 py-5 text-sm text-gray-700">
                            <p className="mb-0">
                                Are you sure you want to <strong>decline</strong> this quote?{" "}
                                <br />
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100">
                            <button
                                type="button"
                                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 transition bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
                                onClick={() => setShowDeclineModal(false)}
                                disabled={signing}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition border rounded-xl border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                                onClick={handleDeclineConfirm}
                                disabled={signing}
                            >
                                {signing ? "Declining..." : "Yes, Decline"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function InfoField({ label, value, wide = false }) {
    return (
        <div className={wide ? "sm:col-span-2" : ""}>
            <p className="mb-1 text-sm font-semibold uppercase text-gray-500">{label}</p>
            <div className="text-sm font-medium text-slate-900">{value || "-"}</div>
        </div>
    );
}
