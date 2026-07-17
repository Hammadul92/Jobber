import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { LuArrowLeft, LuMail, LuPhone, LuUserRound } from "react-icons/lu";
import {
  useFetchClientQuery,
  useUpdateClientMutation,
} from "../../../store";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import Input from "../../../Components/ui/Input";
import LoadingScreen from "../../../Components/ui/LoadingScreen";
import PhoneInputField from "../../../Components/ui/PhoneInput";
import SubmitButton from "../../../Components/ui/SubmitButton";
import { resetTopbar, setTopbar } from "../../../store/topbarSlice";

function formatStatus(isActive) {
  return isActive === true || isActive === "True" ? "Active" : "Inactive";
}

export default function Client({ token }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
    setIsActive(client.is_active === true || client.is_active === "True");
  }, [client]);

  useEffect(() => {
    if (!error) return;

    setAlert({
      type: "danger",
      message: error?.data?.detail || "Failed to load client details.",
    });
  }, [error]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setAlert({ type: "", message: "" });

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
              .map(([key, value]) =>
                `${key}: ${Array.isArray(value) ? value.join(", ") : value}`,
              )
              .join(" | ")
          : err?.message) ||
        "Failed to update client.";

      setAlert({ type: "danger", message });
    }
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      {alert.message && (
        <AlertDispatcher
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: "", message: "" })}
        />
      )}

      <div className="mb-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 border-b border-gray-100 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 to-purple-500 text-xl font-semibold text-white shadow">
              {(name || "CL").slice(0, 2).toUpperCase()}
              <span
                className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
                  isActive ? "bg-emerald-500" : "bg-slate-400"
                }`}
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Client Profile
              </p>
              <h3 className="text-2xl font-semibold text-primary">
                {name || "Client"}
              </h3>
              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  isActive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {formatStatus(isActive)}
              </span>
            </div>
          </div>

          <Link
            to="/user/business/clients"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-gray-50"
          >
            <LuArrowLeft className="h-4 w-4" />
            Back to Clients
          </Link>
        </div>

        <div className="grid gap-3 px-5 py-4 text-sm text-slate-600 md:grid-cols-3 md:px-6">
          <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3">
            <LuUserRound className="h-5 w-5 text-slate-400" />
            <span className="truncate">{name || "No name"}</span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3">
            <LuMail className="h-5 w-5 text-slate-400" />
            <span className="truncate">{email || "No email"}</span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3">
            <LuPhone className="h-5 w-5 text-slate-400" />
            <span className="truncate">{phone || "No phone"}</span>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6"
      >
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-primary">
            Client Information
          </h4>
          <p className="mt-1 text-sm text-slate-500">
            Keep the client&apos;s contact information accurate for quotes,
            invoices, and service updates.
          </p>
        </div>

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
