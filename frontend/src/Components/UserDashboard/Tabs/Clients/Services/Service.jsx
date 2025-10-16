import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFetchServiceQuery, useUpdateServiceMutation } from '../../../../../store';
import SubmitButton from '../../../../../utils/SubmitButton';
import AlertDispatcher from '../../../../../utils/AlertDispatcher';
import { countries, provinces } from '../../../../../utils/locations';

export default function Service({ token }) {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: serviceData, isLoading, error } = useFetchServiceQuery(id, { skip: !token });
    const [updateService, { isLoading: updating, error: updateError, isSuccess }] = useUpdateServiceMutation();

    const [serviceName, setServiceName] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [serviceType, setServiceType] = useState('ONE_TIME');
    const [price, setPrice] = useState('');
    const [currency, setCurrency] = useState('CAD');
    const [billingCycle, setBillingCycle] = useState('');
    const [status, setStatus] = useState('PENDING');
    const [streetAddress, setStreetAddress] = useState('');
    const [city, setCity] = useState('');
    const [provinceState, setProvinceState] = useState('');
    const [country, setCountry] = useState('CA');
    const [postalCode, setPostalCode] = useState('');

    const [showError, setShowError] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (serviceData) {
            setServiceName(serviceData.service_name || '');
            setDescription(serviceData.description || '');
            setStartDate(serviceData.start_date || '');
            setEndDate(serviceData.end_date || '');
            setServiceType(serviceData.service_type || 'ONE_TIME');
            setPrice(serviceData.price || '');
            setCurrency(serviceData.currency || 'CAD');
            setBillingCycle(serviceData.billing_cycle || '');
            setStatus(serviceData.status || 'PENDING');
            setStreetAddress(serviceData.street_address || '');
            setCity(serviceData.city || '');
            setProvinceState(serviceData.province_state || '');
            setCountry(serviceData.country || 'CA');
            setPostalCode(serviceData.postal_code || '');
        }
    }, [serviceData]);

    useEffect(() => {
        if (updateError) setShowError(true);
        if (isSuccess) setShowSuccess(true);
    }, [updateError, isSuccess]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateService({
                id,
                service_name: serviceName,
                description,
                start_date: startDate,
                end_date: endDate || null,
                service_type: serviceType,
                price,
                currency,
                billing_cycle: billingCycle,
                status,
                street_address: streetAddress,
                city,
                province_state: provinceState,
                country,
                postal_code: postalCode,
            }).unwrap();
        } catch (err) {
            console.error('Failed to update service:', err);
        }
    };

    if (isLoading) return <div>Loading service...</div>;

    if (error) {
        return <AlertDispatcher type="error" message={error?.data?.detail || 'Failed to load service.'} />;
    }

    return (
        <>
            <nav aria-label="breadcrumb mb-3">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to={`/dashboard/home`} className="text-success">
                            Dashboard
                        </Link>
                    </li>
                    <li className="breadcrumb-item">
                        <Link to={`/dashboard/clients`} className="text-success">
                            Clients
                        </Link>
                    </li>
                    <li className="breadcrumb-item">
                        <Link to={`/dashboard/client/${serviceData.client}/services`} className="text-success">
                            Services
                        </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        Edit Service
                    </li>
                </ol>
            </nav>

            <h3 className="mb-3">Edit Service</h3>

            {updateError && showError && (
                <AlertDispatcher type="error" message={updateError?.data} onClose={() => setShowError(false)} />
            )}
            {isSuccess && showSuccess && (
                <AlertDispatcher
                    type="success"
                    message="Service updated successfully!"
                    autoDismiss={3000}
                    onClose={() => setShowSuccess(false)}
                />
            )}

            <form onSubmit={handleSubmit} className="rounded shadow-sm p-3 bg-white">
                <div className="row">
                    <div className="col-md-6 col-lg-3">
                        <div className="field-wrapper">
                            <input
                                type="text"
                                className="form-control"
                                value={serviceName}
                                onChange={(e) => setServiceName(e.target.value)}
                                required
                                readOnly
                            />
                            <label className="form-label">Service Name (*)</label>
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
                                <option value="ONE_TIME">One-time</option>
                                <option value="SUBSCRIPTION">Subscription</option>
                            </select>
                            <label className="form-label">Service Type</label>
                        </div>
                    </div>
                </div>

                <div className="row">
                    {serviceType === 'SUBSCRIPTION' && (
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
                            <input
                                type="date"
                                className="form-control"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                            <label className="form-label">End Date</label>
                        </div>
                    </div>
                    <div className="col-md-6 col-lg-3">
                        <div className="field-wrapper">
                            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                                <option value="PENDING">Pending</option>
                                <option value="ACTIVE">Active</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                            <label className="form-label">Status</label>
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

                <h6 className="mb-0 mt-4">Service Address</h6>
                <div className="row">
                    <div className="col-md-12 col-lg-12">
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
                    <div className="col-md-3 col-lg-3">
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
                    <div className="col-md-3 col-lg-3">
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
                    <div className="col-md-3 col-lg-3">
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
                    <div className="mb-3 col-md-3 col-lg-3">
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

                <div className="d-flex justify-content-end mt-3">
                    <button
                        type="button"
                        className="btn btn-dark me-2"
                        onClick={() => navigate(`/dashboard/client/${serviceData.client}/services`)}
                    >
                        Cancel
                    </button>
                    <SubmitButton isLoading={updating} btnClass="btn btn-success" btnName="Save Changes" />
                </div>
            </form>
        </>
    );
}
