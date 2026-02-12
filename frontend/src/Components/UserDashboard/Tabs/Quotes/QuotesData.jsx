import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFetchQuotesQuery, useDeleteQuoteMutation } from '../../../../store';
import Select from '../../../ui/Select';
import SubmitButton from '../../../ui/SubmitButton';
import { formatDate } from '../../../../utils/formatDate';

export default function QuotesData({ token, role, setAlert }) {
    const { data: quoteData, isLoading, error, refetch } = useFetchQuotesQuery(undefined, { skip: !token });

    const [deleteQuote, { isLoading: deleting }] = useDeleteQuoteMutation();
    const [showModal, setShowModal] = useState(false);
    const [selectedQuoteId, setSelectedQuoteId] = useState(null);

    const [serviceFilter, setServiceFilter] = useState('');
    const [clientFilter, setClientFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const quotes = quoteData || [];

    const uniqueServices = useMemo(() => [...new Set(quotes.map((q) => q.service_name).filter(Boolean))], [quotes]);
    const uniqueClients = useMemo(() => [...new Set(quotes.map((q) => q.client_name).filter(Boolean))], [quotes]);
    const uniqueStatuses = useMemo(() => [...new Set(quotes.map((q) => q.status).filter(Boolean))], [quotes]);

    const filteredQuotes = useMemo(() => {
        return quotes.filter((q) => {
            const matchService = !serviceFilter || q.service_name === serviceFilter;
            const matchClient = !clientFilter || q.client_name === clientFilter;
            const matchStatus = !statusFilter || q.status === statusFilter;
            return matchService && matchClient && matchStatus;
        });
    }, [quotes, serviceFilter, clientFilter, statusFilter]);

    useEffect(() => {
        if (error) {
            setAlert({
                type: 'danger',
                message: error?.data?.detail || 'Failed to load quotes. Please try again later.',
            });
        }
    }, [error, setAlert]);

    const handleDeleteClick = (id) => {
        setSelectedQuoteId(id);
        setShowModal(true);
    };

    const confirmDelete = async (e) => {
        e.preventDefault();
        if (!selectedQuoteId) return;
        try {
            await deleteQuote(selectedQuoteId).unwrap();
            setAlert({ type: 'success', message: 'Quote deleted successfully!' });
            setShowModal(false);
            setSelectedQuoteId(null);
            refetch();
        } catch (err) {
            console.error('Failed to delete quote:', err);
            setAlert({
                type: 'danger',
                message: err?.data?.detail || 'Failed to delete quote. Please try again later.',
            });
        }
    };

    if (isLoading) return <div>Loading quotes...</div>;

    const today = new Date();

    return (
        <>
            <div className="grid gap-4 md:grid-cols-3">
                <Select
                    id="quotes-service-filter"
                    label="Service"
                    value={serviceFilter}
                    onChange={setServiceFilter}
                    options={[
                        { value: '', label: 'All Services' },
                        ...uniqueServices.map((name) => ({ value: name, label: name })),
                    ]}
                />

                <Select
                    id="quotes-client-filter"
                    label="Client"
                    value={clientFilter}
                    onChange={setClientFilter}
                    options={[
                        { value: '', label: 'All Clients' },
                        ...uniqueClients.map((name) => ({ value: name, label: name })),
                    ]}
                />

                <Select
                    id="quotes-status-filter"
                    label="Status"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                        { value: '', label: 'All Statuses' },
                        ...uniqueStatuses.map((status) => ({ value: status, label: status })),
                    ]}
                />
            </div>

            {filteredQuotes.length === 0 ? (
                <div className="min-h-[65vh] rounded-xl border border-dashed border-gray-200 bg-white text-center">
                    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-gray-600">
                        <p className="text-base font-semibold text-gray-800">No quotes found.</p>
                        <p className="text-sm text-gray-500">Try adjusting your filters or create a new quote.</p>
                    </div>
                </div>
            ) : (
                <div className="min-h-[65vh] max-h-[65vh] overflow-auto grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredQuotes.map((quote) => {
                        const validUntilDate = quote.valid_until ? new Date(quote.valid_until) : null;
                        const isExpired = validUntilDate && validUntilDate < today;

                        let badgeClass = 'bg-blue-100 text-blue-700';
                        let badgeText = quote.status;

                        if (isExpired && quote.status !== 'SIGNED') {
                            badgeClass = 'bg-rose-100 text-rose-700';
                            badgeText = 'EXPIRED';
                        } else if (quote.status === 'SIGNED') {
                            badgeClass = 'bg-emerald-100 text-emerald-700';
                        } else if (quote.status === 'DECLINED') {
                            badgeClass = 'bg-rose-100 text-rose-700';
                        } else if (quote.status === 'DRAFT') {
                            badgeClass = 'bg-gray-100 text-gray-700';
                        }

                        return (
                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm" key={quote.quote_number}>
                                <div className="mb-3 flex items-start justify-between gap-3">
                                    <h5 className="text-base font-semibold text-gray-900">{quote.quote_number}</h5>
                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                                        {badgeText}
                                    </span>
                                </div>

                                <p className="mb-2 rounded-lg bg-gray-50 p-2 text-center text-sm text-gray-700">
                                    {role === 'MANAGER' ? (
                                        <Link
                                            className="font-semibold text-accent hover:text-accentLight"
                                            to={`/dashboard/service/${quote.service_data.id}`}
                                        >
                                            {quote.service_name}
                                        </Link>
                                    ) : (
                                        quote.service_name
                                    )}{' '}
                                    service for {quote.client_name}
                                </p>

                                {!isExpired && quote.status !== 'SIGNED' ? (
                                    <p className="mb-1 text-sm text-gray-600">Valid Until: {formatDate(quote.valid_until)}</p>
                                ) : isExpired && quote.status !== 'SIGNED' ? (
                                    <p className="mb-1 text-sm font-semibold text-rose-700">
                                        Expired on: {formatDate(quote.valid_until)}
                                    </p>
                                ) : null}

                                <p className="text-sm text-gray-600">
                                    Service Address: {quote.service_data.street_address}, {quote.service_data.city}, {quote.service_data.province_state}, {quote.service_data.country}, {quote.service_data.postal_code}
                                </p>

                                <div className="mt-4 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        {quote.signature && (
                                            <img
                                                src={quote.signature}
                                                height={36}
                                                alt="signature"
                                                className="h-9 rounded border border-gray-200 bg-white p-1"
                                            />
                                        )}
                                    </div>
                                    <div className="flex flex-wrap justify-end gap-2">
                                        {role === 'MANAGER' && (
                                            <Link
                                                to={`/dashboard/quote/${quote.id}`}
                                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                                                title="Edit Quote"
                                            >
                                                <i className="fa fa-pencil"></i> Edit
                                            </Link>
                                        )}

                                        {!isExpired && quote.status === 'SENT' && role === 'CLIENT' && (
                                            <Link
                                                to={`/dashboard/quote/sign/${quote.id}`}
                                                className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-accentLight"
                                                title="Sign Quote"
                                            >
                                                <i className="fas fa-file-signature" /> Sign
                                            </Link>
                                        )}

                                        {role === 'MANAGER' && (
                                            <button
                                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100"
                                                onClick={() => handleDeleteClick(quote.id)}
                                                type="button"
                                            >
                                                <i className="fa fa-trash-alt"></i> Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && (
                <form
                    onSubmit={confirmDelete}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="max-w-md rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                            <h5 className="text-base font-semibold text-gray-900">Delete Quote</h5>
                            <button
                                type="button"
                                className="text-gray-500 transition hover:text-gray-800"
                                onClick={() => setShowModal(false)}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>
                        <div className="px-5 py-4 text-sm text-gray-700">
                            <p className="mb-0">Are you sure you want to delete this quote?</p>
                        </div>
                        <div className="flex justify-end gap-3 border-t border-gray-100 px-5 py-4">
                            <button
                                type="button"
                                className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <SubmitButton
                                isLoading={deleting}
                                btnClass="bg-rose-600 px-4 py-2 text-sm text-white shadow-sm hover:bg-rose-700"
                                btnName="Delete"
                            />
                        </div>
                    </div>
                </form>
            )}
        </>
    );
}
