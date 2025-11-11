import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFetchQuoteQuery, useSignQuoteMutation } from '../../../../store';
import AcceptAndSignQuote from './AcceptAndSignQuote';
import AlertDispatcher from '../../../../utils/AlertDispatcher';
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
            <div className="alert alert-danger" role="alert">
                {error?.data?.detail || 'Failed to load quote.'}
            </div>
        );

    if (!quote) {
        return (
            <div className="alert alert-warning text-center my-5">
                <i className="fa fa-exclamation-circle me-2"></i>
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

            <nav aria-label="breadcrumb" className="mb-3">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to={`/dashboard/home`} className="text-success">
                            Dashboard
                        </Link>
                    </li>
                    <li className="breadcrumb-item">
                        <Link to={`/dashboard/quotes`} className="text-success">
                            Quotes
                        </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        Quote ({quote.quote_number})
                    </li>
                </ol>
            </nav>

            <div className="shadow p-4 bg-white rounded">
                <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
                    <h4 className="mb-0 fw-semibold">
                        <i className="far fa-file-text text-secondary me-2"></i>
                        {quote.business_name} (Quote # {quote.quote_number})
                    </h4>

                    {quote.valid_until && status === 'SENT' && (
                        <div className="text-end">
                            <div className="d-flex align-items-center justify-content-end">
                                <i className="far fa-clock text-secondary me-2"></i>
                                <span className="fw-semibold text-dark">
                                    Valid Until:{' '}
                                    <span className="text-muted">{new Date(quote.valid_until).toLocaleString()}</span>
                                </span>
                            </div>

                            <div
                                className={`mt-1 fw-semibold ${
                                    timeRemaining === 'Expired' ? 'text-danger' : 'text-success'
                                }`}
                                style={{ fontSize: '0.95rem' }}
                            >
                                {timeRemaining === 'Expired'
                                    ? 'This quote has expired.'
                                    : `Time left: ${timeRemaining}`}
                            </div>
                        </div>
                    )}
                </div>

                <div className="row mb-3">
                    <div className="col-md-6 mb-4 mb-md-0">
                        <h5 className="mb-2">Client Details</h5>
                        <ul className="list-unstyled small text-muted">
                            <li>
                                <strong>Name:</strong> {quote.client_name || '_'}
                            </li>
                            <li>
                                <strong>Email:</strong> {quote.client?.client_email || '_'}
                            </li>
                            <li>
                                <strong>Phone:</strong> {quote.client?.client_phone || '_'}
                            </li>
                        </ul>

                        <h5 className="mb-2">Service Details</h5>
                        <ul className="list-unstyled small text-muted">
                            <li>
                                <strong>Service Name:</strong> {quote.service_data?.service_name || '—'}
                            </li>
                            <li>
                                <strong>Description:</strong> {quote.service_data?.description || '—'}
                            </li>
                            <li>
                                <strong>Price:</strong> ${quote.service_data?.price} {quote.service_data?.currency}
                            </li>
                            <li>
                                <strong>Service Type:</strong>{' '}
                                <span className="badge bg-dark rounded-pill bg-gradient">
                                    {quote.service_data?.service_type}
                                </span>
                            </li>
                            <li>
                                <strong>Billing Cycle:</strong> {quote.service_data?.billing_cycle || '—'}
                            </li>
                            <li>
                                <strong>Start Date:</strong>{' '}
                                {quote.service_data?.start_date
                                    ? new Date(quote.service_data.start_date).toLocaleDateString()
                                    : '—'}
                            </li>
                            <li>
                                <strong>End Date:</strong>{' '}
                                {quote.service_data?.end_date
                                    ? new Date(quote.service_data.end_date).toLocaleDateString()
                                    : '—'}
                            </li>
                            <li>
                                <strong>Service Address:</strong> {quote.service_data?.street_address || '_'},{' '}
                                {quote.service_data?.city || '_'}, {quote.service_data?.country || '_'},{' '}
                                {quote.service_data?.postal_code || '_'}
                            </li>
                            <li>
                                <strong>Notes:</strong> {quote.notes || 'No notes added.'}
                            </li>
                        </ul>
                    </div>

                    <div className="col-md-6">
                        <div>
                            <h5 className="mb-2">Service Questionnaire Responses</h5>
                            <ul className="list-unstyled small text-muted">
                                {quote?.service_data?.filled_questionnaire &&
                                Object.keys(quote.service_data.filled_questionnaire).length > 0 ? (
                                    Object.entries(quote.service_data.filled_questionnaire).map(([q, a]) => (
                                        <li className="mb-2" key={q}>
                                            <strong className="text-dark">{q}:</strong>{' '}
                                            {Array.isArray(a) ? a.join(', ') : a}
                                        </li>
                                    ))
                                ) : (
                                    <i>
                                        <i className="fa fa-info-circle me-2"></i>
                                        No questionnaire responses available.
                                    </i>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <h5 className="text-muted">Terms & Conditions</h5>
                    <p>{quote.terms_conditions || '_'}</p>
                </div>

                <div>
                    {isFinalized ? (
                        <div className={`alert alert-${status === 'DECLINED' ? 'danger' : 'success'} mt-3`}>
                            {status === 'SIGNED' ? (
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-2">
                                            <strong>This quote has been signed successfully.</strong>
                                        </div>

                                        <p className="mb-1">
                                            Signed on: <strong>{formatDate(quote.signed_at)}</strong>
                                        </p>
                                        <p className="mb-1">
                                            Signed by: <strong>{quote.client.client_name}</strong>
                                        </p>
                                    </div>
                                    <div className="col-md-6">
                                        {quote.signature && (
                                            <div>
                                                <img
                                                    src={
                                                        quote.signature.startsWith('http')
                                                            ? quote.signature
                                                            : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${quote.signature}`
                                                    }
                                                    alt="Signed Document"
                                                    className="border rounded bg-white p-2"
                                                    style={{ height: '80px' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    This quote has been <strong>declined</strong>
                                    {quote.signed_at && (
                                        <>
                                            {' '}
                                            on <strong>{new Date(quote.signed_at).toLocaleString()}</strong>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <button
                                className="btn btn-danger bg-gradient"
                                onClick={() => setShowDeclineModal(true)}
                                disabled={signing || timeRemaining === 'Expired'}
                            >
                                Decline
                            </button>
                            <button
                                className="btn btn-success bg-gradient"
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
                    className="modal fade show"
                    style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    tabIndex="-1"
                    role="dialog"
                >
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title text-danger">
                                    <i className="fa fa-exclamation-triangle me-2"></i>
                                    Confirm Decline
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowDeclineModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p className="mb-0">
                                    Are you sure you want to <strong>decline</strong> this quote? <br />
                                    This action cannot be undone.
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => setShowDeclineModal(false)}
                                    disabled={signing}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-danger"
                                    onClick={handleDeclineConfirm}
                                    disabled={signing}
                                >
                                    {signing ? 'Declining...' : 'Yes, Decline'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
