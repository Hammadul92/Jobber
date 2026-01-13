import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFetchQuoteQuery, useSignQuoteMutation } from '../../../../store';
import AcceptAndSignQuote from './AcceptAndSignQuote';
import AlertDispatcher from '../../../ui/AlertDispatcher';
import { formatDate } from '../../../../utils/formatDate';

export default function SignQuote({ token }) {
    const { id } = useParams();
    const { data: quote, isLoading, error } = useFetchQuoteQuery(id, { skip: !token });
    const [signQuote, { isLoading: signing }] = useSignQuoteMutation();

    const [showSignModal, setShowSignModal] = useState(false);
    const [showDeclineModal, setShowDeclineModal] = useState(false);
    const [status, setStatus] = useState('');
    const [timeRemaining, setTimeRemaining] = useState('');

    const [alert, setAlert] = useState({ type: '', message: '' });

    const handleDeclineConfirm = async () => {
        try {
            const formData = new FormData();
            formData.append('status', 'DECLINED');

            await signQuote({ id, formData }).unwrap();

            setStatus('DECLINED');
            setAlert({ type: 'success', message: 'Quote declined successfully!' });
        } catch (err) {
            console.error('Failed to decline quote:', err);
            setAlert({
                type: 'danger',
                message: err?.data?.detail || 'Failed to decline quote. Please try again.',
            });
        }
        setShowDeclineModal(false);
    };

    const handleSignSubmit = async ({ signature }) => {
        try {
            const formData = new FormData();
            formData.append('status', 'SIGNED');

            if (signature) {
                if (typeof signature === 'string' && signature.startsWith('data:image')) {
                    const blob = await fetch(signature).then((res) => res.blob());
                    formData.append('signature', blob, 'signature.png');
                } else {
                    formData.append('signature', signature);
                }
            }

            await signQuote({ id, formData }).unwrap();

            setStatus('SIGNED');
            setAlert({ type: 'success', message: 'Quote signed successfully!' });
        } catch (err) {
            console.error('Failed to sign quote:', err);
            setAlert({
                type: 'danger',
                message: err?.data?.detail || 'Failed to sign quote. Please try again.',
            });
        }
        setShowSignModal(false);
    };

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
                setTimeRemaining('Expired');
                clearInterval(interval);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            setTimeRemaining(`${days > 0 ? `${days}d ` : ''}${hours}h ${minutes}m ${seconds}s`);
        }, 1000);

        return () => clearInterval(interval);
    }, [quote]);

    if (isLoading) return <div>Loading quote...</div>;

    if (error)
        return (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800" role="alert">
                {error?.data?.detail || 'Failed to load quote.'}
            </div>
        );

    if (!quote) {
        return (
            <div className="my-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-amber-800">
                <i className="fa fa-exclamation-circle mr-2"></i>
                Quote not found or no longer available.
            </div>
        );
    }

    const isFinalized = ['SIGNED', 'DECLINED'].includes(status);

    return (
        <>
            {alert.message && (
                <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: '', message: '' })}
                />
            )}

            <nav aria-label="breadcrumb" className="mb-4">
                <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
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
                    <li className="font-semibold text-gray-800">Quote ({quote.quote_number})</li>
                </ol>
            </nav>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <h4 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                        <i className="far fa-file-text text-secondary"></i>
                        {quote.business_name} (Quote # {quote.quote_number})
                    </h4>

                    {quote.valid_until && status === 'SENT' && (
                        <div className="text-right">
                            <div className="flex items-center justify-end gap-2 text-sm font-semibold text-gray-800">
                                <i className="far fa-clock text-secondary"></i>
                                <span>
                                    Valid Until: <span className="text-gray-500">{new Date(quote.valid_until).toLocaleString()}</span>
                                </span>
                            </div>
                            <div
                                className={`mt-1 text-sm font-semibold ${
                                    timeRemaining === 'Expired' ? 'text-rose-700' : 'text-emerald-700'
                                }`}
                            >
                                {timeRemaining === 'Expired' ? 'This quote has expired.' : `Time left: ${timeRemaining}`}
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4">
                        <div>
                            <h5 className="mb-2 text-sm font-semibold text-gray-800">Client Details</h5>
                            <ul className="space-y-1 text-sm text-gray-600">
                                <li>
                                    <strong className="text-gray-800">Name:</strong> {quote.client_name || '_'}
                                </li>
                                <li>
                                    <strong className="text-gray-800">Email:</strong> {quote.client?.client_email || '_'}
                                </li>
                                <li>
                                    <strong className="text-gray-800">Phone:</strong> {quote.client?.client_phone || '_'}
                                </li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h5 className="text-sm font-semibold text-gray-800">Service Details</h5>
                            <ul className="space-y-1 text-sm text-gray-600">
                                <li>
                                    <strong className="text-gray-800">Service Name:</strong> {quote.service_data?.service_name || '—'}
                                </li>
                                <li>
                                    <strong className="text-gray-800">Description:</strong> {quote.service_data?.description || '—'}
                                </li>
                                <li>
                                    <strong className="text-gray-800">Price:</strong> ${quote.service_data?.price} {quote.service_data?.currency}
                                </li>
                                <li className="flex items-center gap-2">
                                    <strong className="text-gray-800">Service Type:</strong>
                                    <span className="inline-flex items-center rounded-full bg-gray-800 px-3 py-1 text-xs font-semibold text-white">
                                        {quote.service_data?.service_type}
                                    </span>
                                </li>
                                <li>
                                    <strong className="text-gray-800">Billing Cycle:</strong> {quote.service_data?.billing_cycle || '—'}
                                </li>
                                <li>
                                    <strong className="text-gray-800">Start Date:</strong>{' '}
                                    {quote.service_data?.start_date
                                        ? new Date(quote.service_data.start_date).toLocaleDateString()
                                        : '—'}
                                </li>
                                <li>
                                    <strong className="text-gray-800">End Date:</strong>{' '}
                                    {quote.service_data?.end_date
                                        ? new Date(quote.service_data.end_date).toLocaleDateString()
                                        : '—'}
                                </li>
                                <li>
                                    <strong className="text-gray-800">Service Address:</strong> {quote.service_data?.street_address || '_'}, {quote.service_data?.city || '_'}, {quote.service_data?.country || '_'}, {quote.service_data?.postal_code || '_'}
                                </li>
                                <li>
                                    <strong className="text-gray-800">Notes:</strong> {quote.notes || 'No notes added.'}
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h5 className="mb-2 text-sm font-semibold text-gray-800">Service Questionnaire Responses</h5>
                            <ul className="space-y-2 text-sm text-gray-600">
                                {quote?.service_data?.filled_questionnaire &&
                                Object.keys(quote.service_data.filled_questionnaire).length > 0 ? (
                                    Object.entries(quote.service_data.filled_questionnaire).map(([q, a]) => (
                                        <li key={q} className="rounded-lg bg-gray-50 px-3 py-2">
                                            <strong className="text-gray-800">{q}:</strong> {Array.isArray(a) ? a.join(', ') : a}
                                        </li>
                                    ))
                                ) : (
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <i className="fa fa-info-circle"></i>
                                        <span>No questionnaire responses available.</span>
                                    </div>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <h5 className="text-sm font-semibold text-gray-800">Terms & Conditions</h5>
                    <p className="mt-2 text-sm text-gray-700">{quote.terms_conditions || '_'}</p>
                </div>

                <div className="mt-6">
                    {isFinalized ? (
                        <div
                            className={`rounded-lg px-4 py-3 ${
                                status === 'DECLINED'
                                    ? 'border border-rose-200 bg-rose-50 text-rose-800'
                                    : 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                            }`}
                        >
                            {status === 'SIGNED' ? (
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div>
                                        <p className="mb-2 font-semibold">This quote has been signed successfully.</p>
                                        <p className="mb-1 text-sm">Signed on: <strong>{formatDate(quote.signed_at)}</strong></p>
                                        <p className="mb-1 text-sm">Signed by: <strong>{quote.client.client_name}</strong></p>
                                    </div>
                                    <div className="flex items-center justify-start lg:justify-end">
                                        {quote.signature && (
                                            <img
                                                src={
                                                    quote.signature.startsWith('http')
                                                        ? quote.signature
                                                        : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${quote.signature}`
                                                }
                                                alt="Signed Document"
                                                className="h-20 rounded border border-gray-200 bg-white p-2"
                                            />
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm">
                                    This quote has been <strong>declined</strong>
                                    {quote.signed_at && (
                                        <>
                                            {' '}
                                            on <strong>{new Date(quote.signed_at).toLocaleString()}</strong>
                                        </>
                                    )}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="mt-3 flex justify-end gap-3">
                            <button
                                className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={() => setShowDeclineModal(true)}
                                disabled={signing || timeRemaining === 'Expired'}
                            >
                                Decline
                            </button>
                            <button
                                className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentLight disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={() => setShowSignModal(true)}
                                disabled={signing || timeRemaining === 'Expired' || status !== 'SENT'}
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
                            <h5 className="flex items-center gap-2 text-base font-semibold text-rose-700">
                                <i className="fa fa-exclamation-triangle"></i>
                                Confirm Decline
                            </h5>
                            <button
                                type="button"
                                className="text-gray-500 transition hover:text-gray-800"
                                onClick={() => setShowDeclineModal(false)}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>
                        <div className="px-5 py-4 text-sm text-gray-700">
                            <p className="mb-0">
                                Are you sure you want to <strong>decline</strong> this quote? <br />
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 border-t border-gray-100 px-5 py-4">
                            <button
                                type="button"
                                className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={() => setShowDeclineModal(false)}
                                disabled={signing}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="inline-flex items-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={handleDeclineConfirm}
                                disabled={signing}
                            >
                                {signing ? 'Declining...' : 'Yes, Decline'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
