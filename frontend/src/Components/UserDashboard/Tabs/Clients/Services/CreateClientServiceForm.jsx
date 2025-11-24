import { useState } from 'react';
import { useCreateServiceMutation } from '../../../../../store';
import SubmitButton from '../../../../../utils/SubmitButton';
import { countries, provinces } from '../../../../../utils/locations';
import Select from '../../../../../utils/Select';
import Input from '../../../../../utils/Input';

export default function CreateClientServiceForm({
    showModal,
    setShowModal,
    clientId,
    businessId,
    serviceOptions = [],
    setAlert,
}) {
    const [serviceName, setServiceName] = useState('');
    const [serviceType, setServiceType] = useState('ONE_TIME');
    const [price, setPrice] = useState('');
    const [currency, setCurrency] = useState('CAD');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [billingCycle, setBillingCycle] = useState('');
    const [description, setDescription] = useState('');

    const [streetAddress, setStreetAddress] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('CA');
    const [provinceState, setProvinceState] = useState('');
    const [postalCode, setPostalCode] = useState('');

    // 🔹 NEW STATES
    const [autoGenerateQuote, setAutoGenerateQuote] = useState(false);
    const [autoGenerateInvoices, setAutoGenerateInvoices] = useState(false);

    const [createService, { isLoading }] = useCreateServiceMutation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createService({
                client: clientId,
                business: businessId,
                service_name: serviceName,
                service_type: serviceType,
                price,
                currency,
                start_date: startDate,
                end_date: endDate || null,
                billing_cycle: billingCycle || null,
                description,
                street_address: streetAddress,
                city,
                country,
                province_state: provinceState,
                postal_code: postalCode,

                auto_generate_quote: autoGenerateQuote,
                auto_generate_invoices: autoGenerateInvoices,
            }).unwrap();

            setAlert({
                type: 'success',
                message: 'Service created successfully!',
            });

            // Reset form
            setServiceName('');
            setServiceType('ONE_TIME');
            setPrice('');
            setCurrency('CAD');
            setStartDate('');
            setEndDate('');
            setBillingCycle('');
            setDescription('');
            setStreetAddress('');
            setCity('');
            setCountry('CA');
            setProvinceState('');
            setPostalCode('');
            setAutoGenerateQuote(false);
            setAutoGenerateInvoices(false);

            setShowModal(false);
        } catch (err) {
            const msg = Array.isArray(err?.data)
                ? err.data.join(', ')
                : typeof err?.data === 'object'
                  ? Object.entries(err.data)
                        .map(
                            ([field, messages]) =>
                                `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
                        )
                        .join(' | ')
                  : err?.data?.detail || 'Failed to create service.';
            setAlert({
                type: 'danger',
                message: msg,
            });
        }
    };

    return (
        <>
            {showModal && (
                <div className="modal d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-lg" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">Add Service</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="col-md-6 col-lg-4">
                                            <Select
                                                id="service_name"
                                                label={'Service Name'}
                                                value={serviceName}
                                                isRequired={true}
                                                onChange={setServiceName}
                                                options={serviceOptions.map((s) => {
                                                    return { value: s, label: s };
                                                })}
                                            />
                                        </div>

                                        <div className="col-md-6 col-lg-4">
                                            <Input
                                                type="date"
                                                id="start_date"
                                                label={'Start Date'}
                                                value={startDate}
                                                isRequired={true}
                                                onChange={setStartDate}
                                                fieldClass={'form-control'}
                                            />
                                        </div>

                                        <div className="col-md-6 col-lg-4">
                                            <Input
                                                type="date"
                                                id="end_date"
                                                label={'End Date'}
                                                value={endDate}
                                                onChange={setEndDate}
                                                fieldClass={'form-control'}
                                            />
                                        </div>

                                        <div className="col-md-6 col-lg-3">
                                            <Input
                                                type="number"
                                                id="price"
                                                label={'Price'}
                                                value={price}
                                                isRequired={true}
                                                onChange={setPrice}
                                                fieldClass={'form-control'}
                                            />
                                        </div>

                                        <div className="col-md-6 col-lg-3">
                                            <Select
                                                id="currency"
                                                label={'Currency'}
                                                value={currency}
                                                isRequired={true}
                                                onChange={setCurrency}
                                                options={[
                                                    { value: 'CAD', label: 'CAD' },
                                                    { value: 'USD', label: 'USD' },
                                                ]}
                                            />
                                        </div>

                                        <div className="col-md-6 col-lg-3">
                                            <Select
                                                id="service_type"
                                                label={'Service Type'}
                                                value={serviceType}
                                                isRequired={true}
                                                onChange={(value) => {
                                                    setServiceType(value);
                                                    setBillingCycle('');
                                                }}
                                                options={[
                                                    { value: 'ONE_TIME', label: 'One Time' },
                                                    { value: 'SUBSCRIPTION', label: 'Subscription' },
                                                ]}
                                            />
                                        </div>

                                        {serviceType !== 'ONE_TIME' && (
                                            <div className="col-md-6 col-lg-3">
                                                <Select
                                                    id="billing_cycle"
                                                    label={'Billing Cycle'}
                                                    value={billingCycle}
                                                    isRequired={true}
                                                    onChange={setBillingCycle}
                                                    options={[
                                                        { value: 'MONTHLY', label: 'Monthly' },
                                                        { value: 'YEARLY', label: 'YEARLY' },
                                                    ]}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-check form-switch mb-2">
                                        <input
                                            id="generate_quote"
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={autoGenerateQuote}
                                            onChange={() => setAutoGenerateQuote(!autoGenerateQuote)}
                                        />
                                        <label className="form-check-label" htmlFor="generate_quote">
                                            Auto-generate Quote
                                        </label>
                                    </div>
                                    {autoGenerateQuote && (
                                        <p className="small text-muted">
                                            <i>
                                                <i className="fa fa-info"></i> A quote will be generated automatically
                                                once the service questionnaire is completed. The client will be prompted
                                                to review and sign it. A notification will be sent to the client and a
                                                confirmation email will be sent to you.
                                            </i>
                                        </p>
                                    )}

                                    <div className="form-check form-switch mb-2">
                                        <input
                                            id="generate_invoices"
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={autoGenerateInvoices}
                                            onChange={() => setAutoGenerateInvoices(!autoGenerateInvoices)}
                                        />
                                        <label className="form-check-label" htmlFor="generate_invoices">
                                            Auto-generate Invoice(s)
                                        </label>
                                    </div>
                                    {autoGenerateInvoices && (
                                        <p className="small text-muted">
                                            <i>
                                                <i className="fa fa-info"></i> Invoices will be created automatically
                                                once the client has completed the questionnaire and signed the quote for
                                                this service.
                                            </i>
                                        </p>
                                    )}

                                    <hr />

                                    <h6 className="fw-bold mt-3">Service Address</h6>
                                    <div className="row">
                                        <div className="col-md-8">
                                            <Input
                                                id="street_address"
                                                value={streetAddress}
                                                label={'Street Address'}
                                                onChange={setStreetAddress}
                                                isRequired={true}
                                                fieldClass={'form-control'}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <Select
                                                id="country"
                                                label={'Country'}
                                                value={country}
                                                isRequired={true}
                                                onChange={(value) => {
                                                    setCountry(value);
                                                    setProvinceState('');
                                                }}
                                                options={countries}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <Select
                                                id="province"
                                                label={'Province/State'}
                                                value={provinceState}
                                                isRequired={true}
                                                onChange={setProvinceState}
                                                options={provinces[country]}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <Input
                                                id="city"
                                                value={city}
                                                label={'City'}
                                                onChange={setCity}
                                                isRequired={true}
                                                fieldClass={'form-control'}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <Input
                                                id="postal_code"
                                                value={postalCode}
                                                label={'Postal/Zip Code'}
                                                onChange={setPostalCode}
                                                isRequired={true}
                                                fieldClass={'form-control'}
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Description</label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-dark"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <SubmitButton
                                        isLoading={isLoading}
                                        btnClass="btn btn-sm btn-success"
                                        btnName="Add Service"
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
