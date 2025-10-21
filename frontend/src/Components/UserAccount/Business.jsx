import { useState, useEffect } from 'react';
import { provinces, countries } from '../../utils/locations';
import { useFetchBusinessesQuery, useCreateBusinessMutation, useUpdateBusinessMutation } from '../../store';
import SubmitButton from '../../utils/SubmitButton';
import PhoneInputField from '../../utils/PhoneInput';

export default function Business({ token, setAlert }) {
    const [step, setStep] = useState(1);
    const totalSteps = 4;

    const [businessId, setBusinessId] = useState(null);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
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

    // Populate form if business exists
    useEffect(() => {
        if (businessData?.length > 0) {
            const b = businessData[0];
            setBusinessId(b.id);
            setName(b.name || '');
            setPhone(b.phone || '');
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
                return name && email && phone && businessDescription && businessNumber && taxRate && timezone;
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
    }, [
        name,
        email,
        phone,
        businessDescription,
        businessNumber,
        taxRate,
        timezone,
        streetAddress,
        city,
        country,
        provinceState,
        postalCode,
        selectedServices,
        logo,
    ]);

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
            formData.append('phone', phone);
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
        } catch (err) {
            console.error('Business save failed:', err);
            setAlert({ type: 'danger', message: 'Failed to save business. Please try again.' });
        }
    };

    const steps = ['Details', 'Address', 'Services', 'Logo'];

    if (isLoading) return <div>Loading business data...</div>;

    return (
        <>
            <div className="step-container mb-4">
                {steps.map((label, index) => {
                    const stepNum = index + 1;
                    const isActive = stepNum === step;
                    const isCompleted = stepNum !== step && isStepVisuallyComplete(stepNum);

                    return (
                        <div
                            key={label}
                            className={`step-item ${isActive ? 'active' : isCompleted ? 'completed' : ''}`}
                            onClick={() => {
                                if (stepNum < step) {
                                    // Go back freely
                                    setStep(stepNum);
                                } else if (stepNum > step) {
                                    // Validate all previous steps before jumping forward
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
                            <span>{label}</span>
                            {isCompleted && <i className="fa fa-check ms-2 text-success"></i>}
                        </div>
                    );
                })}
            </div>

            <form onSubmit={handleSubmit}>
                {step === 1 && (
                    <div className="row">
                        <div className="col-md-6">
                            <div className="field-wrapper">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                                <label className="form-label">Business Name (*)</label>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="field-wrapper">
                                <input
                                    type="email"
                                    className="form-control"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <label className="form-label">Email (*)</label>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="field-wrapper">
                                <PhoneInputField value={phone} setValue={setPhone} />
                                <label className="form-label">Phone (*)</label>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="field-wrapper">
                                <select
                                    className="form-select"
                                    value={timezone}
                                    onChange={(e) => setTimezone(e.target.value)}
                                    required
                                >
                                    {timezones.map((tz) => (
                                        <option key={tz.value} value={tz.value}>
                                            {tz.label}
                                        </option>
                                    ))}
                                </select>
                                <label className="form-label">Timezone (*)</label>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="field-wrapper">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={businessNumber}
                                    onChange={(e) => setBusinessNumber(e.target.value)}
                                    required
                                />
                                <label className="form-label">GST/Tax Number (*)</label>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="field-wrapper">
                                <input
                                    type="number"
                                    className="form-control"
                                    value={taxRate}
                                    onChange={(e) => setTaxRate(e.target.value)}
                                    required
                                />
                                <label className="form-label">Tax Rate (%) (*)</label>
                            </div>
                        </div>
                        <div className="col-md-12">
                            <div className="field-wrapper">
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    value={businessDescription}
                                    onChange={(e) => setBusinessDescription(e.target.value)}
                                    required
                                />
                                <label className="form-label">Business Description (*)</label>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="row">
                        <div className="col-md-6">
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
                        <div className="col-md-6">
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
                        <div className="col-md-6">
                            <div className="field-wrapper">
                                <select
                                    className="form-select"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    required
                                >
                                    {countries.map(({ code, name }) => (
                                        <option key={code} value={code}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                                <label className="form-label">Country (*)</label>
                            </div>
                        </div>
                        <div className="col-md-6">
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
                                <label className="form-label">Province / State (*)</label>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="field-wrapper">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={postalCode}
                                    onChange={(e) => setPostalCode(e.target.value)}
                                    required
                                />
                                <label className="form-label">Postal / ZIP Code (*)</label>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div>
                        <div className="row g-2">
                            {services.map((service) => (
                                <div className="col-6 col-sm-4 col-md-3 text-center" key={service}>
                                    <div
                                        className={`alert w-100 p-3 fw-bold mb-0 ${selectedServices.includes(service) ? 'alert-success' : 'alert-secondary'}`}
                                        role="button"
                                        onClick={() => toggleService(service)}
                                    >
                                        {service}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div>
                        <div
                            className="position-relative d-flex align-items-center justify-content-center bg-light rounded mb-3"
                            style={{ height: '150px', border: '2px dashed #dee2e6' }}
                        >
                            {logo ? (
                                <img
                                    src={typeof logo === 'string' ? logo : URL.createObjectURL(logo)}
                                    alt="Business Logo"
                                    className="img-fluid rounded"
                                    style={{ maxHeight: '140px', objectFit: 'contain' }}
                                />
                            ) : (
                                <div className="text-muted small text-center">
                                    <i className="bi bi-image" style={{ fontSize: '2rem' }}></i>
                                    <div>Upload your logo</div>
                                </div>
                            )}
                        </div>
                        <div>
                            <input
                                type="file"
                                accept="image/*"
                                className="form-control w-50"
                                onChange={(e) => setLogo(e.target.files[0])}
                            />
                        </div>
                    </div>
                )}

                <div className="d-flex justify-content-between mt-4">
                    {step > 1 && (
                        <button type="button" className="btn bg-gradient btn-sm btn-dark" onClick={prevStep}>
                            <i className="fa fa-chevron-left me-2"></i>Back
                        </button>
                    )}
                    {step < totalSteps ? (
                        <button type="button" className="btn bg-gradient btn-sm btn-success ms-auto" onClick={nextStep}>
                            Next <i className="fa fa-chevron-right ms-2"></i>
                        </button>
                    ) : (
                        <SubmitButton
                            isLoading={isCreating || isUpdating}
                            btnClass="btn btn-success ms-auto"
                            btnName="Save Changes"
                            isDisabled={!validateStep()}
                        />
                    )}
                </div>
            </form>
        </>
    );
}
