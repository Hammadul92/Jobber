import { useEffect, useState } from "react";
import { FaPen, FaTrashAlt } from "react-icons/fa";
import { LuInfo, LuMail, LuSend } from "react-icons/lu";
import { useUpdateBusinessMutation } from "../../store";
import Input from "../../Components/ui/Input";
import SubmitButton from "../../Components/ui/SubmitButton";
import ConfirmDialog from "../../Components/ui/ConfirmDialog";
import useAlert from "../../hooks/useAlert";
import { apiErrorMessage } from "../../utils/apiError";

// Business banking card for the email clients send Interac e-Transfers to.
// Invoices sent "with e-Transfer details" show this address to the client.
export default function ETransferSettings({ business }) {
  const setAlert = useAlert();
  const savedEmail = business?.etransfer_email || "";
  const [email, setEmail] = useState(savedEmail);
  const [editing, setEditing] = useState(!savedEmail);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [updateBusiness, { isLoading }] = useUpdateBusinessMutation();

  useEffect(() => {
    setEmail(savedEmail);
    setEditing(!savedEmail);
  }, [savedEmail]);

  const save = async (value) => {
    try {
      await updateBusiness({ id: business.id, data: { etransfer_email: value } }).unwrap();
      setAlert({
        type: "success",
        message: value ? "e-Transfer email saved." : "e-Transfer email removed.",
      });
      return true;
    } catch (err) {
      setAlert({ type: "danger", message: apiErrorMessage(err, "Failed to save e-Transfer email.") });
      return false;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const value = email.trim();
    if (!value) return;
    if (await save(value)) setEditing(false);
  };

  const handleRemove = async () => {
    if (await save("")) setConfirmRemove(false);
  };

  const actionBtn =
    "inline-flex items-center gap-2 rounded-lg bg-secondary px-2 py-1.5 text-sm font-medium text-white shadow-sm transition hover:shadow-lg";

  return (
    <div className="rounded-2xl bg-white shadow-md">
      <div className="flex flex-wrap md:flex-nowrap items-start justify-between p-4 md:p-10">
        <div className="flex items-start gap-3">
          <div className="mt-1 p-2 bg-gray-50 rounded-lg">
            <LuSend className="text-gray-400 text-2xl" />
          </div>
          <div>
            <h3 className="font-semibold text-xl">Interac e-Transfer</h3>
            <p className="text-gray-400">
              Let clients pay invoices by e-Transfer to your email.
            </p>
          </div>
        </div>
        <div
          className={`border ${savedEmail ? "border-green-300 bg-green-100" : "border-gray-200 bg-gray-100"} px-3 pb-0.5 ml-10 md:ml-0 mt-2 md:mt-0 lg:pt-1 lg:pb-1.5 rounded-full`}
        >
          <div
            className={`w-2 h-2 rounded-full inline-flex mr-2 ${savedEmail ? "bg-green-500" : "bg-gray-400"}`}
          />
          <p className="text-xs font-bold uppercase inline-flex text-gray-400">
            {savedEmail ? "Active" : "Not Set Up"}
          </p>
        </div>
      </div>

      <div className="border-t border-gray-200 p-4 md:px-10 md:py-8">
        {editing ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <Input
                type="email"
                id="etransfer_email"
                label="e-Transfer Email"
                value={email}
                onChange={setEmail}
                isRequired
                fieldClass="mb-0 h-11 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              {savedEmail && (
                <button
                  type="button"
                  onClick={() => {
                    setEmail(savedEmail);
                    setEditing(false);
                  }}
                  className="h-11 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
              <SubmitButton
                isLoading={isLoading}
                isDisabled={!email.trim()}
                btnName="Save Email"
                btnClass="h-11 rounded-xl bg-accent px-5 text-sm text-white shadow hover:bg-accentLight"
              />
            </div>
          </form>
        ) : (
          <div className="w-full flex flex-wrap items-center justify-between gap-3 text-sm border border-gray-200 bg-white p-3 rounded-xl text-gray-800">
            <span className="inline-flex min-w-0 items-center gap-2">
              <LuMail className="h-4 w-4 shrink-0 text-gray-400" />
              <strong className="break-all">{savedEmail}</strong>
            </span>
            <div className="flex items-center gap-2 text-sm md:text-base">
              <button type="button" className={actionBtn} onClick={() => setEditing(true)}>
                <FaPen />
                Edit
              </button>
              <button type="button" className={actionBtn} onClick={() => setConfirmRemove(true)}>
                <FaTrashAlt />
                Remove
              </button>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 md:p-5 text-amber-800 font-light flex items-start gap-3 mt-6">
          <div className="bg-amber-100 px-2 md:p-2 rounded-lg mt-0.5">
            <LuInfo className="text-amber-600 text-xl" />
          </div>
          <p className="text-sm md:text-base">
            When you send an invoice with e-Transfer details, the client is asked to send
            payment to this email with the invoice number in the message. Turn on
            Autodeposit with your bank so payments arrive without a security question.
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={confirmRemove}
        title="Remove e-Transfer Email"
        message={
          <div className="space-y-3">
            <p>This e-Transfer email will be removed:</p>
            <p className="rounded-xl border border-rose-100 bg-rose-50/60 px-3 py-2 font-semibold text-slate-900 break-all">
              {savedEmail}
            </p>
            <p>You won&apos;t be able to send invoices with e-Transfer details until you add one again.</p>
          </div>
        }
        confirmLabel="Remove"
        loadingLabel="Removing..."
        isLoading={isLoading}
        onConfirm={handleRemove}
        onCancel={() => setConfirmRemove(false)}
      />
    </div>
  );
}
