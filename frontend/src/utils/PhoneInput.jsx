import { useState, useEffect } from 'react';

export default function PhoneInputField({ country, value, setValue, optional }) {
    const [error, setError] = useState('');

    // Strict North American regex requiring +1 at the start
    const phoneRegex = /^\+1\s?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;

    const handleChange = (e) => {
        let inputVal = e.target.value;

        // Auto-add "+1" if user deletes it
        if (!inputVal.startsWith('+1')) {
            inputVal = '+1 ' + inputVal.replace(/^\+?1?\s*/, '');
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
        <>
            <input
                type="tel"
                className={`form-control ${error ? 'is-invalid' : ''}`}
                name="phone"
                required={!optional}
                placeholder="+1 555-555-5555"
                value={value}
                onChange={handleChange}
                onBlur={() => {
                    if (value && !validatePhone(value))
                        setError('Phone number must be in valid +1 format (e.g. +1 555-555-5555)');
                    else setError('');
                }}
            />
            {error && <div className="invalid-feedback">{error}</div>}
        </>
    );
}
