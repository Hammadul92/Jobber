import { useState } from 'react';
import { useFetchQuotesQuery, useFetchServicesQuery, useCreateQuoteMutation } from '../../../../store';
import SubmitButton from '../../../ui/SubmitButton';
import Select from '../../../ui/Select';
import Input from '../../../ui/Input';
import { CgClose } from 'react-icons/cg'

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
        } catch {
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true" onClick={() => setShowModal(false)}>
                    <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-start justify-between rounded-t-2xl border-b border-gray-100 bg-secondary text-white px-6 py-4">
                            <div>
                                <h5 className="text-lg font-semibold font-heading">Create New Quote</h5>
                                <p className="text-sm text-gray-200">Insert the following information to add a quote.</p>
                            </div>
                            <button
                                type="button"
                                className="text-gray-200 transition hover:text-gray-400"
                                onClick={() => setShowModal(false)}
                                aria-label="Close"
                            >
                                <CgClose className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="px-6 py-5">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="md:col-span-2">
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

                                    <div>
                                        <Input
                                            type="date"
                                            value={validUntil}
                                            onChange={setValidUntil}
                                            isRequired={true}
                                            label="Valid Until (*)"
                                            id="quote-valid-until"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-gray-700">Terms & Conditions (*)</label>
                                        <textarea
                                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                                            rows="3"
                                            value={termsConditions}
                                            onChange={(e) => setTermsConditions(e.target.value)}
                                            placeholder="Enter any special terms or agreement details"
                                            required
                                        ></textarea>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-gray-700">Notes</label>
                                        <textarea
                                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                                            rows="2"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Internal notes or remarks"
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                                        onClick={() => setShowModal(false)}
                                        disabled={isCreating}
                                    >
                                        Cancel
                                    </button>
                                    <SubmitButton
                                        isLoading={isCreating}
                                        btnClass="bg-accent px-4 py-2 text-sm text-white shadow-sm hover:bg-accentLight"
                                        btnName="Create Quote"
                                    />
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
