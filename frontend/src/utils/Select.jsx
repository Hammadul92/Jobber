export default function Select({ id, label, value, isRequired = false, isDisabled = false, options = [], onChange }) {
    return (
        <div className="mb-3">
            <label className="form-label fw-bold" htmlFor={id}>
                {label} {isRequired && <small className="text-danger">(Required)</small>}
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
