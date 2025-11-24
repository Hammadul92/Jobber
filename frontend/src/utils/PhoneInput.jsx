import { useState, useEffect } from 'react';

export default function PhoneInputField({ value, setValue, optional, formLarge }) {
    const [error, setError] = useState('');

    const phoneRegex = /^\+1\s?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;

    const handleChange = (e) => {
        let inputVal = e.target.value;

        if (!inputVal.startsWith('+1')) {
            inputVal = '+1' + inputVal.replace(/^\+?1?\s*/, '');
        }

        setValue(inputVal);
    };

    const validatePhone = (number) => phoneRegex.test(number.trim());

    useEffect(() => {
        if (value && !validatePhone(value)) {
            setError('Phone number must be in valid +1 format (e.g. +1 555-555-5555)');
        } else {
            setError('');
        }
    }, [value]);

    return (
        <div className="mb-3">
            <label htmlFor="phone" className="form-label fw-bold">
                Phone {!optional && <small className="text-danger">(Required)</small>}
            </label>
            <input
                type="tel"
                className={`form-control ${formLarge ? 'form-control-lg' : ''} ${error ? 'is-invalid' : ''}`}
                name="phone"
                required={!optional}
                placeholder="+1555-555-5555"
                value={value}
                onChange={handleChange}
                onBlur={() => {
                    if (value && !validatePhone(value))
                        setError('Phone number must be in valid +1 format (e.g. +1555-555-5555)');
                    else setError('');
                }}
            />
            {error && <div className="invalid-feedback">{error}</div>}
        </div>
    );
}
