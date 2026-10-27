import { useState } from "react";
import { CgClose } from "react-icons/cg";
import { LuBadgeInfo } from "react-icons/lu";
import {
  useCreateUserMutation,
  useCreateClientMutation,
  useCheckUserExistsMutation,
} from "../../../store";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import Input from "../../../Components/ui/Input";
import SubmitButton from "../../../Components/ui/SubmitButton";
import PhoneInputField from "../../../Components/ui/PhoneInput";
import Dropdown from "../../../Components/ui/Dropdown";
import { countries, provinces } from "../../../constants/locations";
import ConfirmCustomerNotification from "../../../Components/ui/ConfirmCustomerNotification";

function generateStrongPassword(length = 12) {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=<>?";
  let password = "";
  const array = new Uint32Array(length);
  window.crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  return password;
}

export default function CreateClientForm({
  showModal,
  setShowModal,
  setAlert: setParentAlert,
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [billingStreet, setBillingStreet] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingCountry, setBillingCountry] = useState("CA");
  const [billingProvince, setBillingProvince] = useState("");
  const [billingPostalCode, setBillingPostalCode] = useState("");

  const [alert, setAlert] = useState({ type: "", message: "" });
  const [confirmInvitation, setConfirmInvitation] = useState(false);

  const [createUser, { isLoading: creatingUser }] = useCreateUserMutation();
  const [createClient, { isLoading: creatingClient }] =
    useCreateClientMutation();
  const [checkUserExists, { isLoading: checkingUser }] =
    useCheckUserExistsMutation();

  const isSubmitting = creatingUser || creatingClient || checkingUser;

  const createClientAccount = async (userId) => {
    try {
      if (!userId) {
        const password = generateStrongPassword();
        const userPayload = { name, email, phone, password, role: "CLIENT" };
        const newUser = await createUser(userPayload).unwrap();
        userId = newUser.id;
      }

      await createClient({
        user: userId,
        company_name: companyName.trim(),
        billing_street_address: billingStreet.trim(),
        billing_city: billingCity.trim(),
        billing_country: billingCountry,
        billing_province_state: billingProvince,
        billing_postal_code: billingPostalCode.trim(),
      }).unwrap();

      const success = {
        type: "success",
        message: "Client added successfully.",
      };
      setAlert(success);
      if (setParentAlert) setParentAlert(success);
      setName("");
      setPhone("");
      setEmail("");
      setCompanyName("");
      setBillingStreet("");
      setBillingCity("");
      setBillingCountry("CA");
      setBillingProvince("");
      setBillingPostalCode("");
      setShowModal(false);
    } catch (err) {
      const message =
        err?.data?.detail ||
        (err?.data && typeof err.data === "object"
          ? Object.entries(err.data)
              .map(
                ([key, value]) =>
                  `${key}: ${Array.isArray(value) ? value.join(", ") : value}`,
              )
              .join(" | ")
          : err?.message) ||
        "Failed to create client. Please try again.";
      const danger = { type: "danger", message };
      setAlert(danger);
      if (setParentAlert) setParentAlert(danger);
      console.error("Create client error:", err);
    } finally {
      setConfirmInvitation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: "", message: "" });

    if (!name || !email || !phone || !billingStreet || !billingCity || !billingCountry || !billingProvince || !billingPostalCode) {
      setAlert({ type: "danger", message: "Please fill all required fields." });
      return;
    }

    try {
      const checkResponse = await checkUserExists({ email }).unwrap();
      if (checkResponse?.id) {
        await createClientAccount(checkResponse.id);
      } else {
        setConfirmInvitation(true);
      }
    } catch (err) {
      setAlert({ type: "danger", message: err?.data?.detail || "Could not check the client email. Please try again." });
    }
  };

  return (
    <>
      <ConfirmCustomerNotification
        open={confirmInvitation}
        detail={`Creating this client will send an invitation to ${email}.`}
        onYes={() => { if (!isSubmitting) createClientAccount(null); }}
        onNo={() => setConfirmInvitation(false)}
        isLoading={isSubmitting}
      />
      {showModal && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            onClick={() => setShowModal(false)}
            aria-label="Close add client drawer"
          />

          <div className="absolute right-0 top-0 z-10 flex h-screen min-h-0 w-full flex-col overflow-hidden border-l border-gray-200 bg-white shadow-2xl md:w-4/6 lg:w-2/6">
            <div className="shrink-0 border-b border-gray-100 px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h5 className="text-4xl font-semibold text-slate-800">
                    Add Client Account
                  </h5>
                  <p className="mt-1 text-sm text-slate-500">
                    Secure login credentials are generated automatically and
                    emailed to the client.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                >
                  <CgClose className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                <LuBadgeInfo className="mt-0.5 h-4 w-4" />
                <p>
                  We securely generate login credentials and send the client an
                  invitation email. They can reset their password anytime.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
                {alert.message && (
                  <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: "", message: "" })}
                  />
                )}

                <section>
                  <h6 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-700">
                    Personal Information
                  </h6>

                  <div className="mt-4 space-y-4">
                    <Input
                      id="client-full-name"
                      type="text"
                      label="Full Name"
                      value={name}
                      onChange={setName}
                      isRequired
                      fieldClass="h-11 text-sm"
                    />

                    <div>
                      <Input
                        id="client-email"
                        type="email"
                        label="Email Address"
                        value={email}
                        onChange={setEmail}
                        isRequired
                        fieldClass="h-11 text-sm"
                      />
                      <p className="-mt-4 text-xs text-slate-400">
                        Invitation will be sent to this email
                      </p>
                    </div>

                    <PhoneInputField
                      value={phone}
                      setValue={setPhone}
                      optional={false}
                      // fieldClass="h-11 text-sm"
                    />
                    <Input id="client-company-name" type="text" label="Company Name (optional)"
                      value={companyName} onChange={setCompanyName} fieldClass="h-11 text-sm" />
                  </div>
                </section>

                <section className="mt-8 border-t border-gray-200 pt-6">
                  <h6 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-700">Billing Address</h6>
                  <div className="mt-4 space-y-4">
                    <Input id="client-billing-street" type="text" label="Street Address"
                      value={billingStreet} onChange={setBillingStreet} isRequired fieldClass="h-11 text-sm" />
                    <Input id="client-billing-city" type="text" label="City"
                      value={billingCity} onChange={setBillingCity} isRequired fieldClass="h-11 text-sm" />
                    <div>
                      <label className="mb-1 block text-sm font-semibold uppercase text-gray-500" htmlFor="client-billing-country">Country *</label>
                      <Dropdown id="client-billing-country" value={billingCountry} onChange={(value) => { setBillingCountry(value); setBillingProvince(""); }} options={countries} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold uppercase text-gray-500" htmlFor="client-billing-province">Province/State *</label>
                      <Dropdown id="client-billing-province" value={billingProvince} onChange={setBillingProvince} options={provinces[billingCountry] || []} disabled={!billingCountry} />
                    </div>
                    <Input id="client-billing-postal" type="text" label="Postal/Zip Code"
                      value={billingPostalCode} onChange={setBillingPostalCode} isRequired fieldClass="h-11 text-sm" />
                  </div>
                </section>
              </div>

              <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-gray-100"
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <SubmitButton
                    isLoading={isSubmitting}
                    btnName="Add Client"
                    btnClass="bg-accent px-4 py-2 text-sm text-white shadow hover:bg-accentLight"
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
