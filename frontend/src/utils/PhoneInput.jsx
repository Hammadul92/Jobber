import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

export default function PhoneInputField({ country, value, setValue, optional }) {
    return (
        <PhoneInput
            country={country?.toLowerCase() || 'ca'}
            onlyCountries={['ca', 'us']}
            preferredCountries={['ca', 'us']}
            value={value}
            onChange={(val) => setValue(val)}
            inputProps={{
                name: 'phone',
                required: !optional,
            }}
        />
    );
}
