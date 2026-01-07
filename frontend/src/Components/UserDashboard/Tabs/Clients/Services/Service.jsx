import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFetchServiceQuery, useUpdateServiceMutation } from '../../../../../store';
import SubmitButton from '../../../../ui/SubmitButton';
import AlertDispatcher from '../../../../ui/AlertDispatcher';
import Select from '../../../../ui/Select';
import Input from '../../../../ui/Input';
import { countries, provinces } from '../../../../../constants/locations';

export default function Service({ token, business }) {
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
    const [autoGenerateQuote, setAutoGenerateQuote] = useState(false);
    const [autoGenerateInvoices, setAutoGenerateInvoices] = useState(false);

    const [alert, setAlert] = useState({ type: '', message: '' });

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
            setAutoGenerateInvoices(serviceData.auto_generate_invoices || false);
            setAutoGenerateQuote(serviceData.auto_generate_quote || false);
        }
    }, [serviceData]);

    useEffect(() => {
        if (updateError) {
            const message = updateError?.data?.detail || updateError?.data?.status || 'Failed to update service.';
            setAlert({ type: 'danger', message });
        } else if (isSuccess) {
            setAlert({
                type: 'success',
                message: 'Service updated successfully!',
            });
        }
    }, [updateError, isSuccess, serviceData]);

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
            setAlert({ type: 'danger', message: `Failed to update service: ${err}` });
        }
    };

    if (isLoading) return <div>Loading service...</div>;

    return (
        <>
            {alert.message && (
                <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: '', message: '' })}
                />
            )}

            <nav aria-label="breadcrumb" className="mb-3">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to={`/`} className="text-success">
                            Contractorz
                        </Link>
                    </li>
                    <li className="breadcrumb-item">
                        <Link to="/dashboard/home" className="text-success">
                            {business?.name ||
                                (role === 'CLIENT'
                                    ? 'Client Portal'
                                    : role === 'EMPLOYEE'
                                      ? 'Employee Portal'
                                      : 'Dashboard')}
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

            <h3 className="fw-bold mb-3">
                {serviceName} Service for {serviceData.client_name}
            </h3>

            <form onSubmit={handleSubmit} className="rounded shadow-sm border p-3 bg-white">
                <div className="row">
                    <div className="col-md-6 col-lg-3">
                        <Input
                            type="number"
                            label={'Price'}
                            value={price}
                            onChange={setPrice}
                            fieldClass={'form-control'}
                            isRequired={true}
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

                    {serviceType === 'SUBSCRIPTION' && (
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

                    <div className="col-md-6 col-lg-3">
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
                    <div className="col-md-6 col-lg-3">
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
                        <Select
                            id="status"
                            label={'Status'}
                            value={status}
                            isRequired={true}
                            onChange={setStatus}
                            options={[
                                { value: 'PENDING', label: 'Pending' },
                                { value: 'ACTIVE', label: 'Active' },
                                { value: 'COMPLETED', label: 'Completed' },
                                { value: 'CANCELLED', label: 'Cancelled' },
                            ]}
                        />
                    </div>
                </div>

                <div className="form-check form-switch mb-2">
                    <input
                        id="generate_quote"
                        className="form-check-input"
                        type="checkbox"
                        checked={autoGenerateQuote}
                        onChange={() => setAutoGenerateQuote(!autoGenerateQuote)}
                        disabled={true}
                    />
                    <label className="form-check-label" htmlFor="generate_quote">
                        Auto-generate Quote
                    </label>
                </div>
                {autoGenerateQuote && (
                    <p className="small text-muted">
                        <i>
                            <i className="fa fa-info"></i> A quote will be generated automatically once the service
                            questionnaire is completed. The client will be prompted to review and sign it. A
                            notification will be sent to the client and a confirmation email will be sent to you.
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
                            <i className="fa fa-info"></i> Invoices will be created automatically once the client has
                            completed the questionnaire and signed the quote for this service.
                        </i>
                    </p>
                )}

                <h5 className="mt-3 fw-bold">Service Address</h5>
                <div className="row">
                    <div className="col-md-8 col-lg-8">
                        <Input
                            id="street_address"
                            label={'Street Address'}
                            value={streetAddress}
                            isRequired={true}
                            onChange={setStreetAddress}
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
                    <label className="form-label fw-bold">Service Description</label>
                    <textarea
                        className="form-control"
                        rows="3"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
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
