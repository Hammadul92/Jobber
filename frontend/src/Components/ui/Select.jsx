export default function Select({ id, label, value, isRequired = false, isDisabled = false, options = [], onChange }) {
    return (
        <div className="mb-4">
            {label && (
                <label className="mb-1 block text-sm font-semibold text-gray-700" htmlFor={id}>
                    {label} {isRequired && <span className="text-accent">*</span>}
                </label>
            )}
            <select
                id={id}
                value={value}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                required={isRequired}
                disabled={isDisabled}
                onChange={(e) => onChange(e.target.value)}
            >
                <option
                    value=""
                    disabled={isRequired}
                    className="text-gray-400"
                >
                    -- Select {label} --
                </option>
                {options.map((option, index) => {
                    return (
                        <option
                            key={index}
                            value={option.value}
                            className="bg-white text-gray-800 hover:bg-accent/10"
                        >
                            {option.label}
                        </option>
                    );
                })}
            </select>
        </div>
    );
}
