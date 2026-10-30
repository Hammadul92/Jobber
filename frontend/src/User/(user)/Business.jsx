import { useState, useEffect, useRef } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { LuCheck, LuImage } from "react-icons/lu";
import { provinces, countries } from "../../constants/locations";
import {
  useFetchBusinessesQuery,
  useFetchServiceOptionsQuery,
  useCreateBusinessMutation,
  useUpdateBusinessMutation,
} from "../../store";
import SubmitButton from "../../Components/ui/SubmitButton";
import LoadingScreen from "../../Components/ui/LoadingScreen";
import Input from "../../Components/ui/Input";
import Dropdown from "../../Components/ui/Dropdown";
import Textarea from "../../Components/ui/Textarea";
import { useFetchUserQuery } from "../../store";
import { NavLink } from "react-router-dom";
import { generateBusinessSlug } from "../../utils/businessSlug";
import { PAYMENT_TERMS_OPTIONS } from "../../utils/paymentTerms";
import useAlert from "../../hooks/useAlert";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+1\s?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CANADIAN_POSTAL_REGEX = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
const US_ZIP_REGEX = /^\d{5}(-\d{4})?$/;
const LOGO_MAX_SIZE = 5 * 1024 * 1024;
const LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];
const STEP_FIELDS = {
  1: [
    "name",
    "slug",
    "email",
    "phone",
    "website",
    "timezone",
    "businessNumber",
    "taxRate",
    "taxLabel",
    "defaultPaymentTerms",
    "businessDescription",
  ],
  2: ["country", "provinceState", "streetAddress", "city", "postalCode"],
  3: ["selectedServices"],
  4: ["logo"],
};

export default function Business({ token }) {
  const setAlert = useAlert();
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [businessId, setBusinessId] = useState(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("CA");
  const [provinceState, setProvinceState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [taxLabel, setTaxLabel] = useState("");
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState("NET_15");
  const [timezone, setTimezone] = useState("America/Edmonton");
  const [selectedServices, setSelectedServices] = useState([]);
  const [logo, setLogo] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [_dragActive, setDragActive] = useState(false);
  const hydratedBusinessId = useRef(null);

  const { data: user } = useFetchUserQuery(undefined, { skip: !token });
  const {
    data: businessData,
    isLoading,
  } = useFetchBusinessesQuery(undefined, { skip: !token });
  const {
    data: serviceOptions = [],
    isLoading: loadingServiceOptions,
    isError: serviceOptionsError,
  } = useFetchServiceOptionsQuery(undefined, { skip: !token });
  const [createBusiness, { isLoading: isCreating }] =
    useCreateBusinessMutation();
  const [updateBusiness, { isLoading: isUpdating }] =
    useUpdateBusinessMutation();

  useEffect(() => {
    if (businessData?.length > 0) {
      const b = businessData[0];
      if (hydratedBusinessId.current === b.id) return;
      hydratedBusinessId.current = b.id;
      setBusinessId(b.id);
      setName(b.name || "");
      setSlug(b.slug || "");
      setPhone(b.phone || "");
      setWebsite(b.website || "");
      setEmail(b.email || "");
      setBusinessDescription(b.business_description || "");
      setStreetAddress(b.street_address || "");
      setCity(b.city || "");
      setCountry(b.country || "CA");
      setProvinceState(b.province_state || "");
      setPostalCode(b.postal_code || "");
      setBusinessNumber(b.business_number || "");
      setTaxRate(b.tax_rate || 0);
      setTaxLabel(b.tax_label || "");
      setDefaultPaymentTerms(b.default_payment_terms || "NET_15");
      setTimezone(b.timezone || "America/Edmonton");
      setSelectedServices(b.services_offered || []);
      setLogo(b.logo || null);
    }
  }, [businessData]);

  const services = serviceOptions.map((service) => service.name);

  const timezones = [
    { value: "America/St_Johns", label: "Newfoundland Time (NT) - St. John’s" },
    { value: "America/Halifax", label: "Atlantic Time (AT) - Halifax" },
    { value: "America/Toronto", label: "Eastern Time (ET) - Toronto" },
    { value: "America/Winnipeg", label: "Central Time (CT) - Winnipeg" },
    { value: "America/Edmonton", label: "Mountain Time (MT) - Edmonton" },
    { value: "America/Vancouver", label: "Pacific Time (PT) - Vancouver" },
  ];

  const toggleService = (service) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service],
    );
    setFieldErrors((prev) => ({ ...prev, selectedServices: "" }));
  };

  const trimValue = (value) => String(value ?? "").trim();

  const getNormalizedWebsite = () => {
    const trimmedWebsite = website.trim();
    if (!trimmedWebsite) return "";

    return /^https?:\/\//i.test(trimmedWebsite)
      ? trimmedWebsite
      : `https://${trimmedWebsite}`;
  };

  const isValidWebsite = () => {
    const normalizedWebsite = getNormalizedWebsite();
    if (!normalizedWebsite) return true;

    try {
      const url = new URL(normalizedWebsite);
      return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname);
    } catch {
      return false;
    }
  };

  const isValidPostalCode = () => {
    const postal = trimValue(postalCode);
    if (country === "CA") return CANADIAN_POSTAL_REGEX.test(postal);
    if (country === "US") return US_ZIP_REGEX.test(postal);
    return postal.length >= 3 && postal.length <= 10;
  };

  const validateLogoFile = (file) => {
    if (!file || typeof file === "string") return "";
    if (!LOGO_TYPES.includes(file.type)) {
      return "Logo must be a PNG, JPG, or SVG file.";
    }
    if (file.size > LOGO_MAX_SIZE) {
      return "Logo must be 5MB or smaller.";
    }
    return "";
  };

  const setFieldValue = (setter, fieldName) => (value) => {
    setter(value);
    setFieldErrors((prev) => ({ ...prev, [fieldName]: "" }));
  };

  const handleNameChange = (value) => {
    // Existing businesses and manually edited slugs keep their saved URL.
    if (!businessId && (!slug || slug === generateBusinessSlug(name))) {
      setFieldValue(setSlug, "slug")(generateBusinessSlug(value));
    }
    setFieldValue(setName, "name")(value);
  };

  const handleLogoSelection = (file) => {
    if (!file) return;

    const logoError = validateLogoFile(file);
    if (logoError) {
      setFieldErrors((prev) => ({ ...prev, logo: logoError }));
      setLogo(null);
      return;
    }

    setLogo(file);
    setFieldErrors((prev) => ({ ...prev, logo: "" }));
  };

  const validateStepFields = (stepNum) => {
    const errors = {};
    const taxRateValue = Number(taxRate);

    if (stepNum === 1) {
      if (!trimValue(name)) errors.name = "Business name is required.";
      else if (trimValue(name).length > 50) {
        errors.name = "Business name cannot exceed 50 characters.";
      }

      if (!trimValue(slug)) errors.slug = "Slug is required.";
      else if (!SLUG_REGEX.test(trimValue(slug))) {
        errors.slug =
          "Use lowercase letters, numbers, and single hyphens only.";
      } else if (trimValue(slug).length > 50) {
        errors.slug = "Slug cannot exceed 50 characters.";
      }

      if (!trimValue(email)) errors.email = "Email is required.";
      else if (!EMAIL_REGEX.test(trimValue(email))) {
        errors.email = "Enter a valid email address.";
      } else if (trimValue(email).length > 50) {
        errors.email = "Email cannot exceed 50 characters.";
      }

      if (!trimValue(phone)) errors.phone = "Phone is required.";
      else if (!PHONE_REGEX.test(trimValue(phone))) {
        errors.phone = "Use a valid +1 phone number.";
      }

      if (!isValidWebsite()) {
        errors.website = "Enter a valid website URL.";
      } else if (getNormalizedWebsite().length > 100) {
        errors.website = "Website cannot exceed 100 characters.";
      }

      if (!timezone) errors.timezone = "Timezone is required.";

      if (!trimValue(businessNumber)) {
        errors.businessNumber = "Business number is required.";
      } else if (trimValue(businessNumber).length > 20) {
        errors.businessNumber =
          "Business number cannot exceed 20 characters.";
      }

      if (taxRate === "" || taxRate === null || taxRate === undefined) {
        errors.taxRate = "Tax rate is required.";
      } else if (!Number.isFinite(taxRateValue)) {
        errors.taxRate = "Tax rate must be a valid number.";
      } else if (taxRateValue < 0 || taxRateValue > 99.99) {
        errors.taxRate = "Tax rate must be between 0 and 99.99.";
      }
      if (trimValue(taxLabel).length > 30) {
        errors.taxLabel = "Tax label cannot exceed 30 characters.";
      }
      if (!PAYMENT_TERMS_OPTIONS.some((option) => option.value === defaultPaymentTerms)) {
        errors.defaultPaymentTerms = "Choose default payment terms.";
      }

      if (!trimValue(businessDescription)) {
        errors.businessDescription = "Business description is required.";
      } else if (trimValue(businessDescription).length > 1000) {
        errors.businessDescription =
          "Business description cannot exceed 1000 characters.";
      }
    }

    if (stepNum === 2) {
      if (!country) errors.country = "Country is required.";
      if (!provinceState) {
        errors.provinceState = "Province / state is required.";
      } else if (
        !(provinces[country] || []).some((option) => option.value === provinceState)
      ) {
        errors.provinceState = "Select a valid province / state.";
      }

      if (!trimValue(streetAddress)) {
        errors.streetAddress = "Street address is required.";
      } else if (trimValue(streetAddress).length > 255) {
        errors.streetAddress = "Street address cannot exceed 255 characters.";
      }

      if (!trimValue(city)) errors.city = "City is required.";
      else if (trimValue(city).length > 100) {
        errors.city = "City cannot exceed 100 characters.";
      }

      if (!trimValue(postalCode)) {
        errors.postalCode = "Postal / ZIP code is required.";
      } else if (!isValidPostalCode()) {
        errors.postalCode =
          country === "CA"
            ? "Use a valid Canadian postal code, e.g. T5J 1N3."
            : country === "US"
              ? "Use a valid ZIP code, e.g. 90210."
              : "Postal / ZIP code must be 3 to 10 characters.";
      }
    }

    if (stepNum === 3) {
      if (serviceOptionsError) {
        errors.selectedServices =
          "Service options could not be loaded. Please refresh and try again.";
      } else if (!selectedServices.length) {
        errors.selectedServices = "Select at least one service.";
      }
    }

    if (stepNum === 4) {
      const logoError = validateLogoFile(logo);
      if (logoError) errors.logo = logoError;
    }

    return errors;
  };

  const getFirstErrorMessage = (errors) =>
    Object.values(errors).find(Boolean) ||
    "Please fix the highlighted fields before continuing.";

  const getError = (fieldName) => fieldErrors[fieldName];

  const ErrorText = ({ field }) =>
    getError(field) ? (
      <p className="mt-2 text-xs font-medium text-red-600">{getError(field)}</p>
    ) : null;

  const applyStepErrors = (stepNum, errors) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      (STEP_FIELDS[stepNum] || []).forEach((fieldName) => {
        delete next[fieldName];
      });
      return { ...next, ...errors };
    });
  };

  const isStepComplete = (stepNum) => {
    return Object.keys(validateStepFields(stepNum)).length === 0;
  };

  const isStepVisuallyComplete = (stepNum) => {
    if (stepNum === 4) return !!logo;
    return isStepComplete(stepNum);
  };

  useEffect(() => {
    const completed = [];
    for (let i = 1; i <= totalSteps; i++) {
      if (isStepComplete(i)) completed.push(i);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const validateStep = (stepNum = step) => {
    const errors = validateStepFields(stepNum);
    applyStepErrors(stepNum, errors);

    if (Object.keys(errors).length > 0) {
      setAlert({
        type: "danger",
        message: getFirstErrorMessage(errors),
      });
      return false;
    }

    return true;
  };

  const nextStep = async () => {
    if (businessId) {
      if (!(await saveStep(step, false))) return;
    } else if (!validateStep()) return;
    setStep((current) => Math.min(current + 1, totalSteps));
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const buildFullBusinessData = () => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("slug", slug);
    formData.append("phone", phone);
    formData.append("website", getNormalizedWebsite());
    formData.append("email", email);
    formData.append("business_description", businessDescription);
    formData.append("street_address", streetAddress);
    formData.append("city", city);
    formData.append("country", country);
    formData.append("province_state", provinceState);
    formData.append("postal_code", postalCode);
    formData.append("business_number", businessNumber);
    formData.append("tax_rate", parseFloat(taxRate));
    formData.append("tax_label", taxLabel.trim());
    formData.append("default_payment_terms", defaultPaymentTerms);
    formData.append("timezone", timezone);
    formData.append("services_offered", JSON.stringify(selectedServices));
    if (logo && typeof logo !== "string") formData.append("logo", logo);
    if (businessId && logo === null && businessData?.[0]?.logo) {
      formData.append("logo", "");
    }
    return formData;
  };

  const saveStep = async (stepNum, showSuccess = true) => {
    if (stepNum === totalSteps) {
      const allStepErrors = [1, 2, 3, 4].reduce(
        (errors, currentStep) => ({ ...errors, ...validateStepFields(currentStep) }),
        {},
      );
      if (Object.keys(allStepErrors).length > 0) {
        setFieldErrors(allStepErrors);
        setAlert({ type: "danger", message: getFirstErrorMessage(allStepErrors) });
        setStep(
          [1, 2, 3, 4].find((currentStep) =>
            Object.keys(validateStepFields(currentStep)).length > 0,
          ),
        );
        return false;
      }
    } else if (!validateStep(stepNum)) return false;

    const formData = stepNum === totalSteps
      ? buildFullBusinessData()
      : new FormData();
    if (stepNum === 1) {
      formData.append("name", name);
      formData.append("slug", slug);
      formData.append("phone", phone);
      formData.append("website", getNormalizedWebsite());
      formData.append("email", email);
      formData.append("business_description", businessDescription);
      formData.append("business_number", businessNumber);
      formData.append("tax_rate", parseFloat(taxRate));
      formData.append("tax_label", taxLabel.trim());
      formData.append("default_payment_terms", defaultPaymentTerms);
      formData.append("timezone", timezone);
    } else if (stepNum === 2) {
      formData.append("street_address", streetAddress);
      formData.append("city", city);
      formData.append("country", country);
      formData.append("province_state", provinceState);
      formData.append("postal_code", postalCode);
    } else if (stepNum === 3) {
      formData.append("services_offered", JSON.stringify(selectedServices));
    }

    try {
      await updateBusiness({ id: businessId, data: formData }).unwrap();
      if (showSuccess) {
        setAlert({ type: "success", message: "Business updated successfully!" });
      }
      return true;
    } catch {
      setAlert({
        type: "danger",
        message: "Failed to save business. Please try again.",
      });
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (businessId) {
      await saveStep(step);
      return;
    }

    const allStepErrors = [1, 2, 3, 4].reduce(
      (errors, stepNum) => ({ ...errors, ...validateStepFields(stepNum) }),
      {},
    );

    if (Object.keys(allStepErrors).length > 0) {
      setFieldErrors(allStepErrors);
      setAlert({
        type: "danger",
        message: getFirstErrorMessage(allStepErrors),
      });
      const firstInvalidStep =
        [1, 2, 3, 4].find(
          (stepNum) => Object.keys(validateStepFields(stepNum)).length > 0,
        ) || step;
      setStep(firstInvalidStep);
      return;
    }

    try {
      await createBusiness(buildFullBusinessData()).unwrap();
      setAlert({
        type: "success",
        message: "Business created successfully!",
      });
    } catch {
      setAlert({
        type: "danger",
        message: "Failed to save business. Please try again.",
      });
    }
  };

  const steps = ["Details", "Address", "Services", "Logo"];
  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white p-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";
  // const selectClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-3.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30';
  // const textareaClass =
  //   "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <div>
        <h2 className="text-3xl md:text-4xl font-bold mb-1">
          Welcome, {user?.name || "User"}!
        </h2>
        <p className="text-gray-500 mb-6">
          Manage your business core settings and preferences.
        </p>
      </div>

      <div className="lg:min-h-[75vh] p-4 md:p-10 bg-white rounded-2xl shadow-md">
        <div className="mb-6 flex flex-wrap items-center">
          {steps.map((label, index) => {
            const stepNum = index + 1;
            const isActive = stepNum === step;
            const isCompleted =
              stepNum !== step && isStepVisuallyComplete(stepNum);

            return (
              <div key={label} className="flex items-center gap-3">
                {stepNum <= steps.length && stepNum > 1 && (
                  <div
                    className={`h-0.5 md:w-10 lg:w-20 rounded-full ${isCompleted ? "bg-green-600" : "bg-gray-300"}`}
                  />
                )}
                <button
                  type="button"
                  className={`flex flex-col md:flex-row items-center md:gap-3 cursor-pointer rounded-full pr-3 transition
                                    ${isActive ? "text-black font-bold" : "text-gray-700 font-normal"}`}
                  onClick={() => {
                    if (stepNum < step) {
                      setStep(stepNum);
                    } else if (stepNum > step) {
                      let blockedStep = null;
                      for (let i = step; i < stepNum; i++) {
                        if (!isStepComplete(i)) {
                          blockedStep = i;
                          break;
                        }
                      }

                      if (!blockedStep) {
                        setStep(stepNum);
                      } else {
                        setStep(blockedStep);
                        validateStep(blockedStep);
                      }
                    }
                  }}
                >
                  <span
                    className={`flex h-5 w-5 md:h-7 md:w-7 items-center justify-center
                                    rounded-full text-xs md:text-sm font-bold
                                    ${
                                      isActive
                                        ? "bg-secondary text-white"
                                        : isCompleted
                                          ? "bg-green-600 text-white"
                                          : "bg-transparent border-2 border-gray-300 text-gray-700"
                                    }
                                    `}
                  >
                    {isCompleted ? (
                      <LuCheck className="w-4 h-4 font-black" />
                    ) : (
                      <span className="text-sm">{stepNum}</span>
                    )}
                  </span>
                  <span>{label}</span>
                </button>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={handleSubmit}
          className="lg:min-h-[60vh] flex flex-col justify-start lg:justify-between h-full space-y-5"
        >
          {step === 1 && (
            <div className="md:space-y-4">
              <div className="md:mt-10 mb-6">
                <h2 className="text-2xl md:text-3xl font-bold">
                  Core Business Information
                </h2>
                <p className="text-gray-400">
                  Please provide your original business details to proceed.
                </p>
              </div>
              <div className="grid grid-cols-1 md:gap-4 md:grid-cols-3">
                <div>
                  <Input
                    id="business_name"
                    label={"Business Name"}
                    value={name}
                    isRequired={true}
                    onChange={handleNameChange}
                    fieldClass={inputClass}
                  />
                  <ErrorText field="name" />
                </div>
                <div>
                  <Input
                    id="slug"
                    label={"Slug"}
                    value={slug}
                    isRequired={true}
                    onChange={setFieldValue(setSlug, "slug")}
                    fieldClass={inputClass}
                  />
                  <ErrorText field="slug" />
                </div>
                <div>
                  <Input
                    type="email"
                    id="email"
                    label={"Email"}
                    value={email}
                    isRequired={true}
                    onChange={setFieldValue(setEmail, "email")}
                    fieldClass={inputClass}
                  />
                  <ErrorText field="email" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:gap-4 md:grid-cols-2">
                <div>
                  <Input
                    type="tel"
                    id="phone"
                    label={"Phone"}
                    value={phone}
                    isRequired={true}
                    onChange={setFieldValue(setPhone, "phone")}
                    fieldClass={inputClass}
                  />
                  <ErrorText field="phone" />
                </div>
                <div>
                  <Input
                    type="text"
                    id="website"
                    label={"Business Website"}
                    value={website}
                    isRequired={false}
                    onChange={setFieldValue(setWebsite, "website")}
                    fieldClass={inputClass}
                  />
                  <ErrorText field="website" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:gap-4 md:grid-cols-3">
                <div className="flex flex-col mb-6 md:mb-0">
                  <label
                    htmlFor="timezone"
                    className="mb-1 block text-sm font-semibold text-gray-500 uppercase"
                  >
                    Timezone <span className="text-accent">*</span>
                  </label>
                  <Dropdown
                    id="timezone"
                    value={timezone}
                    placeholder="Select timezone"
                    options={timezones}
                    onChange={setFieldValue(setTimezone, "timezone")}
                    buttonClassName="w-full rounded-xl border-gray-200 bg-white h-[50px]"
                    menuClassName="max-h-72 overflow-auto"
                  />
                  <ErrorText field="timezone" />
                </div>

                <div>
                  <Input
                    type="text"
                    id="business_number"
                    label={"Business Number"}
                    value={businessNumber}
                    isRequired={true}
                    onChange={setFieldValue(
                      setBusinessNumber,
                      "businessNumber",
                    )}
                    fieldClass={inputClass}
                  />
                  <ErrorText field="businessNumber" />
                </div>

                <div>
                  <Input
                    min={0}
                    max={99.99}
                    step={0.01}
                    type="number"
                    id="tax_rate"
                    label="Tax rate (%)"
                    value={taxRate}
                    isRequired={true}
                    onChange={setFieldValue(setTaxRate, "taxRate")}
                    fieldClass={inputClass}
                  />
                  <ErrorText field="taxRate" />
                </div>
                <div>
                  <Input
                    id="tax_label"
                    label="Tax label (optional)"
                    value={taxLabel}
                    onChange={setFieldValue(setTaxLabel, "taxLabel")}
                    fieldClass={inputClass}
                  />
                  <p className="mt-1 text-xs text-slate-500">Shown with the tax rate on quotes. Leave blank to use a regional default.</p>
                  <ErrorText field="taxLabel" />
                </div>
                <div>
                  <label htmlFor="default-payment-terms" className="mb-1 block text-sm font-semibold uppercase text-gray-500">
                    Default Payment Terms
                  </label>
                  <Dropdown
                    id="default-payment-terms"
                    value={defaultPaymentTerms}
                    onChange={setFieldValue(setDefaultPaymentTerms, "defaultPaymentTerms")}
                    options={PAYMENT_TERMS_OPTIONS}
                    buttonClassName="h-11 border-gray-200 bg-white text-slate-700"
                  />
                  <p className="mt-1 text-xs text-slate-500">Used for automatically generated quote drafts. You can change it on each quote before sending.</p>
                  <ErrorText field="defaultPaymentTerms" />
                </div>
              </div>

              <Textarea
                id="business_description"
                label="Business Description"
                value={businessDescription}
                onChange={setFieldValue(
                  setBusinessDescription,
                  "businessDescription",
                )}
                isRequired={true}
                fieldClass="w-full"
                rows={3}
                maxLength={1000}
              />
              <ErrorText field="businessDescription" />
            </div>
          )}

          {step === 2 && (
            <div className="md:space-y-4">
              <div className="md:mt-10 mb-6">
                <h2 className="text-2xl md:text-3xl font-bold">
                  Business Address
                </h2>
                <p className="text-gray-400">
                  Provide the physical location of your business operations.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-5">
                <div className="flex flex-col">
                  <label
                    htmlFor="country"
                    className="mb-1 block text-sm font-semibold text-gray-500 uppercase"
                  >
                    Country <span className="text-accent">*</span>
                  </label>
                  <Dropdown
                    id="country"
                    value={country}
                    placeholder="Select country"
                    options={countries}
                    onChange={(value) => {
                      setCountry(value);
                      setProvinceState("");
                      setFieldErrors((prev) => ({
                        ...prev,
                        country: "",
                        provinceState: "",
                        postalCode: "",
                      }));
                    }}
                    buttonClassName="w-full rounded-xl border-gray-200 bg-white h-[50px]"
                    menuClassName="max-h-72 overflow-auto"
                  />
                  <ErrorText field="country" />
                </div>
                <div className="flex flex-col">
                  <label
                    htmlFor="province"
                    className="mb-1 block text-sm font-semibold text-gray-500 uppercase"
                  >
                    Province / State <span className="text-accent">*</span>
                  </label>
                  <Dropdown
                    id="province"
                    value={provinceState}
                    placeholder="Select province / state"
                    options={provinces[country] || []}
                    onChange={setFieldValue(setProvinceState, "provinceState")}
                    buttonClassName="w-full rounded-xl border-gray-200 bg-white h-[50px]"
                    menuClassName="max-h-72 overflow-auto"
                  />
                  <ErrorText field="provinceState" />
                </div>
              </div>

              <Input
                id="street_address"
                label={"Street Address"}
                value={streetAddress}
                isRequired={true}
                onChange={setFieldValue(setStreetAddress, "streetAddress")}
                fieldClass={inputClass}
              />
              <ErrorText field="streetAddress" />

              <div className="grid grid-cols-1 md:gap-4 md:grid-cols-2">
                <div>
                  <Input
                    id="city"
                    label={"City"}
                    value={city}
                    isRequired={true}
                    onChange={setFieldValue(setCity, "city")}
                    fieldClass={inputClass}
                  />
                  <ErrorText field="city" />
                </div>

                <div>
                  <Input
                    id="postal_code"
                    label={"Postal / ZIP Code"}
                    value={postalCode}
                    isRequired={true}
                    onChange={setFieldValue(setPostalCode, "postalCode")}
                    fieldClass={inputClass}
                  />
                  <ErrorText field="postalCode" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="md:mt-10 mb-6">
                <h2 className="text-2xl md:text-3xl font-bold">
                  Your Services
                </h2>
                <p className="text-gray-400">
                  Select the categories that best describe your business
                  capabilities.
                </p>
              </div>
              <h3 className="text-xl leading-tighter font-semibold">
                Select all services you offer.
              </h3>
              <p className="text-gray-400 -mt-4">
                This helps us customize your dashboard and client workflows.
              </p>
              {loadingServiceOptions ? (
                <div className="py-10 text-center text-sm text-gray-500">
                  Loading service options...
                </div>
              ) : serviceOptionsError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  Service options could not be loaded. Please try again.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 md:gap-5 md:grid-cols-3 lg:grid-cols-4">
                  {services.map((service) => {
                    const isSelected = selectedServices.includes(service);
                    return (
                      <button
                        key={service}
                        type="button"
                        className={`relative rounded-xl border-2 px-3 py-6 md:py-10 text-sm font-medium transition ${
                          isSelected
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-gray-200 bg-white text-gray-700 hover:border-accent/60 hover:text-accent"
                        }`}
                        onClick={() => toggleService(service)}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
                            <LuCheck className="w-3 h-3" />
                          </span>
                        )}
                        {service}
                      </button>
                    );
                  })}
                </div>
              )}
              <ErrorText field="selectedServices" />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="md:mt-10 mb-6">
                <h2 className="text-2xl md:text-3xl font-bold">
                  Final Step: Brand Identity
                </h2>
                <p className="text-gray-400">
                  Upload your official logo to complete the setup process.
                </p>
              </div>
              <h3 className="text-xl leading-tighter font-semibold">
                Upload your business logo
              </h3>
              <p className="text-gray-400 -mt-4">
                This will be used for invoices, quotes, and your public profile.
              </p>
              <div
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLogo((prev) => prev);
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(false);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(true);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleLogoSelection(e.dataTransfer.files[0]);
                  }
                }}
                className={`flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed ${getError("logo") ? "border-red-300" : logo ? "border-green-400" : "border-gray-300"} bg-gray-50 transition-all duration-200 relative`}
                style={{ cursor: "pointer", position: "relative" }}
              >
                {!logo ? (
                  <>
                    <div className="bg-white p-6 mb-8 shadow rounded-2xl">
                      <LuImage className="text-6xl text-gray-300" />
                    </div>
                    <div className="font-semibold text-lg mb-2">
                      Click to upload or drag & drop
                    </div>
                    <div className="text-gray-400 mb-8">
                      Supported formats: PNG, JPG, SVG (Max 5MB)
                    </div>
                    <label className="inline-block px-6 py-4 bg-white border border-gray-300 rounded-xl cursor-pointer font-medium">
                      Choose File
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/svg+xml"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleLogoSelection(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </>
                ) : (
                  <div className="flex flex-col items-center py-10">
                    {typeof logo === "string" ? (
                      <img
                        src={logo}
                        alt="Business Logo"
                        className="max-h-36 rounded object-contain mb-4"
                      />
                    ) : logo.type && logo.type.startsWith("image/") ? (
                      <img
                        src={URL.createObjectURL(logo)}
                        alt="Business Logo"
                        className="max-h-36 rounded object-contain mb-4"
                      />
                    ) : null}
                    <button
                      type="button"
                      className="px-4 py-1 bg-red-500 text-white rounded-lg text-sm font-medium"
                      onClick={() => {
                        setLogo(null);
                        setFieldErrors((prev) => ({ ...prev, logo: "" }));
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <ErrorText field="logo" />
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button type="button" className="secondary" onClick={prevStep}>
                  <FaChevronLeft className="inline mb-0.5 mr-2" />
                  Back
                </button>
              )}
              {step < totalSteps && (
                <button
                  type="button"
                  className="primary"
                  onClick={nextStep}
                  disabled={isCreating || isUpdating}
                >
                  Next
                  <FaChevronRight className="inline mb-0.5 ml-2" />
                </button>
              )}
            </div>
            {(businessId || step === totalSteps) && (
              <SubmitButton
                isLoading={isCreating || isUpdating}
                btnClass="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 font-semibold text-white shadow hover:bg-accent/90 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
                btnName="Save Changes"
              />
            )}
          </div>
        </form>
      </div>

      {/* Form Footer */}
      {step === 1 && (
        <div className="mt-6 p-3 flex flex-col-reverse md:flex-row items-left md:items-center justify-between gap-4 md:gap-0 text-sm text-gray-400">
          <p>
            &copy; {new Date().getFullYear()}{" "}
            {businessData[0]?.name || "Business Name"}. All rights reserved.
          </p>
          <div className="space-x-5 font-bold">
            <NavLink to="/privacy-policy" className="hover:text-accent">
              Privacy Policy
            </NavLink>
            <NavLink to="/terms-of-service" className="hover:text-accent">
              Terms of Service
            </NavLink>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="mt-6 p-3 flex items-center justify-center text-sm">
          <div className="w-2 h-2 bg-green-600 rounded-full" />
          <p className="text-gray-400 ml-2">
            Your information is securely encrypted and stored
          </p>
        </div>
      )}
      {step === 3 && (
        <div className="mt-6 p-3 flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-600 rounded-full" />
            <p className="ml-2">Details & Address verified.</p>
          </div>
          <p>Step 3 of 4</p>
        </div>
      )}
      {step === 4 && (
        <div className="mt-6 p-3 flex items-center justify-center text-sm">
          <div className="flex items-center -space-x-1.5">
            <div className="flex items-center justify-center w-6 h-6 border-2 border-background bg-green-600 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            </div>
            <div className="flex items-center justify-center w-6 h-6 border-2 border-background bg-green-600 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            </div>
            <div className="flex items-center justify-center w-6 h-6 border-2 border-background bg-green-600 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            </div>
          </div>
          <p className="text-gray-400 font-semibold md:text-lg ml-2">
            3 OF 4 STEPS COMPLETED
          </p>
        </div>
      )}
    </>
  );
}
