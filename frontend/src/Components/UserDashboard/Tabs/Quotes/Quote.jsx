import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFetchQuoteQuery, useUpdateQuoteMutation, useSendQuoteMutation } from '../../../../store';
import SubmitButton from '../../../../utils/SubmitButton';

export default function Quote({ token }) {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: quoteData, isLoading, error } = useFetchQuoteQuery(id, { skip: !token });
    const [updateQuote, { isLoading: updating, error: updateError, isSuccess }] = useUpdateQuoteMutation();
    const [sendQuote, { isLoading: sending, isSuccess: sentSuccess, error: sendError }] = useSendQuoteMutation();

    const [validUntil, setValidUntil] = useState('');
    const [termsConditions, setTermsConditions] = useState('');
    const [notes, setNotes] = useState('');

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
        } catch (err) {
            console.error('Failed to update quote:', err);
        }
    };

    const handleSendQuote = async () => {
        try {
            await sendQuote(id).unwrap();
        } catch (err) {
            console.error('Failed to send quote:', err);
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
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="mb-0">
                    Quote: {quoteData.quote_number}{' '}
                    <span className={`badge bg-${statusColor} rounded-pill`}>{quoteData.status}</span>
                </h3>

                <button
                    type="button"
                    className="btn btn-primary"
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
                            Sending...
                        </>
                    ) : (
                        <>
                            <i className="fa fa-paper-plane me-2"></i>
                            Send Quote
                        </>
                    )}
                </button>
            </div>

            {sendError && (
                <div className="alert alert-danger mb-3">
                    {sendError?.data?.detail || 'Failed to send quote email.'}
                </div>
            )}
            {sentSuccess && <div className="alert alert-success mb-3">Quote email sent successfully!</div>}

            <form onSubmit={handleSubmit}>
                {updateError && (
                    <div className="alert alert-danger mb-3">
                        {updateError?.data?.detail || 'Failed to update quote.'}
                    </div>
                )}
                {isSuccess && <div className="alert alert-success mb-3">Quote updated successfully!</div>}

                <div className="row">
                    <div className="col-md-4">
                        <div className="shadow p-3 bg-white rounded-3 mb-3">
                            <h6 className="text-muted">Client Details</h6>

                            <div className="mb-1">
                                <strong>Name: </strong>
                                <Link
                                    to={`/dashboard/client/${quoteData.client.id}`}
                                    className="text-success text-decoration-none"
                                >
                                    {quoteData.client_name}
                                </Link>{' '}
                                {quoteData.client.is_active === 'True' ? (
                                    <span className="badge bg-success rounded-pill">ACTIVE</span>
                                ) : (
                                    <span className="badge bg-danger rounded-pill">INACTIVE</span>
                                )}
                            </div>
                            <div className="mb-1">
                                <strong>Email: </strong> {quoteData.client.client_email}
                            </div>
                            <div className="mb-1">
                                <strong>Phone: </strong> {quoteData.client.client_phone}
                            </div>
                            <div className="mb-1">
                                <strong>Billing Address: </strong>
                                {quoteData.client.street_address}, {quoteData.client.city},{' '}
                                {quoteData.client.province_state}, {quoteData.client.country},{' '}
                                {quoteData.client.postal_code}
                            </div>
                        </div>

                        <div className="shadow p-3 bg-white rounded-3 mb-3">
                            <h6 className="text-muted">Service Details</h6>
                            <div className="mb-2">
                                <strong>Name: </strong>
                                <Link
                                    to={`/dashboard/service/${quoteData.service_data.id}`}
                                    className="text-decoration-none text-success"
                                >
                                    {quoteData.service_data.service_name}
                                </Link>{' '}
                                <span className="badge bg-dark rounded-pill">
                                    {quoteData.service_data.service_type}
                                </span>
                            </div>
                            {quoteData.service_data.description && (
                                <p className="bg-light p-2 mb-2 rounded">
                                    <i className="fa fa-info"></i> {quoteData.service_data.description}
                                </p>
                            )}
                            <div className="mb-1">
                                <strong>Price: </strong> ${quoteData.service_data.price}{' '}
                                {quoteData.service_data.currency}
                            </div>
                            <div className="mb-1">
                                <strong>Billing Cycle: </strong> {quoteData.service_data.billing_cycle || '-'}
                            </div>
                            <div className="mb-1 row">
                                <div className="col-md-6">
                                    <strong>Start Date: </strong> {quoteData.service_data.start_date}
                                </div>
                                <div className="col-md-6">
                                    <strong>End Date: </strong> {quoteData.service_data.end_date || '-'}
                                </div>
                            </div>
                            <div className="mb-1">
                                <strong>Service Address: </strong>
                                {quoteData.service_data.street_address}, {quoteData.service_data.city},{' '}
                                {quoteData.service_data.province_state}, {quoteData.service_data.country},{' '}
                                {quoteData.service_data.postal_code}
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT: FORM --- */}
                    <div className="col-md-8">
                        <div className="row mb-3">
                            <div className="col-md-4">
                                <label className="form-label">Signed By</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={quoteData.signed_by || ''}
                                    disabled
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">Signed At</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={quoteData.signed_at ? new Date(quoteData.signed_at).toLocaleString() : ''}
                                    disabled
                                />
                            </div>

                            <div className="col-md-4">
                                <label className="form-label">Valid Until (*)</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={validUntil}
                                    onChange={(e) => setValidUntil(e.target.value)}
                                    disabled={isSigned}
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Terms & Conditions (*)</label>
                            <textarea
                                className="form-control"
                                rows="4"
                                value={termsConditions}
                                onChange={(e) => setTermsConditions(e.target.value)}
                                disabled={isSigned}
                                required
                            ></textarea>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Notes</label>
                            <textarea
                                className="form-control"
                                rows="3"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                disabled={isSigned}
                            ></textarea>
                        </div>

                        <div className="d-flex justify-content-end">
                            <button
                                type="button"
                                className="btn btn-dark me-2"
                                onClick={() => navigate('/dashboard/quotes')}
                            >
                                Cancel
                            </button>
                            {!isSigned && (
                                <SubmitButton isLoading={updating} btnClass="btn btn-success" btnName="Save Changes" />
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
}
