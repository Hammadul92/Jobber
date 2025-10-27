import { useState } from 'react';
import { useCreateServiceMutation, useFetchServicesQuery } from '../../../../../store';
import SubmitButton from '../../../../../utils/SubmitButton';
import { countries, provinces } from '../../../../../utils/locations';

export default function CreateClientServiceForm({
    showModal,
    setShowModal,
    clientId,
    businessId,
    serviceOptions = [],
    loadingOptions,
    errorOptions,
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

    const [createService, { isLoading }] = useCreateServiceMutation();

    const {
        data: clientServices = [],
        isLoading: loadingClientServices,
        isError: fetchError,
    } = useFetchServicesQuery(clientId, { skip: !clientId });

    const existingServiceNames = clientServices.map((svc) => svc.service_name?.toLowerCase().trim());

    const filteredServiceOptions = serviceOptions.filter(
        (name) => !existingServiceNames.includes(name.toLowerCase().trim())
    );

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
            }).unwrap();

            // ✅ Success alert
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
                                <h5 className="modal-title">Add Service</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="col-md-6 col-lg-3">
                                            <div className="field-wrapper">
                                                <select
                                                    className="form-select"
                                                    value={serviceName}
                                                    onChange={(e) => setServiceName(e.target.value)}
                                                    required
                                                    disabled={loadingOptions || errorOptions || loadingClientServices}
                                                >
                                                    <option value="">-- Select Service --</option>
                                                    {filteredServiceOptions.length > 0 ? (
                                                        filteredServiceOptions.map((service) => (
                                                            <option key={service} value={service}>
                                                                {service}
                                                            </option>
                                                        ))
                                                    ) : (
                                                        <option disabled value="">
                                                            No new services available
                                                        </option>
                                                    )}
                                                </select>
                                                <label className="form-label">Service Name (*)</label>
                                            </div>
                                        </div>

                                        <div className="col-md-6 col-lg-3">
                                            <div className="field-wrapper">
                                                <select
                                                    className="form-select"
                                                    value={serviceType}
                                                    onChange={(e) => {
                                                        setServiceType(e.target.value);
                                                        setBillingCycle('');
                                                    }}
                                                >
                                                    <option value="ONE_TIME">One Time</option>
                                                    <option value="SUBSCRIPTION">Subscription</option>
                                                </select>
                                                <label className="form-label">Service Type (*)</label>
                                            </div>
                                        </div>

                                        <div className="col-md-6 col-lg-3">
                                            <div className="field-wrapper">
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={price}
                                                    onChange={(e) => setPrice(e.target.value)}
                                                    required
                                                />
                                                <label className="form-label">Price (*)</label>
                                            </div>
                                        </div>

                                        <div className="col-md-6 col-lg-3">
                                            <div className="field-wrapper">
                                                <select
                                                    className="form-select"
                                                    value={currency}
                                                    onChange={(e) => setCurrency(e.target.value)}
                                                >
                                                    <option value="CAD">CAD</option>
                                                    <option value="USD">USD</option>
                                                </select>
                                                <label className="form-label">Currency</label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 🧩 Billing & Dates */}
                                    <div className="row">
                                        {serviceType !== 'ONE_TIME' && (
                                            <div className="col-md-6 col-lg-3">
                                                <div className="field-wrapper">
                                                    <select
                                                        className="form-select"
                                                        value={billingCycle}
                                                        onChange={(e) => setBillingCycle(e.target.value)}
                                                    >
                                                        <option value="">-- Select --</option>
                                                        <option value="MONTHLY">Monthly</option>
                                                        <option value="YEARLY">Yearly</option>
                                                    </select>
                                                    <label className="form-label">Billing Cycle</label>
                                                </div>
                                            </div>
                                        )}

                                        <div className="col-md-6 col-lg-3">
                                            <div className="field-wrapper">
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    required
                                                />
                                                <label className="form-label">Start Date (*)</label>
                                            </div>
                                        </div>

                                        <div className="col-md-6 col-lg-3">
                                            <div className="field-wrapper">
                                                <label className="form-label">End Date</label>
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <h6 className="mb-0 mt-4">Service Address</h6>
                                    <div className="row">
                                        <div className="col-md-12">
                                            <div className="field-wrapper">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={streetAddress}
                                                    onChange={(e) => setStreetAddress(e.target.value)}
                                                    required
                                                />
                                                <label className="form-label">Street Address (*)</label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-3">
                                            <div className="field-wrapper">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={city}
                                                    onChange={(e) => setCity(e.target.value)}
                                                    required
                                                />
                                                <label className="form-label">City (*)</label>
                                            </div>
                                        </div>

                                        <div className="col-md-3">
                                            <div className="field-wrapper">
                                                <select
                                                    className="form-select"
                                                    value={country}
                                                    onChange={(e) => {
                                                        setCountry(e.target.value);
                                                        setProvinceState('');
                                                    }}
                                                    required
                                                >
                                                    {countries.map(({ code, name }) => (
                                                        <option value={code} key={code}>
                                                            {name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <label className="form-label">Country (*)</label>
                                            </div>
                                        </div>

                                        <div className="col-md-3">
                                            <div className="field-wrapper">
                                                <select
                                                    className="form-select"
                                                    value={provinceState}
                                                    onChange={(e) => setProvinceState(e.target.value)}
                                                    required
                                                >
                                                    <option value="">Select Province/State</option>
                                                    {provinces[country].map((prov) => (
                                                        <option key={prov.code} value={prov.code}>
                                                            {prov.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <label className="form-label">Province/State (*)</label>
                                            </div>
                                        </div>

                                        <div className="col-md-3">
                                            <div className="field-wrapper">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={postalCode}
                                                    onChange={(e) => setPostalCode(e.target.value)}
                                                    required
                                                />
                                                <label className="form-label">Postal/ZIP Code (*)</label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="field-wrapper">
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        ></textarea>
                                        <label className="form-label">Description</label>
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
