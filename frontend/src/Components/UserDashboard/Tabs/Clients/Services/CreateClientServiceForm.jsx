import { useState } from 'react';
import { FaInfoCircle, FaRocket } from 'react-icons/fa';
import { useCreateServiceMutation } from '../../../../../store';
import SubmitButton from '../../../../ui/SubmitButton';
import { countries, provinces } from '../../../../../constants/locations';
import Select from '../../../../ui/Select';
import Input from '../../../../ui/Input';

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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/70 px-4">
                    <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="bg-gradient-to-r from-accent to-secondary px-6 py-4 text-white">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/80">New service</p>
                                    <h5 className="text-xl font-semibold leading-tight">Add Client Service</h5>
                                    <p className="text-sm text-white/80">Use your catalog name to stay on-brand in client emails.</p>
                                </div>
                                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]">
                                    <FaRocket className="h-4 w-4" /> Fast setup
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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

                                <Input
                                    type="date"
                                    id="start_date"
                                    label={'Start Date'}
                                    value={startDate}
                                    isRequired={true}
                                    onChange={setStartDate}
                                    fieldClass="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                                />

                                <Input
                                    type="date"
                                    id="end_date"
                                    label={'End Date'}
                                    value={endDate}
                                    onChange={setEndDate}
                                    fieldClass="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                                />

                                <Input
                                    type="number"
                                    id="price"
                                    label={'Price'}
                                    value={price}
                                    isRequired={true}
                                    onChange={setPrice}
                                    fieldClass="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
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

                                {serviceType !== 'ONE_TIME' && (
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
                            </div>

                            <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                    <input
                                        id="generate_quote"
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                                        checked={autoGenerateQuote}
                                        onChange={() => setAutoGenerateQuote(!autoGenerateQuote)}
                                    />
                                    Auto-generate Quote
                                </label>
                                {autoGenerateQuote && (
                                    <p className="flex items-start gap-2 text-sm text-gray-600">
                                        <FaInfoCircle className="mt-0.5 h-4 w-4 text-secondary" />
                                        A quote will be generated automatically after the questionnaire is completed. The client can review and sign; notifications go to both parties.
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
                                        Invoices will be created once the questionnaire is completed and the quote is signed.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                                <h5 className="text-base font-semibold text-primary">Service Address</h5>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="md:col-span-2">
                                        <Input
                                            id="street_address"
                                            value={streetAddress}
                                            label={'Street Address'}
                                            onChange={setStreetAddress}
                                            isRequired={true}
                                            fieldClass="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
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
                                        fieldClass="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                                    />
                                    <Input
                                        id="postal_code"
                                        value={postalCode}
                                        label={'Postal/Zip Code'}
                                        onChange={setPostalCode}
                                        isRequired={true}
                                        fieldClass="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-gray-800">Service Description</label>
                                    <textarea
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                                        rows="3"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/20"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <SubmitButton
                                    isLoading={isLoading}
                                    btnClass="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-accent to-secondary px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-lg disabled:opacity-60"
                                    btnName="Add Service"
                                />
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
