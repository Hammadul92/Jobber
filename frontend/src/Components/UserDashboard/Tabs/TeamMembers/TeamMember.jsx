import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { countries, provinces } from '../../../../utils/locations';
import { useFetchClientQuery, useUpdateClientMutation } from '../../../../store';

export default function Client() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: clientData, isLoading, error } = useFetchClientQuery({ id });
    const [updateClient, { isLoading: updating, error: updateError, isSuccess }] = useUpdateClientMutation();

    // Basic
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // Address
    const [streetAddress, setStreetAddress] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('CA');
    const [provinceState, setProvinceState] = useState('');
    const [postalCode, setPostalCode] = useState('');

    useEffect(() => {
        if (clientData) {
            setName(clientData.name || '');
            setEmail(clientData.email || '');
            setPhone(clientData.phone || '');
            setStreetAddress(clientData.street_address || '');
            setCity(clientData.city || '');
            setCountry(clientData.country || 'CA');
            setProvinceState(clientData.province_state || '');
            setPostalCode(clientData.postal_code || '');
        }
    }, [clientData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateClient({
                id,
                name,
                email,
                phone,
                street_address: streetAddress,
                city,
                country,
                province_state: provinceState,
                postal_code: postalCode,
            }).unwrap();
            navigate('/dashboard/clients');
        } catch (err) {
            console.error('Failed to update client:', err);
        }
    };

    if (isLoading) return <div>Loading client...</div>;

    if (error) {
        return (
            <div className="alert alert-danger" role="alert">
                {error?.data?.detail || 'Failed to load client.'}
            </div>
        );
    }

    return (
        <div>
            <h3 className="mb-4">{name}</h3>

            <form onSubmit={handleSubmit}>
                {updateError && (
                    <div className="alert alert-danger mb-3">
                        {updateError?.data?.detail || 'Failed to update client.'}
                    </div>
                )}

                {isSuccess && <div className="alert alert-success mb-3">Client updated successfully!</div>}

                {/* Basic Info */}
                <div className="row mb-3">
                    <div className="mb-3 col-md-4">
                        <label className="form-label">Name (*)</label>
                        <input
                            type="text"
                            className="form-control"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-3 col-md-4">
                        <label className="form-label">Email (*)</label>
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-3 col-md-4">
                        <label className="form-label">Phone (*)</label>
                        <input
                            type="text"
                            className="form-control"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* Billing Address */}
                <h5>Billing Address</h5>
                <div className="row mb-3">
                    <div className="mb-3 col-md-8">
                        <label className="form-label">Street Address</label>
                        <input
                            type="text"
                            className="form-control"
                            value={streetAddress}
                            onChange={(e) => setStreetAddress(e.target.value)}
                        />
                    </div>

                    <div className="mb-3 col-md-4">
                        <label className="form-label">City</label>
                        <input
                            type="text"
                            className="form-control"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                        />
                    </div>
                </div>

                <div className="row">
                    <div className="mb-3 col-md-4">
                        <label className="form-label">Country</label>
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

                    <div className="mb-3 col-md-4">
                        <label className="form-label">Province/State</label>
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

                    <div className="mb-3 col-md-4">
                        <label className="form-label">Postal/ZIP Code</label>
                        <input
                            type="text"
                            className="form-control"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <button
                        type="button"
                        className="btn btn-sm btn-dark me-2"
                        onClick={() => navigate('/dashboard/clients')}
                    >
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-sm btn-success" disabled={updating}>
                        {updating ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
