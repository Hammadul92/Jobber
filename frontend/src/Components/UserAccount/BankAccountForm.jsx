import { useState } from 'react';
import SubmitButton from '../../utils/SubmitButton';
import { useAddBankAccountMutation } from '../../store';

export default function BankAccountForm({ setAlert, onSuccess }) {
    const [addBankAccount, { isLoading }] = useAddBankAccountMutation();

    const [form, setForm] = useState({
        account_holder_name: '',
        account_holder_type: 'individual',
        country: 'US',
        currency: 'usd',
        routing_number: '',
        transit_number: '',
        account_number: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = Object.fromEntries(
                Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
            );
            const response = await addBankAccount(payload).unwrap();
            setAlert({ type: 'success', message: 'Bank account added successfully!' });
            if (onSuccess) onSuccess();
        } catch (err) {
            setAlert({
                type: 'danger',
                message: err?.data?.detail || 'Failed to save bank account information.',
            });
        }
    };

    const isUS = form.country === 'US';
    const isCA = form.country === 'CA';

    const currencyOptions = {
        US: [{ value: 'usd', label: 'USD - US Dollar' }],
        CA: [{ value: 'cad', label: 'CAD - Canadian Dollar' }],
    };

    return (
        <form onSubmit={handleSubmit} className="row" autoComplete="off">
            {/* Account Holder Name */}
            <div className="col-md-12">
                <div className="field-wrapper">
                    <input
                        type="text"
                        name="account_holder_name"
                        className="form-control"
                        value={form.account_holder_name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                    />
                    <label className="form-label">Account Holder Name (*)</label>
                </div>
            </div>

            {/* Account Holder Type */}
            <div className="col-md-6">
                <div className="field-wrapper">
                    <select
                        name="account_holder_type"
                        className="form-select"
                        value={form.account_holder_type}
                        onChange={handleChange}
                    >
                        <option value="individual">Individual</option>
                        <option value="company">Company</option>
                    </select>
                    <label className="form-label">Account Holder Type (*)</label>
                </div>
            </div>

            {/* Country */}
            <div className="col-md-6">
                <div className="field-wrapper">
                    <select
                        name="country"
                        className="form-select"
                        value={form.country}
                        onChange={(e) => {
                            const country = e.target.value;
                            setForm((prev) => ({
                                ...prev,
                                country,
                                currency: currencyOptions[country]?.[0]?.value || 'usd',
                            }));
                        }}
                    >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                    </select>
                    <label className="form-label">Country (*)</label>
                </div>
            </div>

            {/* Currency (hidden, auto-set) */}
            <div className="col-md-6 d-none">
                <div className="field-wrapper">
                    <select name="currency" className="form-select" value={form.currency} onChange={handleChange}>
                        {currencyOptions[form.country].map((c) => (
                            <option key={c.value} value={c.value}>
                                {c.label}
                            </option>
                        ))}
                    </select>
                    <label className="form-label">Currency (*)</label>
                </div>
            </div>

            {/* US Bank Fields */}
            {isUS && (
                <>
                    <div className="col-md-6">
                        <div className="field-wrapper">
                            <input
                                type="text"
                                name="routing_number"
                                className="form-control"
                                value={form.routing_number}
                                onChange={handleChange}
                                placeholder="e.g. 110000000"
                                required
                            />
                            <label className="form-label">Routing Number (*)</label>
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className="field-wrapper">
                            <input
                                type="text"
                                name="account_number"
                                className="form-control"
                                value={form.account_number}
                                onChange={handleChange}
                                placeholder="e.g. 000123456789"
                                required
                            />
                            <label className="form-label">Account Number (*)</label>
                        </div>
                    </div>
                </>
            )}

            {/* Canada Bank Fields */}
            {isCA && (
                <>
                    <div className="col-md-6">
                        <div className="field-wrapper">
                            <input
                                type="text"
                                name="transit_number"
                                className="form-control"
                                value={form.transit_number}
                                onChange={handleChange}
                                placeholder="5-digit transit number"
                                required
                            />
                            <label className="form-label">Transit Number (*)</label>
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className="field-wrapper">
                            <input
                                type="text"
                                name="routing_number"
                                className="form-control"
                                value={form.routing_number}
                                onChange={handleChange}
                                placeholder="3-digit institution number"
                                required
                            />
                            <label className="form-label">Institution Number (*)</label>
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className="field-wrapper">
                            <input
                                type="text"
                                name="account_number"
                                className="form-control"
                                value={form.account_number}
                                onChange={handleChange}
                                placeholder="7–12 digit account number"
                                required
                            />
                            <label className="form-label">Account Number (*)</label>
                        </div>
                    </div>
                </>
            )}

            <div className="text-end mt-3">
                <SubmitButton btnClass="btn btn-success" btnName="Save Bank Account" isLoading={isLoading} />
            </div>
        </form>
    );
}
