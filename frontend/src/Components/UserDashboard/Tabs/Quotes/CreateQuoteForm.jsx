import { useState } from 'react';
import { useFetchQuotesQuery, useFetchServicesQuery, useCreateQuoteMutation } from '../../../../store';
import SubmitButton from '../../../../utils/SubmitButton';
import Select from '../../../../utils/Select';
import Input from '../../../../utils/Input';

export default function CreateQuoteForm({ token, showModal, setShowModal, setAlert }) {
    const [serviceId, setServiceId] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [termsConditions, setTermsConditions] = useState('');
    const [notes, setNotes] = useState('');

    const { data: quoteData } = useFetchQuotesQuery(undefined, { skip: !token });
    const { data: services } = useFetchServicesQuery(undefined, { skip: !token });
    const [createQuote, { isLoading: isCreating }] = useCreateQuoteMutation();

    const quotedServiceIds = quoteData?.map((q) => q.service) || [];

    const availableServices = services?.filter((service) => !quotedServiceIds.includes(service.id));

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
            setShowModal(false);
        } catch (err) {
            setAlert({
                type: 'danger',
                message: 'Something went wrong while creating the quote. Please try again.',
            });
            setShowModal(false);
        }
    };

    return (
        <>
            {showModal && (
                <div className="modal d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">Create New Quote</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="col-md-8">
                                            <Select
                                                id="quote-service"
                                                label="Service (*)"
                                                value={serviceId}
                                                onChange={setServiceId}
                                                isRequired={true}
                                                options={[
                                                    { value: '', label: 'Select Service' },
                                                    ...(availableServices
                                                        ? availableServices
                                                              .filter((service) => service.status === 'ACTIVE')
                                                              .map((service) => ({
                                                                  value: service.id,
                                                                  label: `${service.service_name} (${service.client_name} - ${service.street_address})`,
                                                              }))
                                                        : []),
                                                ]}
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <Input
                                                type="date"
                                                fieldClass="form-control"
                                                value={validUntil}
                                                onChange={setValidUntil}
                                                isRequired={true}
                                                label="Valid Until (*)"
                                                id="quote-valid-until"
                                            />
                                        </div>

                                        <div className="col-md-12">
                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Terms & Conditions (*)</label>

                                                <textarea
                                                    className="form-control"
                                                    rows="3"
                                                    value={termsConditions}
                                                    onChange={(e) => setTermsConditions(e.target.value)}
                                                    placeholder="Enter any special terms or agreement details"
                                                    required
                                                ></textarea>
                                            </div>
                                        </div>

                                        <div className="col-md-12">
                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Notes</label>
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
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-dark"
                                        onClick={() => setShowModal(false)}
                                        disabled={isCreating}
                                    >
                                        Cancel
                                    </button>
                                    <SubmitButton
                                        isLoading={isCreating}
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
