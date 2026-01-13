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
        <div className="mb-4">
            {label && (
                <label htmlFor={id} className="mb-1 block text-sm font-semibold text-gray-700">
                    {label} {isRequired && <span className="text-accent">*</span>}
                </label>
            )}
            <input
                type={type}
                id={id}
                className={`${
                    fieldClass ||
                    'w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500'
                } ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
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
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}
