import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFetchQuotesQuery, useDeleteQuoteMutation } from '../../../../store';
import SubmitButton from '../../../../utils/SubmitButton';
import { formatDate } from '../../../../utils/formatDate';

export default function QuotesData({ token, role, setAlert }) {
    const { data: quoteData, isLoading, error, refetch } = useFetchQuotesQuery(undefined, { skip: !token });

    const [deleteQuote, { isLoading: deleting }] = useDeleteQuoteMutation();
    const [showModal, setShowModal] = useState(false);
    const [selectedQuoteId, setSelectedQuoteId] = useState(null);

    // --- Filters ---
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
            <div className="row mb-3">
                <div className="col-md-2">
                    <div className="field-wrapper">
                        <select
                            className="form-select"
                            value={serviceFilter}
                            onChange={(e) => setServiceFilter(e.target.value)}
                        >
                            <option value="">All Services</option>
                            {uniqueServices.map((name, idx) => (
                                <option key={idx} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                        <label className="form-label">Service</label>
                    </div>
                </div>

                <div className="col-md-2">
                    <div className="field-wrapper">
                        <select
                            className="form-select"
                            value={clientFilter}
                            onChange={(e) => setClientFilter(e.target.value)}
                        >
                            <option value="">All Clients</option>
                            {uniqueClients.map((name, idx) => (
                                <option key={idx} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                        <label className="form-label">Client</label>
                    </div>
                </div>

                <div className="col-md-2">
                    <div className="field-wrapper">
                        <select
                            className="form-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            {uniqueStatuses.map((status, idx) => (
                                <option key={idx} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                        <label className="form-label">Status</label>
                    </div>
                </div>
            </div>

            {filteredQuotes.length === 0 ? (
                <div className="text-center py-5 text-muted">
                    <p className="mb-0">No quotes found.</p>
                </div>
            ) : (
                <div className="row">
                    {filteredQuotes.map((quote) => {
                        const validUntilDate = quote.valid_until ? new Date(quote.valid_until) : null;
                        const isExpired = validUntilDate && validUntilDate < today;

                        let badgeClass = 'bg-primary';
                        let badgeText = quote.status;

                        if (isExpired && quote.status !== 'SIGNED') {
                            badgeClass = 'bg-danger';
                            badgeText = 'EXPIRED';
                        } else if (quote.status === 'SIGNED') {
                            badgeClass = 'bg-success';
                        } else if (quote.status === 'DECLINED') {
                            badgeClass = 'bg-danger';
                        } else if (quote.status === 'DRAFT') {
                            badgeClass = 'bg-secondary';
                        }

                        return (
                            <div className="col-md-6 col-lg-3 mb-3" key={quote.quote_number}>
                                <div className="card shadow-sm border-0 h-100">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <h5 className="card-title mb-0">{quote.quote_number}</h5>
                                            <span className={`badge rounded-pill bg-gradient ms-2 ${badgeClass}`}>
                                                {badgeText}
                                            </span>
                                        </div>

                                        <p className="small mb-2 p-2 bg-light rounded-3 text-center">
                                            {role === 'MANAGER' ? (
                                                <Link
                                                    className="text-success"
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
                                            <p className="text-muted small mb-1">
                                                Valid Until: {formatDate(quote.valid_until)}
                                            </p>
                                        ) : isExpired && quote.status !== 'SIGNED' ? (
                                            <p className="text-danger small mb-1">
                                                Expired on: {formatDate(quote.valid_until)}
                                            </p>
                                        ) : null}

                                        <p className="text-muted small">
                                            Service Address: {quote.service_data.street_address},{' '}
                                            {quote.service_data.city}, {quote.service_data.province_state},{' '}
                                            {quote.service_data.country}, {quote.service_data.postal_code}
                                        </p>

                                        <div className="d-flex justify-content-between align-items-center gap-2">
                                            <div>
                                                {quote.signature && (
                                                    <img src={quote.signature} height={36} alt="signature" />
                                                )}
                                            </div>
                                            <div>
                                                {role === 'MANAGER' && (
                                                    <Link
                                                        to={`/dashboard/quote/${quote.id}`}
                                                        className="btn btn-light rounded-circle py-1 px-2 border-0 fs-6 me-2"
                                                        title="Edit Quote"
                                                    >
                                                        <i className="fa fa-pencil"></i>
                                                    </Link>
                                                )}

                                                {!isExpired && quote.status === 'SENT' && role === 'CLIENT' && (
                                                    <Link
                                                        to={`/dashboard/quote/sign/${quote.id}`}
                                                        className="btn btn-light rounded-circle py-1 px-2 border-0 fs-6 me-2"
                                                        title="Sign Quote"
                                                    >
                                                        <i className="fas fa-file-signature" />
                                                    </Link>
                                                )}

                                                {role === 'MANAGER' && (
                                                    <button
                                                        className="btn btn-light rounded-circle py-1 px-2 border-0 fs-6"
                                                        onClick={() => handleDeleteClick(quote.id)}
                                                        title="Delete Quote"
                                                    >
                                                        <i className="fa fa-trash-alt"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* --- DELETE MODAL --- */}
            {showModal && (
                <form onSubmit={confirmDelete} className="modal d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Delete Quote</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete this quote?</p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-dark"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <SubmitButton isLoading={deleting} btnClass="btn btn-sm btn-danger" btnName="Delete" />
                            </div>
                        </div>
                    </div>
                </form>
            )}
            {showModal && <div className="modal-backdrop fade show"></div>}
        </>
    );
}
