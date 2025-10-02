import { useState, useEffect } from 'react';
import { provinces, countries } from '../../../../utils/locations';

import { useFetchBusinessesQuery, useCreateBusinessMutation, useUpdateBusinessMutation } from '../../../../store';

export default function Business({ token }) {
    const [alert, setAlert] = useState(null);

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

    const {
        data: businessData,
        isLoading,
        refetch,
    } = useFetchBusinessesQuery(undefined, {
        skip: !token,
    });
    const [createBusiness, { isLoading: isCreating }] = useCreateBusinessMutation();
    const [updateBusiness, { isLoading: isUpdating }] = useUpdateBusinessMutation();

    useEffect(() => {
        if (businessData && Array.isArray(businessData) && businessData.length > 0) {
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
        }
    }, [businessData]);

    const toggleService = (service) => {
        setSelectedServices((prev) =>
            prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
        );
        setAlert(null);
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
        { value: 'America/Moncton', label: 'Atlantic Time (AT) - Moncton' },
        { value: 'America/Toronto', label: 'Eastern Time (ET) - Toronto' },
        { value: 'America/Montreal', label: 'Eastern Time (ET) - Montreal' },
        { value: 'America/New_York', label: 'Eastern Time (ET) - New York' },
        { value: 'America/Chicago', label: 'Central Time (CT) - Chicago' },
        { value: 'America/Winnipeg', label: 'Central Time (CT) - Winnipeg' },
        { value: 'America/Edmonton', label: 'Mountain Time (MT) - Edmonton' },
        { value: 'America/Denver', label: 'Mountain Time (MT) - Denver' },
        { value: 'America/Vancouver', label: 'Pacific Time (PT) - Vancouver' },
        { value: 'America/Los_Angeles', label: 'Pacific Time (PT) - Los Angeles' },
    ];

    if (isLoading) return <div>Loading business data...</div>;

    return (
        <form className="tab-pane active" onSubmit={handleSubmit}>
            {alert && <div className={`alert alert-${alert.type}`}>{alert.message}</div>}

            <div className="row">
                <div className="mb-3 col-md-6">
                    <div className="row">
                        <label className="col-sm-4 col-form-label">Business Name (*)</label>
                        <div className="col-sm-8">
                            <input
                                type="text"
                                className="form-control"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="mb-3 col-md-6">
                    <div className="row">
                        <label className="col-sm-4 col-form-label">Business Email (*)</label>
                        <div className="col-sm-8">
                            <input
                                type="email"
                                className="form-control"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="mb-3 col-md-6">
                    <div className="row">
                        <label className="col-sm-4 col-form-label">Business Phone (*)</label>
                        <div className="col-sm-8">
                            <input
                                type="text"
                                className="form-control"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="mb-3 col-md-6">
                    <div className="row">
                        <label className="col-sm-4 col-form-label">Timezone (*)</label>
                        <div className="col-sm-8">
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
                        </div>
                    </div>
                </div>

                <div className="mb-3 col-md-6">
                    <div className="row">
                        <label className="col-sm-4 col-form-label">Business Number (*)</label>
                        <div className="col-sm-8">
                            <input
                                type="text"
                                className="form-control"
                                value={businessNumber}
                                onChange={(e) => setBusinessNumber(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Tax Rate */}
                <div className="mb-3 col-md-6">
                    <div className="row">
                        <label className="col-sm-4 col-form-label">Tax Rate % (*)</label>
                        <div className="col-sm-8">
                            <input
                                type="number"
                                step="1"
                                min="0"
                                className="form-control"
                                value={taxRate}
                                onChange={(e) => setTaxRate(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Business Description */}
                <div className="mb-3 col-md-12">
                    <div className="row">
                        <label className="col-sm-2 col-form-label">Business Description (*)</label>
                        <div className="col-sm-10">
                            <textarea
                                className="form-control"
                                rows={3}
                                value={businessDescription}
                                onChange={(e) => setBusinessDescription(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>
            </div>

            <h5 className="mt-4">Business Address</h5>
            <div className="row">
                <div className="mb-3 col-md-4">
                    <div className="row">
                        <label className="col-sm-4 col-form-label">Street Address (*)</label>
                        <div className="col-sm-8">
                            <input
                                type="text"
                                className="form-control"
                                value={streetAddress}
                                onChange={(e) => setStreetAddress(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="mb-3 col-md-4">
                    <div className="row">
                        <label className="col-sm-4 col-form-label">City (*)</label>
                        <div className="col-sm-8">
                            <input
                                type="text"
                                className="form-control"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="mb-3 col-md-4">
                    <div className="row">
                        <label className="col-sm-4 col-form-label">Country (*)</label>
                        <div className="col-sm-8">
                            <select
                                className="form-select"
                                value={country}
                                onChange={(e) => {
                                    setCountry(e.target.value);
                                    setProvinceState('');
                                }}
                                required
                            >
                                {countries.map(({ code, name }) => {
                                    return (
                                        <option value={code} key={code}>
                                            {name}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="mb-3 col-md-4">
                    <div className="row">
                        <label className="col-sm-4 col-form-label">Province/State (*)</label>
                        <div className="col-sm-8">
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
                    </div>
                </div>

                <div className="mb-3 col-md-4">
                    <div className="row">
                        <label className="col-sm-4 col-form-label">Postal/ZIP Code (*)</label>
                        <div className="col-sm-8">
                            <input
                                type="text"
                                className="form-control"
                                value={postalCode}
                                onChange={(e) => setPostalCode(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>
            </div>

            <h5 className="mt-4">Services Offered</h5>
            <div className="d-flex flex-wrap gap-2 mb-3">
                {services.map((service) => (
                    <div
                        key={service}
                        className={`alert px-3 py-2 mb-0 ${selectedServices.includes(service) ? 'alert-success' : 'alert-secondary'}`}
                        role="button"
                        style={{ cursor: 'pointer' }}
                        onClick={() => toggleService(service)}
                    >
                        {service}
                    </div>
                ))}
            </div>

            <button className="btn btn-success" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? (
                    <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                    </>
                ) : (
                    'Save'
                )}
            </button>
        </form>
    );
}
