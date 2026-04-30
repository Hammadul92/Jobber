import { useState } from "react";
import { LuPlus } from "react-icons/lu";
import { CgClose } from "react-icons/cg";
import { LuBadgeInfo, LuMail, LuPhone, LuUser } from "react-icons/lu";
import {
  useCreateUserMutation,
  useCreateClientMutation,
  useCheckUserExistsMutation,
} from "../../../store";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";

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

  const [alert, setAlert] = useState({ type: "", message: "" });

  const [createUser, { isLoading: creatingUser }] = useCreateUserMutation();
  const [createClient, { isLoading: creatingClient }] =
    useCreateClientMutation();
  const [checkUserExists, { isLoading: checkingUser }] =
    useCheckUserExistsMutation();

  const isSubmitting = creatingUser || creatingClient || checkingUser;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: "", message: "" });

    if (!name || !email || !phone) {
      setAlert({ type: "danger", message: "Please fill all required fields." });
      return;
    }

    try {
      const checkResponse = await checkUserExists({ email }).unwrap();
      let userId = checkResponse?.id;

      if (!userId) {
        const password = generateStrongPassword();
        const userPayload = { name, email, phone, password, role: "CLIENT" };
        const newUser = await createUser(userPayload).unwrap();
        userId = newUser.id;
      }

      await createClient({ user: userId }).unwrap();

      const success = {
        type: "success",
        message: "Client added successfully.",
      };
      setAlert(success);
      if (setParentAlert) setParentAlert(success);
      setName("");
      setPhone("");
      setEmail("");
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
    }
  };

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            onClick={() => setShowModal(false)}
            aria-label="Close add client drawer"
          />

          <div className="absolute right-0 top-0 z-10 flex h-screen w-full flex-col overflow-hidden border-l border-gray-200 bg-white shadow-2xl md:w-4/6 lg:w-2/6">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h5 className="text-4xl font-semibold text-slate-800">Add Client Account</h5>
                  <p className="mt-1 text-sm text-slate-500">
                    Secure login credentials are generated automatically and emailed to
                    the client.
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

            <form onSubmit={handleSubmit} className="flex h-full flex-col">
              <div className="flex-1 overflow-y-auto px-6 py-5">
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
                    <div>
                      <label
                        htmlFor="client-full-name"
                        className="mb-1 block text-sm font-medium text-slate-700"
                      >
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <LuUser className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          id="client-full-name"
                          type="text"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          placeholder="Enter full name"
                          className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-accent focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="client-email"
                        className="mb-1 block text-sm font-medium text-slate-700"
                      >
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <LuMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          id="client-email"
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="member@formexa.com"
                          className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-accent focus:outline-none"
                          required
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        Invitation will be sent to this email
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="client-phone"
                        className="mb-1 block text-sm font-medium text-slate-700"
                      >
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <LuPhone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          id="client-phone"
                          type="tel"
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-accent focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-gray-100"
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accentLight disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmitting}
                  >
                    <LuPlus className="h-3.5 w-3.5" />
                    {isSubmitting ? "Adding..." : "Add Client"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
