import { useState } from 'react';
import { useFetchServicesQuery, useCreateQuoteMutation } from '../../../../store';
import SubmitButton from '../../../../utils/SubmitButton';

export default function CreateQuoteForm({ token, showModal, setShowModal, setAlert }) {
    const [serviceId, setServiceId] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [termsConditions, setTermsConditions] = useState('');
    const [notes, setNotes] = useState('');

    const { data: services } = useFetchServicesQuery(undefined, { skip: !token });
    const [createQuote, { isLoading: isCreating }] = useCreateQuoteMutation();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await createQuote({
                service: serviceId,
                valid_until: validUntil,
                terms_conditions: termsConditions,
                notes,
            }).unwrap();

            setAlert({
                type: 'success',
                message: 'Quote created successfully!',
            });

            setServiceId('');
            setValidUntil('');
            setTermsConditions('');
            setNotes('');
        } catch (err) {
            console.error('Create quote error:', err);
            setAlert({
                type: 'danger',
                message: 'Something went wrong while creating the quote. Please try again.',
            });
        }

        setShowModal(false);
    };

    const isSubmitting = isCreating;

    return (
        <>
            {showModal && (
                <div className="modal d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Create New Quote</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="mb-3 col-md-8">
                                            <label className="form-label">Service (*)</label>
                                            <select
                                                className="form-select"
                                                value={serviceId}
                                                onChange={(e) => setServiceId(e.target.value)}
                                                required
                                            >
                                                <option value="">Select Service</option>
                                                {services?.map((service) => (
                                                    <option key={service.id} value={service.id}>
                                                        {service.service_name} for {service.client_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="mb-3 col-md-4">
                                            <label className="form-label">Valid Until (*)</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={validUntil}
                                                onChange={(e) => setValidUntil(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="mb-3 col-md-12">
                                            <label className="form-label">Terms & Conditions (*)</label>
                                            <textarea
                                                className="form-control"
                                                rows="3"
                                                value={termsConditions}
                                                onChange={(e) => setTermsConditions(e.target.value)}
                                                placeholder="Enter any special terms or agreement details"
                                                required
                                            ></textarea>
                                        </div>

                                        <div className="mb-3 col-md-12">
                                            <label className="form-label">Notes</label>
                                            <textarea
                                                className="form-control"
                                                rows="2"
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Internal notes or remarks"
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-dark"
                                        onClick={() => setShowModal(false)}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <SubmitButton
                                        isLoading={isSubmitting}
                                        btnClass="btn btn-sm btn-success"
                                        btnName="Create Quote"
                                    />
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {showModal && <div className="modal-backdrop fade show"></div>}
        </>
    );
}
