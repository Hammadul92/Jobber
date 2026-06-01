import { useState, useEffect, useRef } from "react";
import {
    useParams,
    Link,
    useSearchParams,
    useNavigate,
} from "react-router-dom";
import {
    useFetchQuoteQuery,
    useSignQuoteMutation,
    useMagicLoginMutation,
} from "../../../store";
import AcceptAndSignQuote from "./AcceptAndSignQuote";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import { formatDate } from "../../../utils/formatDate";
import {
    LuCalendarDays,
    LuClock3,
    LuMail,
    LuMapPin,
    LuPhone,
    LuUser,
    LuFileText,
} from "react-icons/lu";

export default function SignQuote({ token }) {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const magicToken = searchParams.get("token");
    const [magicLogin] = useMagicLoginMutation();

    useEffect(() => {
        if (!magicToken) return;

        const login = async () => {
            try {
                await magicLogin({ token: magicToken }).unwrap();
                navigate(`/user/business/quote/sign/${id}`, { replace: true });
                window.location.reload();
            } catch {
                // keep current behavior intact
            }
        };

        login();
    }, [magicToken, magicLogin, navigate, id]);

    const {
        data: quote,
        isLoading,
        error,
    } = useFetchQuoteQuery(id, { skip: !token });
    const [signQuote, { isLoading: signing }] = useSignQuoteMutation();

    const [showSignModal, setShowSignModal] = useState(false);
    const [showDeclineModal, setShowDeclineModal] = useState(false);
    const [status, setStatus] = useState("");
    const [timeRemaining, setTimeRemaining] = useState("");
    const [alert, setAlert] = useState({ type: "", message: "" });
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [canToggleDescription, setCanToggleDescription] = useState(false);
    const descriptionRef = useRef(null);

    useEffect(() => {
        if (quote) setStatus(quote.status);
    }, [quote]);

    useEffect(() => {
        if (!quote?.valid_until) return;

        const interval = setInterval(() => {
            const now = new Date();
            const endTime = new Date(quote.valid_until);
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
            setAlert({ type: "success", message: "Quote signed successfully!" });
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

    if (!quote) {
        return (
            <div className="my-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-amber-800">
                <i className="fa fa-exclamation-circle mr-2"></i>
                Quote not found or no longer available.
            </div>
        );
    }

    const client = quote.client || {};
    const serviceData = quote.service_data || {};
    const questionnaireEntries =
        serviceData?.filled_questionnaire &&
            typeof serviceData.filled_questionnaire === "object"
            ? Object.entries(serviceData.filled_questionnaire)
            : [];

    const isFinalized = ["SIGNED", "DECLINED"].includes(status);
    const validUntilLabel = quote.valid_until
        ? new Date(quote.valid_until).toLocaleString()
        : "-";

    return (
        <>
            {alert.message && (
                <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: "", message: "" })}
                />
            )}

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="rounded-t-2xl grid gap-4 border-b border-gray-200 bg-linear-to-r from-accent/10 from-0% to-transparent to-100% px-6 py-5 md:grid-cols-[1fr_auto] lg:items-start">
                    <div>
                        <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
                            {quote.business_name}
                        </h3>
                        <p className="mt-1 text-sm md:text-base text-slate-500">
                            Quote # {quote.quote_number}
                        </p>
                    </div>

                    <div className="text-right">
                        <p className="text-sm font-semibold text-slate-500">Valid Until</p>
                        <p className="text-sm md:text-base font-medium text-slate-800">
                            {validUntilLabel}
                        </p>
                        {quote.valid_until && status === "SENT" && (
                            <div
                                className={`md:mt-2 inline-flex items-center gap-2 rounded-lg px-3 py-1 text-xs font-semibold ${timeRemaining === "Expired"
                                        ? "bg-rose-100 text-rose-700"
                                        : "bg-emerald-100 text-emerald-700"
                                    }`}
                            >
                                <LuClock3 className="h-3.5 w-3.5" />
                                {timeRemaining === "Expired"
                                    ? "This quote has expired"
                                    : `Time left: ${timeRemaining}`}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid gap-5 px-6 py-6 grid-cols-1 lg:grid-cols-5">
                    <div className="space-y-4 lg:col-span-2 md:grid md:grid-cols-2 lg:block md:gap-5">
                        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 md:h-full lg:h-auto">
                            <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-600">
                                Service Questionnaire Responses
                            </h4>
                            <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4">
                                {questionnaireEntries.length > 0 ? (
                                    <div className="space-y-2">
                                        {questionnaireEntries.map(([question, answer]) => (
                                            <div key={question}>
                                                <p className="text-sm font-semibold text-slate-700">
                                                    {question}
                                                </p>
                                                <p className="text-base text-emerald-600">
                                                    {Array.isArray(answer) ? answer.join(", ") : String(answer)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500">No questionnaire responses available.</p>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-background p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-600">
                                    Client Details
                                </h4>
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

                            <div className="space-y-4 text-slate-700">
                                <div className="flex items-start gap-3">
                                    <LuUser className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                                    <div>
                                        <p className="text-sm text-slate-500">Name</p>
                                        <p className="text-base font-medium text-slate-800">
                                            {quote.client_name || client.name || "-"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <LuMail className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                                    <div>
                                        <p className="text-sm text-slate-500">Email</p>
                                        <p className="text-base font-medium text-slate-800">
                                            {client.client_email || client.email || "-"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <LuPhone className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                                    <div>
                                        <p className="text-sm text-slate-500">Phone</p>
                                        <p className="text-base font-medium text-slate-800">
                                            {client.client_phone || client.phone || "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-3 rounded-2xl border border-gray-200 bg-background p-4">
                        <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-600">
                            Service Details
                        </h4>

                        <div className="mt-4 space-y-4 text-slate-700">
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
                                    <div className="mt-1">
                                        <p
                                            ref={descriptionRef}
                                            className={`text-base font-medium text-slate-900 text-justify ${isDescriptionExpanded ? "" : "line-clamp-3"
                                                }`}
                                        >
                                            {serviceData.description}
                                        </p>
                                        <div className="text-right">
                                            {canToggleDescription && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsDescriptionExpanded((value) => !value)}
                                                    className="text-sm text-accent underline decoration-accent/50 underline-offset-2 transition hover:text-accent-light"
                                                >
                                                    {isDescriptionExpanded ? "View Less" : "View More"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 text-slate-800">
                                <div>
                                    <p className="text-sm text-slate-500">Price</p>
                                    <p className="text-lg font-semibold text-[#ff6a00]">
                                        ${serviceData.price || "-"} {serviceData.currency || ""}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Service Type</p>
                                    <span className="inline-flex items-center rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-white">
                                        {serviceData.service_type || "-"}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-slate-500">Billing Cycle</p>
                                <p className="text-base font-medium">{serviceData.billing_cycle || "—"}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-slate-800">
                                <div className="flex items-start gap-3">
                                    <LuCalendarDays className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                                    <div>
                                        <p className="text-sm text-slate-500">Start Date</p>
                                        <p className="text-base font-medium">
                                            {serviceData.start_date
                                                ? new Date(serviceData.start_date).toLocaleDateString()
                                                : "—"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <LuCalendarDays className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                                    <div>
                                        <p className="text-sm text-slate-500">End Date</p>
                                        <p className="text-base font-medium">
                                            {serviceData.end_date
                                                ? new Date(serviceData.end_date).toLocaleDateString()
                                                : "—"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <LuMapPin className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
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

                    <div className="lg:col-span-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-justify">
                        <div className="rounded-2xl border border-gray-200 bg-background p-4">
                            <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-600">
                                Notes
                            </h4>
                            <p className="mt-2 text-slate-700">
                                {quote.notes || "No notes added."}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-background p-4">
                            <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-600">
                                Terms & Conditions
                            </h4>
                            <p className="mt-2 text-slate-700">
                                {quote.terms_conditions || "_"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 px-6 py-4">
                    {isFinalized ? (
                        <div
                            className={`rounded-xl px-4 py-3 ${status === "DECLINED"
                                    ? "border border-rose-200 bg-rose-50 text-rose-800"
                                    : "border border-emerald-200 bg-emerald-50 text-emerald-800"
                                }`}
                        >
                            {status === "SIGNED" ? (
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div>
                                        <p className="mb-2 font-semibold">
                                            This quote has been signed successfully.
                                        </p>
                                        <p className="mb-1 text-sm">
                                            Signed on: <strong>{formatDate(quote.signed_at)}</strong>
                                        </p>
                                        <p className="mb-1 text-sm">
                                            Signed by: <strong>{quote.client.client_name}</strong>
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-start lg:justify-end">
                                        {quote.signature && (
                                            <img
                                                src={
                                                    quote.signature.startsWith("http")
                                                        ? quote.signature
                                                        : `${import.meta.env.VITE_API_URL || "http://localhost:8000"}${quote.signature}`
                                                }
                                                alt="Signed Document"
                                                className="h-20 rounded-lg border border-gray-200 bg-white p-2"
                                            />
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm">
                                    This quote has been <strong>declined</strong>
                                    {quote.signed_at && (
                                        <>
                                            {" "}
                                            on <strong>{new Date(quote.signed_at).toLocaleString()}</strong>
                                        </>
                                    )}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="flex justify-end gap-3">
                            <button
                                className="inline-flex items-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={() => setShowDeclineModal(true)}
                                disabled={signing || timeRemaining === "Expired"}
                            >
                                Decline
                            </button>
                            <button
                                className="inline-flex items-center rounded-xl bg-[#ff6a00] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ff7a1f] disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={() => setShowSignModal(true)}
                                disabled={signing || timeRemaining === "Expired" || status !== "SENT"}
                            >
                                Accept & Sign
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showSignModal && (
                <AcceptAndSignQuote
                    handleSignSubmit={handleSignSubmit}
                    signing={signing}
                    setShowSignModal={setShowSignModal}
                />
            )}

            {showDeclineModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
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
                        <div className="flex justify-end gap-3 border-t border-gray-100 px-5 py-4">
                            <button
                                type="button"
                                className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                onClick={() => setShowDeclineModal(false)}
                                disabled={signing}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100"
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