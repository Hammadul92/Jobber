import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFetchQuoteQuery, useUpdateQuoteMutation, useSendQuoteMutation } from '../../../../store';
import SubmitButton from '../../../ui/SubmitButton';
import AlertDispatcher from '../../../ui/AlertDispatcher';
import { formatDate } from '../../../../utils/formatDate';
import Input from '../../../ui/Input';

export default function Quote({ token }) {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: quoteData, isLoading, error } = useFetchQuoteQuery(id, { skip: !token });
    const [updateQuote, { isLoading: updating }] = useUpdateQuoteMutation();
    const [sendQuote, { isLoading: sending }] = useSendQuoteMutation();

    const [validUntil, setValidUntil] = useState('');
    const [termsConditions, setTermsConditions] = useState('');
    const [notes, setNotes] = useState('');

    const [alert, setAlert] = useState({ type: '', message: '' });

    useEffect(() => {
        if (quoteData) {
            setValidUntil(quoteData.valid_until || '');
            setTermsConditions(quoteData.terms_conditions || '');
            setNotes(quoteData.notes || '');
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

            setAlert({
                type: 'success',
                message: 'Quote updated successfully!',
            });
        } catch (err) {
            console.error('Failed to update quote:', err);
            setAlert({
                type: 'danger',
                message: err?.data?.detail || 'Failed to update quote. Please try again.',
            });
        }
    };

    const handleSendQuote = async () => {
        try {
            await sendQuote(id).unwrap();
            setAlert({
                type: 'success',
                message: 'Quote email sent successfully!',
            });
        } catch (err) {
            setAlert({
                type: 'danger',
                message: err?.data?.detail || 'Failed to send quote email. Please try again.',
            });
        }
    };

    if (isLoading) return <div>Loading quote...</div>;

    if (error) {
        return (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800" role="alert">
                {error?.data?.detail || 'Failed to load quote.'}
            </div>
        );
    }

    const isSigned = quoteData.status === 'SIGNED';
    const isInactiveClient = quoteData.client?.is_active === false || quoteData.client?.is_active === 'False';
    const isServiceInactive = quoteData.service_data?.status !== 'ACTIVE';
    const isRequiredFieldsMissing = !validUntil || !termsConditions;
    const isExpired = new Date(validUntil) < new Date();

    const disableSendBtn = isSigned || isExpired || isInactiveClient || isServiceInactive || isRequiredFieldsMissing;

    const disableReasons = [];
    if (isSigned) disableReasons.push('This quote has already been signed and cannot be resent.');
    if (isExpired && !isSigned)
        disableReasons.push('This quote has expired. Please update the "Valid Until" date before sending.');
    if (isInactiveClient) disableReasons.push('The client is inactive. Reactivate the client before sending.');
    if (isServiceInactive) disableReasons.push('The linked service is inactive. Please ensure it is active.');
    if (isRequiredFieldsMissing)
        disableReasons.push('Please fill in all required fields (Valid Until and Terms & Conditions).');

    const statusColor =
        quoteData.status === 'SIGNED'
            ? 'bg-emerald-100 text-emerald-700'
            : quoteData.status === 'SENT'
              ? 'bg-blue-100 text-blue-700'
              : quoteData.status === 'EXPIRED'
                ? 'bg-rose-100 text-rose-700'
                : quoteData.status === 'DECLINED'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-gray-100 text-gray-700';

    const badgeBase = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold';

    const pillBadge = `${badgeBase} ${statusColor}`;

    const btnPrimary =
        'inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentLight disabled:cursor-not-allowed disabled:opacity-60';

    const cardBase = 'relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm';

    const textMuted = 'text-sm text-gray-600';

    return (
        <>
            <nav aria-label="breadcrumb" className="mb-4">
                <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <li>
                        <Link to={`/`} className="font-semibold text-accent hover:text-accentLight">
                            Contractorz
                        </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li>
                        <Link to={`/dashboard/home`} className="font-semibold text-secondary hover:text-accent">
                            Dashboard
                        </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li>
                        <Link to={`/dashboard/quotes`} className="font-semibold text-secondary hover:text-accent">
                            Quotes
                        </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li className="font-semibold text-gray-800">Edit Quote ({quoteData.quote_number})</li>
                </ol>
            </nav>

            {alert.message && (
                <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: '', message: '' })}
                />
            )}

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-semibold text-primary">{quoteData.quote_number}</h3>
                    <span className={pillBadge}>{quoteData.status}</span>
                </div>

                <button type="button" className={btnPrimary} onClick={handleSendQuote} disabled={disableSendBtn || sending}>
                    {sending && (
                        <span
                            className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white"
                            aria-hidden="true"
                        ></span>
                    )}
                    {sending ? 'Sending Quote...' : 'Send Quote'}
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
                        <div className="absolute right-4 top-4">
                            {quoteData.client.is_active === 'True' ? (
                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    ACTIVE
                                </span>
                            ) : (
                                <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                                    INACTIVE
                                </span>
                            )}
                        </div>

                        <h5 className="text-base font-semibold text-gray-900">Client Details</h5>

                        <p className={`${textMuted} mt-2`}>Name: {quoteData.client_name}</p>
                        <p className={textMuted}>Email: {quoteData.client.client_email}</p>
                        <p className={textMuted}>Phone: {quoteData.client.client_phone}</p>
                    </div>

                    <div className={cardBase}>
                        <div className="absolute right-4 top-4 flex flex-wrap items-center justify-end gap-2">
                            <span className="inline-flex items-center rounded-full bg-gray-800 px-3 py-1 text-xs font-semibold text-white">
                                {quoteData.service_data.service_type}
                            </span>
                            <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                    ['ACTIVE', 'COMPLETED'].includes(quoteData.service_data.status)
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : quoteData.service_data.status === 'PENDING'
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-rose-100 text-rose-700'
                                }`}
                            >
                                {quoteData.service_data.status}
                            </span>
                        </div>

                        <h5 className="text-base font-semibold text-gray-900">Service Details</h5>

                        <p className={`${textMuted} mt-2`}>
                            Name:{' '}
                            <Link
                                to={`/dashboard/service/${quoteData.service_data.id}`}
                                className="font-semibold text-accent hover:text-accentLight"
                            >
                                {quoteData.service_data.service_name}
                            </Link>
                        </p>

                        {quoteData.service_data.description && (
                            <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                                <i className="fa fa-info mr-2 text-secondary"></i> {quoteData.service_data.description}
                            </p>
                        )}
                        <p className={textMuted}>
                            Price: ${quoteData.service_data.price} {quoteData.service_data.currency}
                        </p>
                        <p className={textMuted}>Billing Cycle: {quoteData.service_data.billing_cycle || '-'}</p>
                        <div className="mb-1 flex items-center justify-between text-sm text-gray-600">
                            <p className="mb-0">Start Date: {quoteData.service_data.start_date}</p>
                            <p className="mb-0">End Date: {quoteData.service_data.end_date || '-'}</p>
                        </div>
                        <p className={textMuted}>
                            Service Address: {quoteData.service_data.street_address}, {quoteData.service_data.city},{' '}
                            {quoteData.service_data.province_state}, {quoteData.service_data.country},{' '}
                            {quoteData.service_data.postal_code}
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-8">
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                type="text"
                                fieldClass="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                                value={formatDate(quoteData.signed_at)}
                                onChange={() => {}}
                                isDisabled={true}
                                label="Signed At"
                                id="quote-signed-at"
                            />

                            <Input
                                type="date"
                                fieldClass="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                                value={validUntil}
                                onChange={setValidUntil}
                                isDisabled={isSigned}
                                isRequired={true}
                                label="Valid Until (*)"
                                id="quote-valid-until"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="mb-1 block text-sm font-semibold text-gray-700">Terms & Conditions (*)</label>
                            <textarea
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                                rows="4"
                                value={termsConditions}
                                onChange={(e) => setTermsConditions(e.target.value)}
                                disabled={isSigned}
                                required
                            ></textarea>
                        </div>

                        <div className="mb-4">
                            <label className="mb-1 block text-sm font-semibold text-gray-700">Notes</label>

                            <textarea
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                                rows="3"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                disabled={isSigned}
                            ></textarea>
                        </div>

                        <div className="mt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                                onClick={() => navigate('/dashboard/quotes')}
                            >
                                Cancel
                            </button>
                            {!isSigned && (
                                <SubmitButton
                                    isLoading={updating}
                                    btnClass="bg-accent px-4 py-2 text-sm text-white shadow-sm hover:bg-accentLight"
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
