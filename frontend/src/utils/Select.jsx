export default function Select({ id, label, value, isRequired = false, isDisabled = false, options = [], onChange }) {
    return (
        <div className="mb-3">
            <label className="form-label fw-semibold" htmlFor={id}>
                {label} {isRequired && <sup className="text-danger small">(*)</sup>}
            </label>
            <select
                id={id}
                value={value}
                className="form-select"
                required={isRequired}
                disabled={isDisabled}
                onChange={(e) => onChange(e.target.value)}
            >
                <option>-- Select {label} --</option>
                {options.map((option, index) => {
                    return (
                        <option key={index} value={option.value}>
                            {option.label}
                        </option>
                    );
                })}
            </select>
        </div>
    );
}
