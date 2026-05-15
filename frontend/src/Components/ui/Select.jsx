import Dropdown from "./Dropdown";

export default function Select({
  id,
  label,
  value,
  isRequired = false,
  isDisabled = false,
  options = [],
  onChange,
  fieldClass,
}) {
  const placeholder = label ? `-- Select ${label} --` : "Select option";

  return (
    <div className={label ? "mb-6" : ""}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-semibold uppercase text-gray-500"
        >
          {label} {isRequired && <span className="text-accent">*</span>}
        </label>
      )}
      <Dropdown
        id={id}
        value={value}
        options={options}
        onChange={onChange}
        placeholder={placeholder}
        disabled={isDisabled}
        buttonClassName={`h-10 border-gray-200 bg-white text-slate-700 ${fieldClass || ""}`}
        menuClassName="z-50"
      />
    </div>
  );
}
