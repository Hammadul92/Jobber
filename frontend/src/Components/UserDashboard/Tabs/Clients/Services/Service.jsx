import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaInfoCircle } from 'react-icons/fa';
import { useFetchServiceQuery, useUpdateServiceMutation } from '../../../../../store';
import SubmitButton from '../../../../ui/SubmitButton';
import AlertDispatcher from '../../../../ui/AlertDispatcher';
import Select from '../../../../ui/Select';
import Input from '../../../../ui/Input';
import { countries, provinces } from '../../../../../constants/locations';

export default function Service({ token, business, role }) {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: serviceData, isLoading } = useFetchServiceQuery(id, { skip: !token });
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

    const statusTone = {
        PENDING: 'bg-amber-100 text-amber-800',
        ACTIVE: 'bg-green-100 text-green-800',
        COMPLETED: 'bg-blue-100 text-blue-800',
        CANCELLED: 'bg-red-100 text-red-800',
    };

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
            <nav aria-label="breadcrumb" className="mb-4">
                <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <li>
                        <Link to={`/`} className="font-semibold text-accent hover:text-accentLight">
                            Contractorz
                        </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li>
                        <Link to="/dashboard/home" className="font-semibold text-secondary hover:text-accent">
                            {business?.name ||
                                (role === 'CLIENT'
                                    ? 'Client Portal'
                                    : role === 'EMPLOYEE'
                                        ? 'Employee Portal'
                                        : 'Dashboard')}
                        </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li>
                        <Link to={`/dashboard/clients`} className="font-semibold text-secondary hover:text-accent">
                            Clients
                        </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li>
                        <Link
                            to={`/dashboard/client/${serviceData.client}/services`}
                            className="font-semibold text-secondary hover:text-accent"
                        >
                            Services
                        </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li className="text-gray-700 font-semibold">Edit Service</li>
                </ol>
            </nav>

            {alert.message && (
                <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: '', message: '' })}
                />
            )}

            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-accent to-secondary p-[1px] shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white/95 px-6 py-5">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">Service</p>
                        <h3 className="text-2xl font-semibold text-primary">
                            {serviceName || 'Service'} for {serviceData.client_name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-semibold uppercase text-secondary">
                                {serviceType === 'SUBSCRIPTION' ? 'Subscription' : 'One-Time'}
                            </span>
                            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${statusTone[status] || 'bg-gray-100 text-gray-700'}`}>
                                {status}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 rounded-xl bg-gradient-to-br from-secondary to-primary px-4 py-3 text-white shadow-md">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/70">Billing</p>
                        <p className="text-sm font-semibold">
                            {price ? `$${price} ${currency}` : 'Price TBD'} {billingCycle && `• ${billingCycle}`}
                        </p>
                        <p className="text-xs text-white/80">
                            {startDate ? `Starts ${startDate}` : 'Start date not set'}
                            {endDate ? ` • Ends ${endDate}` : ''}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-gray-200 bg-white/95 px-5 py-6 shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    <Input
                        type="number"
                        label={'Price'}
                        value={price}
                        onChange={setPrice}
                        fieldClass="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        isRequired={true}
                    />
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

                    {serviceType === 'SUBSCRIPTION' && (
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
                    )}

                    <Input
                        type="date"
                        id="start_date"
                        label={'Start Date'}
                        value={startDate}
                        isRequired={true}
                        onChange={setStartDate}
                        fieldClass="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                    <Input
                        type="date"
                        id="end_date"
                        label={'End Date'}
                        value={endDate}
                        onChange={setEndDate}
                        fieldClass="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
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

                <div className="space-y-3 rounded-2xl border border-gray-200 bg-gradient-to-r from-secondary/5 to-gray-50 p-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <input
                            id="generate_quote"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                            checked={autoGenerateQuote}
                            onChange={() => setAutoGenerateQuote(!autoGenerateQuote)}
                            disabled={true}
                        />
                        Auto-generate Quote (locked)
                    </label>
                    {autoGenerateQuote && (
                        <p className="flex items-start gap-2 text-sm text-gray-600">
                            <FaInfoCircle className="mt-0.5 h-4 w-4 text-secondary" />
                            A quote will be generated automatically after the questionnaire is completed. The client
                            will review and sign; notifications go to both parties.
                        </p>
                    )}

                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <input
                            id="generate_invoices"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                            checked={autoGenerateInvoices}
                            onChange={() => setAutoGenerateInvoices(!autoGenerateInvoices)}
                        />
                        Auto-generate Invoice(s)
                    </label>
                    {autoGenerateInvoices && (
                        <p className="flex items-start gap-2 text-sm text-gray-600">
                            <FaInfoCircle className="mt-0.5 h-4 w-4 text-secondary" />
                            Invoices will be created automatically once the questionnaire is completed and the quote is
                            signed.
                        </p>
                    )}
                </div>

                <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <h5 className="text-base font-semibold text-primary">Service Address</h5>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="md:col-span-2">
                            <Input
                                id="street_address"
                                label={'Street Address'}
                                value={streetAddress}
                                isRequired={true}
                                onChange={setStreetAddress}
                                fieldClass="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                            />
                        </div>
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
                        <Select
                            id="province"
                            label={'Province/State'}
                            value={provinceState}
                            isRequired={true}
                            onChange={setProvinceState}
                            options={provinces[country]}
                        />

                        <Input
                            id="city"
                            value={city}
                            label={'City'}
                            onChange={setCity}
                            isRequired={true}
                            fieldClass="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                        <Input
                            id="postal_code"
                            value={postalCode}
                            label={'Postal/Zip Code'}
                            onChange={setPostalCode}
                            isRequired={true}
                            fieldClass="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-800">Service Description</label>
                        <textarea
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                            rows="3"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        ></textarea>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/20"
                        onClick={() => navigate(`/dashboard/client/${serviceData.client}/services`)}
                    >
                        Cancel
                    </button>
                    <SubmitButton
                        isLoading={updating}
                        btnClass="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-accent to-secondary px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-lg disabled:opacity-60"
                        btnName="Save Changes"
                    />
                </div>
            </form>
        </>
    );
}
