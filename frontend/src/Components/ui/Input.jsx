import { useState, useEffect } from "react";
import { FaEyeSlash, FaEye } from "react-icons/fa";

export default function Input({
  id,
  fieldClass,
  label,
  value,
  onChange,
  isRequired = false,
  isDisabled = false,
  type = "text",
  min,
  max,
  step,
}) {
  const isPhone = type === "tel";
  const isPassword = type === "password";
  const isFile = type === "file";
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const phoneRegex = /^\+1\s?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
  const handlePhoneChange = (e) => {
    let inputVal = e.target.value;

    if (!inputVal.startsWith("+1")) {
      inputVal = "+1" + inputVal.replace(/^\+?1?\s*/, "");
    }

    onChange(inputVal);
  };

  const validatePhone = (number) => phoneRegex.test(number.trim());

  useEffect(() => {
    if (isPhone && value && !validatePhone(value)) {
      setError(
        "Phone number must be in valid +1 format (e.g. +1 555-555-5555)",
      );
    } else {
      setError("");
    }
  }, [value, isPhone]);

  const isNumber = type === "number";
  const handleChange = (e) => {
    if (isPhone) {
      handlePhoneChange(e);
    } else if (isFile) {
      onChange(e);
    } else if (isNumber) {
      let val = e.target.value;
      // Allow empty string for controlled input
      if (val === "") {
        setError("");
        onChange(val);
        return;
      }
      // Only allow numbers and dot
      if (!/^\d*\.?\d*$/.test(val)) return;
      const num = parseFloat(val);
      if (typeof min !== "undefined" && num < min) {
        setError(`Value must be at least ${min}`);
      } else if (typeof max !== "undefined" && num > max) {
        setError(`Value cannot exceed ${max}`);
      } else {
        setError("");
      }
      onChange(val);
    } else {
      onChange(e.target.value);
    }
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
      {isPassword ? (
        <div className="flex">
          <input
            type={showPassword ? "text" : "password"}
            id={id}
            className={`w-full rounded-l-xl rounded-r-none bg-[#FAFAFA] border border-gray-200 px-4 py-3 text-base focus:ring-2 focus:ring-accent focus:border-accent transition bg-white
                            ${fieldClass || ""}
                            ${error ? "border-red-500 focus:border-red-500 focus:ring-red-200" : ""}`}
            value={value}
            onChange={handleChange}
            required={isRequired}
            disabled={isDisabled}
            placeholder={label}
            autoComplete="off"
          />
          <button
            type="button"
            className="rounded-r-xl rounded-l-none border border-l-0 border-gray-200 bg-slate-50 px-4 text-gray-600 hover:bg-slate-100 transition"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
          >
            {!showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
      ) : (
        <input
          type={type}
          id={id}
          className={`w-full rounded-xl bg-[#FAFAFA] border border-gray-200 px-4 py-3 text-base focus:ring-2 focus:ring-accent focus:border-accent transition bg-white
                        ${fieldClass || ""}
                        ${error ? "border-red-500 focus:border-red-500 focus:ring-red-200" : ""}`}
          value={isFile ? undefined : value}
          onChange={handleChange}
          onBlur={() => {
            if (isPhone && value && !validatePhone(value)) {
              setError(
                "Phone number must be in valid +1 format (e.g. +1555-555-5555)",
              );
            } else if (isNumber && value !== "") {
              const num = parseFloat(value);
              if (typeof min !== "undefined" && num < min) {
                setError(`Value must be at least ${min}`);
              } else if (typeof max !== "undefined" && num > max) {
                setError(`Value cannot exceed ${max}`);
              } else {
                setError("");
              }
            } else {
              setError("");
            }
          }}
          required={isRequired}
          disabled={isDisabled}
          placeholder={isPhone ? "+15875001189" : label}
          autoComplete="off"
          min={isNumber ? min : undefined}
          max={isNumber ? max : undefined}
          step={isNumber ? step : undefined}
        />
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
