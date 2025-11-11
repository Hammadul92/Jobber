import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFetchQuoteQuery, useUpdateQuoteMutation, useSendQuoteMutation } from '../../../../store';
import SubmitButton from '../../../../utils/SubmitButton';
import AlertDispatcher from '../../../../utils/AlertDispatcher';
import { formatDate } from '../../../../utils/formatDate';

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
            <div className="alert alert-danger" role="alert">
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
            ? 'success'
            : quoteData.status === 'SENT'
              ? 'primary'
              : quoteData.status === 'EXPIRED'
                ? 'danger'
                : 'secondary';

    return (
        <>
            <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to={`/`} className="text-success">
                            Contractorz
                        </Link>
                    </li>
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
                        Edit Quote ({quoteData.quote_number})
                    </li>
                </ol>
            </nav>

            {alert.message && (
                <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: '', message: '' })}
                />
            )}

            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="mb-0">
                    {quoteData.quote_number}{' '}
                    <span className={`badge bg-gradient bg-${statusColor} rounded-pill`}>{quoteData.status}</span>
                </h3>

                <div className="text-end">
                    <button
                        type="button"
                        className="btn btn-primary bg-gradient"
                        onClick={handleSendQuote}
                        disabled={disableSendBtn || sending}
                    >
                        {sending ? (
                            <>
                                <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                    aria-hidden="true"
                                ></span>
                                Sending Quote...
                            </>
                        ) : (
                            'Send Quote'
                        )}
                    </button>
                </div>
            </div>

            {disableSendBtn && (
                <div className="alert alert-warning mb-3">
                    <strong>Note:</strong>
                    <ul className="mb-0 ps-3">
                        {disableReasons.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                        ))}
                    </ul>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="row">
                    <div className="col-md-4">
                        <div className="shadow-sm p-3 rounded mb-3 position-relative">
                            <div className="position-absolute top-0 end-0 mt-2 me-2">
                                {quoteData.client.is_active === 'True' ? (
                                    <span className="badge bg-success rounded-pill bg-gradient">ACTIVE</span>
                                ) : (
                                    <span className="badge bg-danger rounded-pill bg-gradient">INACTIVE</span>
                                )}
                            </div>

                            <h5>Client Details</h5>

                            <p className="mb-1 small text-muted">Name: {quoteData.client_name}</p>
                            <p className="mb-1 small text-muted">Email: {quoteData.client.client_email}</p>
                            <p className="mb-1 small text-muted">Phone: {quoteData.client.client_phone}</p>
                        </div>

                        <div className="shadow-sm p-3 rounded mb-3 position-relative">
                            <div className="position-absolute top-0 end-0 mt-2 me-2 d-flex gap-1 flex-wrap justify-content-end">
                                <span className="badge bg-dark rounded-pill bg-gradient">
                                    {quoteData.service_data.service_type}
                                </span>
                                <span
                                    className={`badge rounded-pill bg-gradient ${
                                        ['ACTIVE', 'COMPLETED'].includes(quoteData.service_data.status)
                                            ? 'bg-success'
                                            : quoteData.service_data.status === 'PENDING'
                                              ? 'bg-primary'
                                              : 'bg-danger'
                                    }`}
                                >
                                    {quoteData.service_data.status}
                                </span>
                            </div>

                            <h5>Service Details</h5>

                            <p className="mb-1 small text-muted">
                                Name:{' '}
                                <Link to={`/dashboard/service/${quoteData.service_data.id}`} className="text-success">
                                    {quoteData.service_data.service_name}
                                </Link>
                            </p>

                            {quoteData.service_data.description && (
                                <p className="mb-1 small p-2 bg-light rounded-3">
                                    <i className="fa fa-info"></i> {quoteData.service_data.description}
                                </p>
                            )}
                            <p className="mb-1 small text-muted">
                                Price: ${quoteData.service_data.price} {quoteData.service_data.currency}
                            </p>
                            <p className="mb-1 small text-muted">
                                Billing Cycle: {quoteData.service_data.billing_cycle || '-'}
                            </p>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <p className="small text-muted mb-0">Start Date: {quoteData.service_data.start_date}</p>
                                <p className="small text-muted mb-0">
                                    End Date: {quoteData.service_data.end_date || '-'}
                                </p>
                            </div>
                            <p className="mb-1 small text-muted">
                                Service Address: {quoteData.service_data.street_address}, {quoteData.service_data.city},{' '}
                                {quoteData.service_data.province_state}, {quoteData.service_data.country},{' '}
                                {quoteData.service_data.postal_code}
                            </p>
                        </div>
                    </div>

                    <div className="col-md-8">
                        <div className="shadow-sm p-3 bg-white rounded">
                            <div className="row">
                                <div className="col-md-4">
                                    <div className="field-wrapper">
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formatDate(quoteData.signed_at)}
                                            disabled
                                        />
                                        <label className="form-label">Signed At</label>
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <div className="field-wrapper">
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={validUntil}
                                            onChange={(e) => setValidUntil(e.target.value)}
                                            disabled={isSigned}
                                            required
                                        />
                                        <label className="form-label">Valid Until (*)</label>
                                    </div>
                                </div>
                            </div>

                            <div className="field-wrapper">
                                <textarea
                                    className="form-control"
                                    rows="4"
                                    value={termsConditions}
                                    onChange={(e) => setTermsConditions(e.target.value)}
                                    disabled={isSigned}
                                    required
                                ></textarea>
                                <label className="form-label">Terms & Conditions (*)</label>
                            </div>

                            <div className="field-wrapper">
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    disabled={isSigned}
                                ></textarea>
                                <label className="form-label">Notes</label>
                            </div>

                            <div className="d-flex justify-content-end mt-3">
                                <button
                                    type="button"
                                    className="btn btn-dark me-2"
                                    onClick={() => navigate('/dashboard/quotes')}
                                >
                                    Cancel
                                </button>
                                {!isSigned && (
                                    <SubmitButton
                                        isLoading={updating}
                                        btnClass="btn btn-success"
                                        btnName="Save Changes"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
}
