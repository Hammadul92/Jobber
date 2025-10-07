import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { countries, provinces } from '../../../../utils/locations';
import { useFetchClientQuery, useUpdateClientMutation } from '../../../../store';
import SubmitButton from '../../../../utils/SubmitButton';

export default function Client({ token }) {
    const { id } = useParams();
    const navigate = useNavigate();

    const {
        data: clientData,
        isLoading,
        error,
    } = useFetchClientQuery(id, {
        skip: !token,
    });
    const [updateClient, { isLoading: updating, error: updateError, isSuccess }] = useUpdateClientMutation();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [streetAddress, setStreetAddress] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('CA');
    const [provinceState, setProvinceState] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [role, setRole] = useState('');

    useEffect(() => {
        if (clientData) {
            setName(clientData.client_name || '');
            setEmail(clientData.client_email || '');
            setPhone(clientData.client_phone || '');
            setStreetAddress(clientData.street_address || '');
            setCity(clientData.city || '');
            setCountry(clientData.country || 'CA');
            setProvinceState(clientData.province_state || '');
            setPostalCode(clientData.postal_code || '');
            setRole(clientData.role || 'CLIENT');
        }
    }, [clientData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateClient({
                id,
                street_address: streetAddress,
                city,
                country,
                province_state: provinceState,
                postal_code: postalCode,
            }).unwrap();
        } catch (err) {
            console.error('Failed to update client:', err);
        }
    };

    if (isLoading) return <div>Loading client...</div>;

    if (error) {
        return (
            <div className="alert alert-danger mt-4" role="alert">
                {error?.data?.detail || 'Failed to load client.'}
            </div>
        );
    }

    return (
        <div className="row">
            <div className="col-12 col-lg-3 mb-4">
                <div className="text-center shadow p-3 bg-white rounded-3 mb-3">
                    <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=120`}
                        alt={name}
                        className="rounded-circle mb-3 shadow-sm"
                        width="90"
                        height="90"
                    />
                    <h4 className="mb-1">{name}</h4>
                    <span className="badge rounded-pill bg-dark p-2">{role}</span>

                    <div className="d-flex flex-column align-items-center small text-muted mt-2">
                        <div>{email}</div>
                        <div>{phone}</div>
                    </div>
                </div>
            </div>

            <div className="col-12 col-lg-9">
                <form onSubmit={handleSubmit}>
                    {updateError && (
                        <div className="alert alert-danger mb-3">
                            {updateError?.data?.detail || 'Failed to update client.'}
                        </div>
                    )}

                    {isSuccess && <div className="alert alert-success mb-3">Client updated successfully!</div>}

                    <h5>Billing Address</h5>
                    <div className="row mb-3">
                        <div className="col-md-8 mb-3">
                            <label className="form-label">Street Address</label>
                            <input
                                type="text"
                                className="form-control"
                                value={streetAddress}
                                onChange={(e) => setStreetAddress(e.target.value)}
                            />
                        </div>

                        <div className="col-md-4 mb-3">
                            <label className="form-label">City</label>
                            <input
                                type="text"
                                className="form-control"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="row mb-3">
                        <div className="col-md-4 mb-3">
                            <label className="form-label">Country</label>
                            <select
                                className="form-select"
                                value={country}
                                onChange={(e) => {
                                    setCountry(e.target.value);
                                    setProvinceState('');
                                }}
                            >
                                {countries.map(({ code, name }) => (
                                    <option key={code} value={code}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-4 mb-3">
                            <label className="form-label">Province/State</label>
                            <select
                                className="form-select"
                                value={provinceState}
                                onChange={(e) => setProvinceState(e.target.value)}
                            >
                                <option value="">Select Province/State</option>
                                {provinces[country]?.map((prov) => (
                                    <option key={prov.code} value={prov.code}>
                                        {prov.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-4 mb-3">
                            <label className="form-label">Postal/ZIP Code</label>
                            <input
                                type="text"
                                className="form-control"
                                value={postalCode}
                                onChange={(e) => setPostalCode(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="d-flex justify-content-end">
                        <button
                            type="button"
                            className="btn btn-dark me-2"
                            onClick={() => navigate('/dashboard/clients')}
                        >
                            Cancel
                        </button>
                        <SubmitButton isLoading={updating} btnClass="btn btn-success" btnName="Save Changes" />
                    </div>
                </form>
            </div>
        </div>
    );
}
