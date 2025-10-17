import { useState, useEffect } from 'react';
import { provinces, countries } from '../../../../utils/locations';
import { useFetchBusinessesQuery, useCreateBusinessMutation, useUpdateBusinessMutation } from '../../../../store';
import SubmitButton from '../../../../utils/SubmitButton';
import PhoneInputField from '../../../../utils/PhoneInput';

export default function Business({ token, setAlert }) {
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

    const toggleService = (service) => {
        setSelectedServices((prev) =>
            prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedServices.length === 0) {
            setAlert({ type: 'danger', message: 'Please select at least one service.' });
            return;
        }

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
            if (logo && typeof logo !== 'string') {
                formData.append('logo', logo);
            }

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

    if (isLoading) return <div>Loading business data...</div>;

    return (
        <form onSubmit={handleSubmit} className="tab-pane active" encType="multipart/form-data">
            <div className="row">
                <div className="col-md-4">
                    <div className="field-wrapper">
                        <input
                            type="text"
                            className="form-control"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        <label className="form-label">Name (*)</label>
                    </div>
                </div>

                <div className="col-md-4">
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

                <div className="col-md-4">
                    <div className="field-wrapper">
                        <PhoneInputField value={phone} setValue={setPhone} />
                        <label className="form-label">Phone (*)</label>
                    </div>
                </div>

                <div className="col-md-4">
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

                <div className="col-md-4">
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

                <div className="col-md-4">
                    <div className="field-wrapper">
                        <input
                            type="number"
                            min="0"
                            className="form-control"
                            value={taxRate}
                            onChange={(e) => setTaxRate(e.target.value)}
                            required
                        />
                        <label className="form-label">Tax Rate % (*)</label>
                    </div>
                </div>

                <div className="col-md-8">
                    <div className="field-wrapper">
                        <textarea
                            className="form-control"
                            rows={5}
                            value={businessDescription}
                            onChange={(e) => setBusinessDescription(e.target.value)}
                            required
                        />
                        <label className="form-label">Description (*)</label>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm p-3 mt-3">
                        <div
                            className="position-relative d-flex align-items-center justify-content-center bg-light rounded"
                            style={{ height: '120px', border: '2px dashed #dee2e6' }}
                        >
                            {logo ? (
                                <img
                                    src={typeof logo === 'string' ? logo : URL.createObjectURL(logo)}
                                    alt="Business Logo"
                                    className="img-fluid rounded"
                                    style={{
                                        maxHeight: '110px',
                                        maxWidth: '100%',
                                        objectFit: 'contain',
                                    }}
                                />
                            ) : (
                                <div className="text-muted small">
                                    <i className="bi bi-image" style={{ fontSize: '2rem' }}></i>
                                    <div>Upload your logo</div>
                                </div>
                            )}
                        </div>

                        <div className="field-wrapper">
                            <input
                                type="file"
                                accept="image/*"
                                className="form-control"
                                onChange={(e) => setLogo(e.target.files[0])}
                            />
                            <label className="form-label">Business Logo</label>
                        </div>
                    </div>
                </div>
            </div>

            <h5 className="mt-4 mb-0">Business Address</h5>
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
                                <option key={code} value={code}>
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

            <h5 className="mt-4">Services Offered</h5>
            <div className="d-flex flex-wrap gap-2 mb-3">
                {services.map((service) => (
                    <div
                        key={service}
                        className={`alert rounded-pill p-2 mb-0 ${
                            selectedServices.includes(service) ? 'alert-success' : 'alert-secondary'
                        }`}
                        role="button"
                        style={{ cursor: 'pointer' }}
                        onClick={() => toggleService(service)}
                    >
                        {service}
                    </div>
                ))}
            </div>

            <SubmitButton isLoading={isCreating || isUpdating} btnClass="btn btn-success" btnName="Save Changes" />
        </form>
    );
}
