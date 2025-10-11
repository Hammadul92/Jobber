import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFetchServiceQuery, useUpdateServiceMutation } from '../../../../../store';
import SubmitButton from '../../../../../utils/SubmitButton';

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
            navigate(`/dashboard/client/${serviceData.client}/services`);
        } catch (err) {
            console.error('Failed to update service:', err);
        }
    };

    if (isLoading) return <div>Loading service...</div>;

    if (error) {
        return (
            <div className="alert alert-danger" role="alert">
                {error?.data?.detail || 'Failed to load service.'}
            </div>
        );
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
            <h3 className="mb-4">Edit Service</h3>

            <form onSubmit={handleSubmit}>
                {updateError && (
                    <div className="alert alert-danger mb-3">
                        {updateError?.data?.detail || 'Failed to update service.'}
                    </div>
                )}
                {isSuccess && <div className="alert alert-success mb-3">Service updated successfully!</div>}

                <div className="row">
                    <div className="mb-3 col-md-6">
                        <label className="form-label">Service Name (*)</label>
                        <input
                            type="text"
                            className="form-control"
                            value={serviceName}
                            onChange={(e) => setServiceName(e.target.value)}
                            required
                            disabled
                        />
                    </div>
                    <div className="mb-3 col-md-6">
                        <label className="form-label">Price (*)</label>
                        <input
                            type="number"
                            className="form-control"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
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

                <div className="row mb-3">
                    <div className="mb-3 col-md-6">
                        <label className="form-label">Start Date (*)</label>
                        <input
                            type="date"
                            className="form-control"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3 col-md-6">
                        <label className="form-label">End Date</label>
                        <input
                            type="date"
                            className="form-control"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="row mb-3">
                    <div className="mb-3 col-md-4">
                        <label className="form-label">Service Type</label>
                        <select
                            className="form-select"
                            value={serviceType}
                            onChange={(e) => setServiceType(e.target.value)}
                        >
                            <option value="ONE_TIME">One-time</option>
                            <option value="SUBSCRIPTION">Subscription</option>
                        </select>
                    </div>
                    <div className="mb-3 col-md-4">
                        <label className="form-label">Billing Cycle</label>
                        <select
                            className="form-select"
                            value={billingCycle || ''}
                            onChange={(e) => setBillingCycle(e.target.value)}
                        >
                            <option value="">Select cycle</option>
                            <option value="MONTHLY">Monthly</option>
                            <option value="YEARLY">Yearly</option>
                        </select>
                    </div>
                    <div className="mb-3 col-md-4">
                        <label className="form-label">Status</label>
                        <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option value="PENDING">Pending</option>
                            <option value="ACTIVE">Active</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </div>

                <h5>Service Address</h5>
                <div className="row mb-3">
                    <div className="mb-3 col-md-8">
                        <label className="form-label">Street Address (*)</label>
                        <input
                            type="text"
                            className="form-control"
                            value={streetAddress}
                            onChange={(e) => setStreetAddress(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3 col-md-4">
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

                <div className="row mb-3">
                    <div className="mb-3 col-md-4">
                        <label className="form-label">Province/State (*)</label>
                        <input
                            type="text"
                            className="form-control"
                            value={provinceState}
                            onChange={(e) => setProvinceState(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3 col-md-4">
                        <label className="form-label">Country (*)</label>
                        <input
                            type="text"
                            className="form-control"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3 col-md-4">
                        <label className="form-label">Postal Code (*)</label>
                        <input
                            type="text"
                            className="form-control"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="d-flex justify-content-end">
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
