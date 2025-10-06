import { useState } from 'react';
import { useCreateServiceMutation } from '../../../../../store';
import SubmitButton from '../../../../../utils/SubmitButton';
import { countries, provinces } from '../../../../../utils/locations';

export default function CreateServiceModal({
    showModal,
    setShowModal,
    clientId,
    businessId,
    serviceOptions = [],
    loadingOptions,
    errorOptions,
}) {
    const [serviceName, setServiceName] = useState('');
    const [serviceType, setServiceType] = useState('ONE_TIME');
    const [price, setPrice] = useState('');
    const [currency, setCurrency] = useState('CAD');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [billingCycle, setBillingCycle] = useState('');
    const [status, setStatus] = useState('PENDING');
    const [description, setDescription] = useState('');

    const [streetAddress, setStreetAddress] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('CA');
    const [provinceState, setProvinceState] = useState('');
    const [postalCode, setPostalCode] = useState('');

    const [createService, { isLoading, error, isSuccess }] = useCreateServiceMutation();

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
                status,
                description,
                street_address: streetAddress,
                city,
                country,
                province_state: provinceState,
                postal_code: postalCode,
            }).unwrap();

            // reset
            setServiceName('');
            setServiceType('ONE_TIME');
            setPrice('');
            setCurrency('CAD');
            setStartDate('');
            setEndDate('');
            setBillingCycle('');
            setStatus('PENDING');
            setDescription('');
            setStreetAddress('');
            setCity('');
            setCountry('CA');
            setProvinceState('');
            setPostalCode('');

            setShowModal(false);
        } catch (err) {
            console.error('Failed to create service:', err);
        }
    };

    return (
        <>
            {showModal && (
                <div className="modal d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-xl" role="document">
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
                                    {error && (
                                        <div className="alert alert-danger mb-3">
                                            {error?.data?.detail || 'Failed to add service'}
                                        </div>
                                    )}
                                    {isSuccess && (
                                        <div className="alert alert-success mb-3">Service added successfully!</div>
                                    )}

                                    {loadingOptions && <div className="alert alert-info mb-3">Loading services...</div>}
                                    {errorOptions && (
                                        <div className="alert alert-danger mb-3">
                                            {errorOptions?.data?.detail || 'Failed to load service options'}
                                        </div>
                                    )}

                                    {/* Service Info */}
                                    <div className="row">
                                        <div className="mb-3 col-md-6 col-lg-3">
                                            <label className="form-label">Service Name (*)</label>
                                            <select
                                                className="form-select"
                                                value={serviceName}
                                                onChange={(e) => setServiceName(e.target.value)}
                                                required
                                                disabled={loadingOptions || errorOptions}
                                            >
                                                <option value="">-- Select Service --</option>
                                                {serviceOptions.map((service) => (
                                                    <option key={service} value={service}>
                                                        {service}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="mb-3 col-md-6 col-lg-3">
                                            <label className="form-label">Service Type (*)</label>
                                            <select
                                                className="form-select"
                                                value={serviceType}
                                                onChange={(e) => setServiceType(e.target.value)}
                                            >
                                                <option value="ONE_TIME">One Time</option>
                                                <option value="SUBSCRIPTION">Subscription</option>
                                            </select>
                                        </div>

                                        <div className="mb-3 col-md-6 col-lg-3">
                                            <label className="form-label">Price (*)</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={price}
                                                onChange={(e) => setPrice(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="mb-3 col-md-6 col-lg-3">
                                            <label className="form-label">Currency</label>
                                            <select
                                                className="form-select"
                                                value={currency}
                                                onChange={(e) => setCurrency(e.target.value)}
                                            >
                                                <option value="CAD">CAD</option>
                                                <option value="USD">USD</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="mb-3 col-md-6 col-lg-3">
                                            <label className="form-label">Billing Cycle</label>
                                            <select
                                                className="form-select"
                                                value={billingCycle}
                                                onChange={(e) => setBillingCycle(e.target.value)}
                                            >
                                                <option value="">-- Select --</option>
                                                <option value="MONTHLY">Monthly</option>
                                                <option value="YEARLY">Yearly</option>
                                            </select>
                                        </div>

                                        <div className="mb-3 col-md-6 col-lg-3">
                                            <label className="form-label">Start Date (*)</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="mb-3 col-md-6 col-lg-3">
                                            <label className="form-label">End Date</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                            />
                                        </div>

                                        <div className="mb-3 col-md-6 col-lg-3">
                                            <label className="form-label">Status</label>
                                            <select
                                                className="form-select"
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                            >
                                                <option value="PENDING">Pending</option>
                                                <option value="ACTIVE">Active</option>
                                                <option value="COMPLETED">Completed</option>
                                                <option value="CANCELLED">Cancelled</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <h6 className="mt-4">Service Address</h6>
                                    <div className="row">
                                        <div className="mb-3 col-md-8 col-lg-9">
                                            <label className="form-label">Street Address (*)</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={streetAddress}
                                                onChange={(e) => setStreetAddress(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3 col-md-4 col-lg-3">
                                            <label className="form-label">City (*)</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="mb-3 col-md-4 col-lg-3">
                                            <label className="form-label">Country (*)</label>
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
                                        </div>

                                        <div className="mb-3 col-md-4 col-lg-3">
                                            <label className="form-label">Province/State (*)</label>
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
                                        </div>

                                        <div className="mb-3 col-md-4 col-lg-3">
                                            <label className="form-label">Postal/ZIP Code (*)</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={postalCode}
                                                onChange={(e) => setPostalCode(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Description</label>
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
