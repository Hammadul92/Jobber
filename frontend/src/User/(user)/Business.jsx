import { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { LuCheck, LuImage } from "react-icons/lu";
import { provinces, countries } from "../../constants/locations";
import {
  useFetchBusinessesQuery,
  useCreateBusinessMutation,
  useUpdateBusinessMutation,
} from "../../store";
import SubmitButton from "../../Components/ui/SubmitButton";
import Input from "../../Components/ui/Input";
import Select from "../../Components/ui/Select";
import Textarea from "../../Components/ui/Textarea";
import { useFetchUserQuery } from "../../store";
import { NavLink } from "react-router-dom";

export default function Business({ token, setAlert }) {
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
  const [timezone, setTimezone] = useState("America/Edmonton");
  const [selectedServices, setSelectedServices] = useState([]);
  const [logo, setLogo] = useState(null);
  const [_dragActive, setDragActive] = useState(false);

  const { data: user } = useFetchUserQuery(undefined, { skip: !token });
  const {
    data: businessData,
    isLoading,
    refetch,
  } = useFetchBusinessesQuery(undefined, { skip: !token });
  const [createBusiness, { isLoading: isCreating }] =
    useCreateBusinessMutation();
  const [updateBusiness, { isLoading: isUpdating }] =
    useUpdateBusinessMutation();

  const generateSlug = (text) => text.toLowerCase().trim().replace(/\s+/g, "-");

  useEffect(() => {
    setSlug(generateSlug(name));
  }, [name]);

  useEffect(() => {
    if (businessData?.length > 0) {
      const b = businessData[0];
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
      setTimezone(b.timezone || "America/Edmonton");
      setSelectedServices(b.services_offered || []);
      setLogo(b.logo || null);
    }
  }, [businessData]);

  const services = [
    "Construction",
    "Cleaning",
    "Landscaping",
    "Plumbing",
    "Electrical",
    "Snow Removal",
    "HVAC",
    "Roofing",
    "Siding",
    "Handyman Services",
    "Flooring",
    "Windows & Doors",
    "Appliance Repair",
    "Moving Services",
    "Carpet Cleaning",
    "Pest Control",
  ];

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
  };

  const isStepComplete = (stepNum) => {
    switch (stepNum) {
      case 1:
        return (
          name &&
          slug &&
          email &&
          phone &&
          businessDescription &&
          businessNumber &&
          taxRate &&
          timezone
        );
      case 2:
        return streetAddress && city && country && provinceState && postalCode;
      case 3:
        return selectedServices.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
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

  const validateStep = () => isStepComplete(step);

  const nextStep = () => {
    if (validateStep()) {
      const next = Math.min(step + 1, totalSteps);
      setStep(next);
    } else {
      setAlert({
        type: "danger",
        message: "Please fill all required fields before continuing.",
      });
    }
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    try {
      // Normalize website to include scheme because Django URLField rejects bare domains
      let normalizedWebsite = website.trim();
      if (normalizedWebsite && !/^https?:\/\//i.test(normalizedWebsite)) {
        normalizedWebsite = `https://${normalizedWebsite}`;
      }

      const formData = new FormData();
      formData.append("name", name);
      formData.append("slug", slug);
      formData.append("phone", phone);
      if (normalizedWebsite) {
        formData.append("website", normalizedWebsite);
      }
      formData.append("email", email);
      formData.append("business_description", businessDescription);
      formData.append("street_address", streetAddress);
      formData.append("city", city);
      formData.append("country", country);
      formData.append("province_state", provinceState);
      formData.append("postal_code", postalCode);
      formData.append("business_number", businessNumber);
      formData.append("tax_rate", parseInt(taxRate));
      formData.append("timezone", timezone);
      formData.append("services_offered", JSON.stringify(selectedServices));
      if (logo && typeof logo !== "string") formData.append("logo", logo);

      if (businessId) {
        await updateBusiness({ id: businessId, data: formData }).unwrap();
        setAlert({
          type: "success",
          message: "Business updated successfully!",
        });
      } else {
        await createBusiness(formData).unwrap();
        setAlert({
          type: "success",
          message: "Business created successfully!",
        });
      }
      refetch();
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
  const textareaClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

  if (isLoading) return <div>Loading business data...</div>;

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
                      let canProceed = true;
                      for (let i = step; i < stepNum; i++) {
                        if (!isStepComplete(i)) {
                          canProceed = false;
                          break;
                        }
                      }

                      if (canProceed) {
                        setStep(stepNum);
                      } else {
                        setAlert({
                          type: "danger",
                          message:
                            "Please fill all required fields before continuing.",
                        });
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
                <Input
                  id="business_name"
                  label={"Business Name"}
                  value={name}
                  isRequired={true}
                  onChange={setName}
                  fieldClass={inputClass}
                />
                <Input
                  id="slug"
                  label={"Slug"}
                  value={slug}
                  isRequired={true}
                  onChange={setSlug}
                  fieldClass={inputClass}
                />
                <Input
                  type="email"
                  id="email"
                  label={"Email"}
                  value={email}
                  isRequired={true}
                  onChange={setEmail}
                  fieldClass={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 md:gap-4 md:grid-cols-2">
                <Input
                  type="tel"
                  id="phone"
                  label={"Phone"}
                  value={phone}
                  isRequired={true}
                  onChange={setPhone}
                  fieldClass={inputClass}
                />
                <Input
                  type="url"
                  id="website"
                  label={"Business Website"}
                  value={website}
                  isRequired={false}
                  onChange={setWebsite}
                  fieldClass={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 md:gap-4 md:grid-cols-3">
                <div className="flex flex-col mb-6 md:mb-0">
                  <Select
                    id="timezone"
                    label="Timezone"
                    value={timezone}
                    isRequired={true}
                    options={timezones.map((opt) => ({
                      value: opt.value,
                      label: opt.label,
                    }))}
                    onChange={setTimezone}
                    fieldClass="w-full"
                  />
                </div>

                <Input
                  type="number"
                  id="business_number"
                  label={"Business Number"}
                  value={businessNumber}
                  isRequired={true}
                  onChange={setBusinessNumber}
                  fieldClass={inputClass}
                />

                <Input
                  min={1}
                  max={100}
                  step={0.01}
                  type="number"
                  id="tax_rate"
                  label={"Tax Rate"}
                  value={taxRate}
                  isRequired={true}
                  onChange={setTaxRate}
                  fieldClass={inputClass}
                />
              </div>

              <Textarea
                id="business_description"
                label="Business Description"
                value={businessDescription}
                onChange={setBusinessDescription}
                isRequired={true}
                fieldClass="w-full"
                rows={3}
              />
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
                  <Select
                    id="country"
                    label="Country"
                    value={country}
                    isRequired={true}
                    options={countries.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                    onChange={setCountry}
                    fieldClass="w-full"
                  />
                </div>
                <div className="flex flex-col">
                  <Select
                    id="province"
                    label="Province / State"
                    value={provinceState}
                    isRequired={true}
                    options={(provinces[country] || []).map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                    onChange={setProvinceState}
                    fieldClass="w-full"
                  />
                </div>
              </div>

              <Input
                id="street_address"
                label={"Street Address"}
                value={streetAddress}
                isRequired={true}
                onChange={setStreetAddress}
                fieldClass={inputClass}
              />

              <div className="grid grid-cols-1 md:gap-4 md:grid-cols-2">
                <Input
                  id="city"
                  label={"City"}
                  value={city}
                  isRequired={true}
                  onChange={setCity}
                  fieldClass={inputClass}
                />

                <Input
                  id="postal_code"
                  label={"Postal / ZIP Code"}
                  value={postalCode}
                  isRequired={true}
                  onChange={setPostalCode}
                  fieldClass={inputClass}
                />
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
                    setLogo(e.dataTransfer.files[0]);
                  }
                }}
                className={`flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed ${logo ? "border-green-400" : "border-gray-300"} bg-gray-50 transition-all duration-200 relative`}
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
                            setLogo(e.target.files[0]);
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
                      onClick={() => setLogo(null)}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-3 pt-2">
                        {step > 1 && (
                            <button
                                type="button"
                                className="secondary"
                                onClick={prevStep}
                            >
                                <FaChevronLeft className='inline mb-0.5 mr-2' />
                                Back
                            </button>
                        )}
                        {step < totalSteps ? (
                            <button
                                type="button"
                                className="primary"
                                onClick={nextStep}
                            >
                                Next
                                <FaChevronRight className='inline mb-0.5 ml-2' />
                            </button>
                        ) : (
                            <SubmitButton
                                isLoading={isCreating || isUpdating}
                                btnClass="ml-auto inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 font-semibold text-white shadow hover:bg-accent/90 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
                                btnName="Save Changes"
                                isDisabled={!validateStep()}
                            />
                        )}
                    </div>
                </form>
            </div>
          <div className="flex items-center justify-between gap-3 pt-2">
            {step > 1 && (
              <button type="button" className="secondary" onClick={prevStep}>
                <FaChevronLeft className="inline mb-0.5 mr-2" />
                Back
              </button>
            )}
            {step < totalSteps ? (
              <button type="button" className="primary" onClick={nextStep}>
                Next
                <FaChevronRight className="inline mb-0.5 ml-2" />
              </button>
            ) : (
              <SubmitButton
                isLoading={isCreating || isUpdating}
                btnClass="ml-auto inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 font-semibold text-white shadow hover:bg-accent/90 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
                btnName="Save Changes"
                isDisabled={!validateStep()}
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
