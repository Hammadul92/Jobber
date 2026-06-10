import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SubmitButton from "../Components/ui/SubmitButton";
import Textarea from "../Components/ui/Textarea";
import { useSubmitContactInquiryMutation } from "../store";

const initialFormState = {
  firstName: "",
  lastName: "",
  email: "",
  companyName: "",
  message: "",
  privacyAgreed: false,
};

function Contact() {
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [submitContactInquiry, { isLoading, error }] =
    useSubmitContactInquiryMutation();

  const emailError = useMemo(() => {
    if (!formData.email.trim()) return "";

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(formData.email.trim())
      ? ""
      : "Enter a valid work email address.";
  }, [formData.email]);

  const setFieldValue = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
    setSuccessMessage("");
  };

  const validateForm = () => {
    const nextErrors = {};

    if (formData.firstName.trim().length < 2) {
      nextErrors.firstName = "First name must be at least 2 characters.";
    }

    if (formData.lastName.trim().length < 2) {
      nextErrors.lastName = "Last name must be at least 2 characters.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Work email is required.";
    } else if (emailError) {
      nextErrors.email = emailError;
    }

    if (formData.companyName.trim().length < 2) {
      nextErrors.companyName = "Company name must be at least 2 characters.";
    }

    if (formData.message.trim().length < 10) {
      nextErrors.message = "Please share at least 10 characters.";
    }

    if (!formData.privacyAgreed) {
      nextErrors.privacyAgreed =
        "You must agree to the privacy policy before submitting.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const payload = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        company_name: formData.companyName.trim(),
        message: formData.message.trim(),
        privacy_agreed: formData.privacyAgreed,
      };

      const response = await submitContactInquiry(payload).unwrap();
      setSuccessMessage(
        response?.detail || "Your message has been sent successfully.",
      );
      setFormData(initialFormState);
      setFormErrors({});
    } catch (err) {
      console.error("Contact form submission failed:", err);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-xl flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
      noValidate
    >
      <h3 className="mb-1 text-xl font-semibold">Send us a message</h3>
      <p className="mb-4 text-sm text-gray-600">
        Tell us a bit about your business so we can help you faster.
      </p>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error?.data?.detail || "Something went wrong. Please try again."}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {successMessage}
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-700">
            First Name
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFieldValue("firstName", e.target.value)}
            placeholder="Jane"
            className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent ${
              formErrors.firstName
                ? "border-red-300 bg-red-50"
                : "border-gray-200 bg-gray-50"
            }`}
          />
          {formErrors.firstName && (
            <p className="mt-2 text-xs text-red-600">{formErrors.firstName}</p>
          )}
        </div>

        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Last Name
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFieldValue("lastName", e.target.value)}
            placeholder="Doe"
            className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent ${
              formErrors.lastName
                ? "border-red-300 bg-red-50"
                : "border-gray-200 bg-gray-50"
            }`}
          />
          {formErrors.lastName && (
            <p className="mt-2 text-xs text-red-600">{formErrors.lastName}</p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Work Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFieldValue("email", e.target.value)}
          placeholder="jane@company.com"
          className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent ${
            formErrors.email
              ? "border-red-300 bg-red-50"
              : "border-gray-200 bg-gray-50"
          }`}
        />
        {formErrors.email && (
          <p className="mt-2 text-xs text-red-600">{formErrors.email}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Company Name
        </label>
        <input
          type="text"
          value={formData.companyName}
          onChange={(e) => setFieldValue("companyName", e.target.value)}
          placeholder="Acme Contracting"
          className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent ${
            formErrors.companyName
              ? "border-red-300 bg-red-50"
              : "border-gray-200 bg-gray-50"
          }`}
        />
        {formErrors.companyName && (
          <p className="mt-2 text-xs text-red-600">{formErrors.companyName}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          How can we help?
        </label>
        <Textarea
          id="contact-help"
          label={null}
          value={formData.message}
          onChange={(value) => setFieldValue("message", value)}
          isRequired={false}
          minLength={10}
          maxLength={5000}
          fieldClass={`resize-none rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent ${
            formErrors.message
              ? "border-red-300 bg-red-50"
              : "border-gray-200 bg-gray-50"
          }`}
          rows={4}
          placeholder="I'm interested in a demo and have a question about QuickBooks integration..."
        />
        {formErrors.message && (
          <p className="-mt-4 text-xs text-red-600">{formErrors.message}</p>
        )}
      </div>

      <div>
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="privacy"
            checked={formData.privacyAgreed}
            onChange={(e) => setFieldValue("privacyAgreed", e.target.checked)}
            className="mt-1"
          />
          <label htmlFor="privacy" className="text-xs text-gray-600">
            I agree to Contractorz&apos;s{" "}
            <Link to="/privacy-policy" className="underline">
              Privacy Policy
            </Link>
            . We respect your inbox and never sell your data.
          </label>
        </div>
        {formErrors.privacyAgreed && (
          <p className="mt-2 text-xs text-red-600">
            {formErrors.privacyAgreed}
          </p>
        )}
      </div>

      <SubmitButton
        isLoading={isLoading}
        btnClass="mt-2 w-full rounded-xl bg-black py-3 text-base font-semibold text-white transition hover:bg-gray-900"
        btnName="Send Request"
      />
    </form>
  );
}

export default Contact;
