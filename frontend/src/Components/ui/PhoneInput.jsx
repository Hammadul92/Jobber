import { useState, useEffect } from "react";

export default function PhoneInputField({
  value,
  setValue,
  optional,
  formLarge,
}) {
  const [error, setError] = useState("");

  const phoneRegex = /^\+1\s?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;

  const handleChange = (e) => {
    let inputVal = e.target.value;

    if (!inputVal.startsWith("+1")) {
      inputVal = "+1" + inputVal.replace(/^\+?1?\s*/, "");
    }

    setValue(inputVal);
  };

  const validatePhone = (number) => phoneRegex.test(number.trim());

  useEffect(() => {
    if (value && !validatePhone(value)) {
      setError(
        "Phone number must be in valid +1 format (e.g. +1 555-555-5555)",
      );
    } else {
      setError("");
    }
  }, [value]);

  return (
    <div className="mb-6">
      <label
        htmlFor="phone"
        className="mb-1 block text-sm font-semibold text-gray-500 uppercase"
      >
        Phone {!optional && <span className="text-accent">*</span>}
      </label>
      <input
        type="tel"
        className={`w-full rounded-xl bg-[#FAFAFA] border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-accent focus:border-accent transition bg-white ${formLarge ? "text-lg" : ""} ${error ? "border-red-500 focus:border-red-500 focus:ring-red-200" : ""}`}
        name="phone"
        required={!optional}
        placeholder="+15875001189"
        value={value}
        onChange={handleChange}
        onBlur={() => {
          if (value && !validatePhone(value))
            setError(
              "Phone number must be in valid +1 format (e.g. +1555-555-5555)",
            );
          else setError("");
        }}
      />
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
