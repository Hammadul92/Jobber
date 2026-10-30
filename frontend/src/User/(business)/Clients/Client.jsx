import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useFetchClientQuery, useUpdateClientMutation } from "../../../store";
import Input from "../../../Components/ui/Input";
import LoadingScreen from "../../../Components/ui/LoadingScreen";
import PhoneInputField from "../../../Components/ui/PhoneInput";
import Dropdown from "../../../Components/ui/Dropdown";
import { countries, provinces } from "../../../constants/locations";
import SubmitButton from "../../../Components/ui/SubmitButton";
import { resetTopbar, setTopbar } from "../../../store/topbarSlice";
import useAlert from "../../../hooks/useAlert";

export default function Client({ token }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const setAlert = useAlert();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [billingStreet, setBillingStreet] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingCountry, setBillingCountry] = useState("CA");
  const [billingProvince, setBillingProvince] = useState("");
  const [billingPostalCode, setBillingPostalCode] = useState("");
  const [isActive, setIsActive] = useState(true);

  const {
    data: client,
    isLoading,
    error,
  } = useFetchClientQuery(id, { skip: !token || !id });
  const [updateClient, { isLoading: updating }] = useUpdateClientMutation();

  useEffect(() => {
    dispatch(
      setTopbar({
        title: name ? `Edit ${name}` : "Edit Client",
        description: "Update client contact details and account status.",
        action: null,
      }),
    );

    return () => {
      dispatch(resetTopbar());
    };
  }, [dispatch, name]);

  useEffect(() => {
    if (!client) return;

    setName(client.client_name || "");
    setEmail(client.client_email || "");
    setPhone(client.client_phone || "");
    setCompanyName(client.company_name || "");
    setBillingStreet(client.billing_street_address || "");
    setBillingCity(client.billing_city || "");
    setBillingCountry(client.billing_country || "CA");
    setBillingProvince(client.billing_province_state || "");
    setBillingPostalCode(client.billing_postal_code || "");
    setIsActive(client.is_active === true || client.is_active === "True");
  }, [client]);

  useEffect(() => {
    if (!error) return;

    setAlert({
      type: "danger",
      message: error?.data?.detail || "Failed to load client details.",
    });
  }, [error, setAlert]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setAlert({
        type: "danger",
        message: "Please fill all required client fields.",
      });
      return;
    }

    try {
      await updateClient({
        id,
        client_name: name.trim(),
        client_email: email.trim(),
        client_phone: phone.trim(),
        company_name: companyName.trim(),
        billing_street_address: billingStreet.trim(),
        billing_city: billingCity.trim(),
        billing_country: billingCountry,
        billing_province_state: billingProvince,
        billing_postal_code: billingPostalCode.trim(),
        is_active: isActive,
      }).unwrap();

      setAlert({
        type: "success",
        message: "Client updated successfully.",
      });
      navigate("/user/business/clients");
    } catch (err) {
      const message =
        err?.data?.detail ||
        (err?.data && typeof err.data === "object"
          ? Object.entries(err.data)
              .map(([key, value]) => {
                const text = Array.isArray(value) ? value.join(", ") : value;
                return key === "non_field_errors" ? text : `${key}: ${text}`;
              })
              .join(" | ")
          : err?.message) ||
        "Failed to update client.";

      setAlert({ type: "danger", message });
    }
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6"
      >
        <header className="mb-6 flex items-start gap-3 border-b border-gray-100 pb-5">
          <div className="min-w-0">
            <h4 className="text-xl font-semibold text-primary md:text-2xl">
              Client Information
            </h4>
            <p className="mt-1 text-base text-slate-500">
              Keep the client&apos;s contact information accurate for quotes,
              invoices, and service updates.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Input
            id="edit-client-name"
            type="text"
            label="Full Name"
            value={name}
            onChange={setName}
            isRequired
            fieldClass="h-12"
          />
          <Input
            id="edit-client-email"
            type="email"
            label="Email Address"
            value={email}
            onChange={setEmail}
            isRequired
            fieldClass="h-12"
          />
          <PhoneInputField value={phone} setValue={setPhone} optional={false} />
          <Input
            id="edit-client-company"
            type="text"
            label="Company Name (optional)"
            value={companyName}
            onChange={setCompanyName}
            fieldClass="h-12"
          />

          <div className="mb-6">
            <p className="mb-1 block text-sm font-semibold uppercase text-gray-500">
              Status <span className="text-accent">*</span>
            </p>
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-gray-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setIsActive(true)}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setIsActive(false)}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  !isActive
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-6">
          <h4 className="text-lg font-semibold text-primary">
            Billing Address
          </h4>
          <p className="mt-1 text-sm text-slate-500">
            Shown on quotes and invoices for this client.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Input
              id="edit-client-billing-street"
              type="text"
              label="Street Address"
              value={billingStreet}
              onChange={setBillingStreet}
              fieldClass="h-12"
            />
            <Input
              id="edit-client-billing-city"
              type="text"
              label="City"
              value={billingCity}
              onChange={setBillingCity}
              fieldClass="h-12"
            />
            <div>
              <label
                htmlFor="edit-client-billing-country"
                className="mb-1 block text-sm font-semibold uppercase text-gray-500"
              >
                Country
              </label>
              <Dropdown
                id="edit-client-billing-country"
                value={billingCountry}
                onChange={(value) => {
                  setBillingCountry(value);
                  setBillingProvince("");
                }}
                options={countries}
              />
            </div>
            <div>
              <label
                htmlFor="edit-client-billing-province"
                className="mb-1 block text-sm font-semibold uppercase text-gray-500"
              >
                Province/State
              </label>
              <Dropdown
                id="edit-client-billing-province"
                value={billingProvince}
                onChange={setBillingProvince}
                options={provinces[billingCountry] || []}
                disabled={!billingCountry}
              />
            </div>
            <Input
              id="edit-client-billing-postal"
              type="text"
              label="Postal/Zip Code"
              value={billingPostalCode}
              onChange={setBillingPostalCode}
              fieldClass="h-12"
            />
          </div>
        </div>

        <div className="mt-2 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate("/user/business/clients")}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-gray-50"
            disabled={updating}
          >
            Cancel
          </button>
          <SubmitButton
            isLoading={updating}
            btnName="Save Changes"
            btnClass="bg-accent px-5 py-2.5 text-sm text-white shadow hover:bg-accentLight"
          />
        </div>
      </form>
    </>
  );
}
