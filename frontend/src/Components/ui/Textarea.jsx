import { useState } from "react";

export default function Textarea({
  id,
  label,
  value,
  onChange,
  isRequired = false,
  isDisabled = false,
  fieldClass,
  rows = 3,
  minLength,
  maxLength,
  placeholder,
}) {
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const val = e.target.value;
    if (minLength && val.length < minLength) {
      setError(`Minimum length is ${minLength}`);
    } else if (maxLength && val.length > maxLength) {
      setError(`Maximum length is ${maxLength}`);
    } else {
      setError("");
    }
    onChange(val);
  };

  return (
    <div className="mb-6">
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-semibold text-gray-500 uppercase"
        >
          {label} {isRequired && <span className="text-accent">*</span>}
        </label>
      )}
      <textarea
        id={id}
        className={`w-full rounded-xl bg-[#FAFAFA] border border-gray-200 px-4 py-3 text-base focus:ring-2 focus:ring-accent focus:border-accent transition bg-white ${fieldClass || ""} ${error ? "border-red-500 focus:border-red-500 focus:ring-red-200" : ""}`}
        value={value}
        onChange={handleChange}
        required={isRequired}
        disabled={isDisabled}
        rows={rows}
        minLength={minLength}
        maxLength={maxLength}
        placeholder={placeholder || label}
      />
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
