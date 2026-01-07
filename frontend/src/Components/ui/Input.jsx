import { useState, useEffect } from 'react';

export default function Input({
    id,
    fieldClass,
    label,
    value,
    onChange,
    isRequired = false,
    isDisabled = false,
    type = 'text',
}) {
    const isPhone = type === 'tel';
    const [error, setError] = useState('');
    const phoneRegex = /^\+1\s?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
    const handlePhoneChange = (e) => {
        let inputVal = e.target.value;

        if (!inputVal.startsWith('+1')) {
            inputVal = '+1' + inputVal.replace(/^\+?1?\s*/, '');
        }

        onChange(inputVal);
    };

    const validatePhone = (number) => phoneRegex.test(number.trim());

    useEffect(() => {
        if (isPhone && value && !validatePhone(value)) {
            setError('Phone number must be in valid +1 format (e.g. +1 555-555-5555)');
        } else {
            setError('');
        }
    }, [value, isPhone]);

    const handleChange = (e) => {
        if (isPhone) {
            handlePhoneChange(e);
        } else {
            onChange(e.target.value);
        }
    };

    return (
        <div className="mb-3">
            <label htmlFor={id} className="form-label fw-semibold">
                {label} {isRequired && <sup className="text-danger small text-accent font-bold">(*)</sup>}
            </label>
            <input
                type={type}
                id={id}
                className={`${fieldClass} ${error ? 'is-invalid' : ''}`}
                value={value}
                onChange={handleChange}
                onBlur={() => {
                    if (isPhone && value && !validatePhone(value)) {
                        setError('Phone number must be in valid +1 format (e.g. +1555-555-5555)');
                    } else {
                        setError('');
                    }
                }}
                required={isRequired}
                disabled={isDisabled}
                placeholder={isPhone ? '+1555-555-5555' : ''}
            />
            {error && <div className="invalid-feedback">{error}</div>}
        </div>
    );
}
