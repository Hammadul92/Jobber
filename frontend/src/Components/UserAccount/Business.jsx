import { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaImage } from 'react-icons/fa';
import { provinces, countries } from '../../constants/locations';
import { useFetchBusinessesQuery, useCreateBusinessMutation, useUpdateBusinessMutation } from '../../store';
import SubmitButton from '../ui/SubmitButton';
import Input from '../ui/Input';

export default function Business({ token, setAlert }) {
    const [step, setStep] = useState(1);
    const totalSteps = 4;

    const [businessId, setBusinessId] = useState(null);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [phone, setPhone] = useState('');
    const [website, setWebsite] = useState('');
    const [email, setEmail] = useState('');
    const [businessDescription, setBusinessDescription] = useState('');
    const [streetAddress, setStreetAddress] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('CA');
    const [provinceState, setProvinceState] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [businessNumber, setBusinessNumber] = useState('');
    const [taxRate, setTaxRate] = useState(0);
    const [timezone, setTimezone] = useState('America/Edmonton');
    const [selectedServices, setSelectedServices] = useState([]);
    const [logo, setLogo] = useState(null);

    const { data: businessData, isLoading, refetch } = useFetchBusinessesQuery(undefined, { skip: !token });
    const [createBusiness, { isLoading: isCreating }] = useCreateBusinessMutation();
    const [updateBusiness, { isLoading: isUpdating }] = useUpdateBusinessMutation();

    const generateSlug = (text) => text.toLowerCase().trim().replace(/\s+/g, '-');

    useEffect(() => {
        setSlug(generateSlug(name));
    }, [name]);

    useEffect(() => {
        if (businessData?.length > 0) {
            const b = businessData[0];
            setBusinessId(b.id);
            setName(b.name || '');
            setSlug(b.slug || '');
            setPhone(b.phone || '');
            setWebsite(b.website || '');
            setEmail(b.email || '');
            setBusinessDescription(b.business_description || '');
            setStreetAddress(b.street_address || '');
            setCity(b.city || '');
            setCountry(b.country || 'CA');
            setProvinceState(b.province_state || '');
            setPostalCode(b.postal_code || '');
            setBusinessNumber(b.business_number || '');
            setTaxRate(b.tax_rate || 0);
            setTimezone(b.timezone || 'America/Edmonton');
            setSelectedServices(b.services_offered || []);
            setLogo(b.logo || null);
        }
    }, [businessData]);

    const services = [
        'Construction',
        'Cleaning',
        'Landscaping',
        'Plumbing',
        'Electrical',
        'Snow Removal',
        'HVAC',
        'Roofing',
        'Siding',
        'Handyman Services',
        'Flooring',
        'Windows & Doors',
        'Appliance Repair',
        'Moving Services',
        'Carpet Cleaning',
        'Pest Control',
    ];

    const timezones = [
        { value: 'America/St_Johns', label: 'Newfoundland Time (NT) - St. John’s' },
        { value: 'America/Halifax', label: 'Atlantic Time (AT) - Halifax' },
        { value: 'America/Toronto', label: 'Eastern Time (ET) - Toronto' },
        { value: 'America/Winnipeg', label: 'Central Time (CT) - Winnipeg' },
        { value: 'America/Edmonton', label: 'Mountain Time (MT) - Edmonton' },
        { value: 'America/Vancouver', label: 'Pacific Time (PT) - Vancouver' },
    ];

    const toggleService = (service) => {
        setSelectedServices((prev) =>
            prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
        );
    };

    const isStepComplete = (stepNum) => {
        switch (stepNum) {
            case 1:
                return name && slug && email && phone && businessDescription && businessNumber && taxRate && timezone;
            case 2:
                return streetAddress && city && country && provinceState && postalCode;
            case 3:
                return selectedServices.length > 0;
            case 4:
                return true;
            default:
                return false;
        }
    };

    const isStepVisuallyComplete = (stepNum) => {
        if (stepNum === 4) return !!logo;
        return isStepComplete(stepNum);
    };

    useEffect(() => {
        const completed = [];
        for (let i = 1; i <= totalSteps; i++) {
            if (isStepComplete(i)) completed.push(i);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const validateStep = () => isStepComplete(step);

    const nextStep = () => {
        if (validateStep()) {
            const next = Math.min(step + 1, totalSteps);
            setStep(next);
        } else {
            setAlert({ type: 'danger', message: 'Please fill all required fields before continuing.' });
        }
    };

    const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep()) return;

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('slug', slug);
            formData.append('phone', phone);
            formData.append('website', website);
            formData.append('email', email);
            formData.append('business_description', businessDescription);
            formData.append('street_address', streetAddress);
            formData.append('city', city);
            formData.append('country', country);
            formData.append('province_state', provinceState);
            formData.append('postal_code', postalCode);
            formData.append('business_number', businessNumber);
            formData.append('tax_rate', parseInt(taxRate));
            formData.append('timezone', timezone);
            formData.append('services_offered', JSON.stringify(selectedServices));
            if (logo && typeof logo !== 'string') formData.append('logo', logo);

            if (businessId) {
                await updateBusiness({ id: businessId, data: formData }).unwrap();
                setAlert({ type: 'success', message: 'Business updated successfully!' });
            } else {
                await createBusiness(formData).unwrap();
                setAlert({ type: 'success', message: 'Business created successfully!' });
            }
            refetch();
        } catch {
            setAlert({ type: 'danger', message: 'Failed to save business. Please try again.' });
        }
    };

    const steps = ['Details', 'Address', 'Services', 'Logo'];
    const inputClass =
        'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30';
    const selectClass = inputClass;
    const textareaClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30';

    if (isLoading) return <div>Loading business data...</div>;

    return (
        <>
            <div className="mb-6 flex flex-wrap items-center gap-3">
                {steps.map((label, index) => {
                    const stepNum = index + 1;
                    const isActive = stepNum === step;
                    const isCompleted = stepNum !== step && isStepVisuallyComplete(stepNum);

                    return (
                        <button
                            type="button"
                            key={label}
                            className={`flex items-center gap-3 cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                isActive
                                    ? 'border-secondary bg-secondary text-white'
                                    : isCompleted
                                        ? 'border-green-200 bg-green-50 text-green-700'
                                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-accent/70 hover:text-accent'
                            }`}
                            onClick={() => {
                                if (stepNum < step) {
                                    setStep(stepNum);
                                } else if (stepNum > step) {
                                    let canProceed = true;
                                    for (let i = step; i < stepNum; i++) {
                                        if (!isStepComplete(i)) {
                                            canProceed = false;
                                            break;
                                        }
                                    }

                                    if (canProceed) {
                                        setStep(stepNum);
                                    } else {
                                        setAlert({
                                            type: 'danger',
                                            message: 'Please fill all required fields before continuing.',
                                        });
                                    }
                                }
                            }}
                        >
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-gray-700 shadow">
                                {stepNum}
                            </span>
                            <span>{label}</span>
                        </button>
                    );
                })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <Input
                                id="business_name"
                                label={'Business Name'}
                                value={name}
                                isRequired={true}
                                onChange={setName}
                                fieldClass={inputClass}
                            />
                            <Input
                                id="slug"
                                label={'Slug'}
                                value={slug}
                                isRequired={true}
                                onChange={setSlug}
                                fieldClass={inputClass}
                            />
                            <Input
                                type="email"
                                id="email"
                                label={'Email'}
                                value={email}
                                isRequired={true}
                                onChange={setEmail}
                                fieldClass={inputClass}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Input
                                type="tel"
                                id="phone"
                                label={'Phone'}
                                value={phone}
                                isRequired={true}
                                onChange={setPhone}
                                fieldClass={inputClass}
                            />
                            <Input
                                type="url"
                                id="phone"
                                label={'Business Website'}
                                value={website}
                                isRequired={false}
                                onChange={setWebsite}
                                fieldClass={inputClass}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="flex flex-col">
                                <label className="font-medium" htmlFor="timezone">
                                    Timezone <sup className="text-accent">*</sup>
                                </label>
                                <select
                                    id="timezone"
                                    value={timezone}
                                    onChange={(e) => setTimezone(e.target.value)}
                                    required
                                    className={selectClass}
                                >
                                    <option value="">-- Select Timezone --</option>
                                    {timezones.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Input
                                id="business_number"
                                label={'Business Number'}
                                value={businessNumber}
                                isRequired={true}
                                onChange={setBusinessNumber}
                                fieldClass={inputClass}
                            />
                            <Input
                                type="number"
                                id="tax_rate"
                                label={'Tax Rate'}
                                value={taxRate}
                                isRequired={true}
                                onChange={setTaxRate}
                                fieldClass={inputClass}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="font-medium">
                                Business Description <sup className="text-accent">*</sup>
                            </label>
                            <textarea
                                className={textareaClass}
                                rows={3}
                                value={businessDescription}
                                onChange={(e) => setBusinessDescription(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-semibold text-gray-800" htmlFor="country">
                                    Country <sup className="text-accent">*</sup>
                                </label>
                                <select
                                    id="country"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    required
                                    className={selectClass}
                                >
                                    <option value="">-- Select Country --</option>
                                    {countries.map((option, index) => (
                                        <option key={index} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-semibold text-gray-800" htmlFor="province">
                                    Province / State <sup className="text-accent">*</sup>
                                </label>
                                <select
                                    id="province"
                                    value={provinceState}
                                    onChange={(e) => setProvinceState(e.target.value)}
                                    required
                                    className={selectClass}
                                >
                                    <option value="">-- Select Province / State --</option>
                                    {(provinces[country] || []).map((option, index) => (
                                        <option key={index} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <Input
                            id="street_address"
                            label={'Street Address'}
                            value={streetAddress}
                            isRequired={true}
                            onChange={setStreetAddress}
                            fieldClass={inputClass}
                        />

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Input
                                id="city"
                                label={'City'}
                                value={city}
                                isRequired={true}
                                onChange={setCity}
                                fieldClass={inputClass}
                            />

                            <Input
                                id="postal_code"
                                label={'Postal / ZIP Code'}
                                value={postalCode}
                                isRequired={true}
                                onChange={setPostalCode}
                                fieldClass={inputClass}
                            />
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">Select all services you offer.</p>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {services.map((service) => {
                                const isSelected = selectedServices.includes(service);
                                return (
                                    <button
                                        key={service}
                                        type="button"
                                        className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                                            isSelected
                                                ? 'border-accent bg-accent/10 text-accent'
                                                : 'border-gray-200 bg-white text-gray-700 hover:border-accent/60 hover:text-accent'
                                        }`}
                                        onClick={() => toggleService(service)}
                                    >
                                        {service}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-4">
                        <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
                            {logo ? (
                                <img
                                    src={typeof logo === 'string' ? logo : URL.createObjectURL(logo)}
                                    alt="Business Logo"
                                    className="max-h-36 rounded object-contain"
                                />
                            ) : (
                                <div className="text-center text-sm text-gray-500">
                                    <FaImage className="text-6xl text-gray-300" />
                                    <div className="mt-2">Upload your logo</div>
                                </div>
                            )}
                        </div>
                        <div>
                            <input
                                type="file"
                                accept="image/*"
                                className="block w-full max-w-sm rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                                onChange={(e) => setLogo(e.target.files[0])}
                            />
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-2">
                    {step > 1 && (
                        <button
                            type="button"
                            className="secondary"
                            onClick={prevStep}
                        >
                            <FaChevronLeft className='inline mb-0.5 mr-2' />
                            Back
                        </button>
                    )}
                    {step < totalSteps ? (
                        <button
                            type="button"
                            className="primary"
                            onClick={nextStep}
                        >
                            Next
                            <FaChevronRight className='inline mb-0.5 ml-2' />
                        </button>
                    ) : (
                        <SubmitButton
                            isLoading={isCreating || isUpdating}
                            btnClass="ml-auto inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed"
                            btnName="Save Changes"
                            isDisabled={!validateStep()}
                        />
                    )}
                </div>
            </form>
        </>
    );
}
