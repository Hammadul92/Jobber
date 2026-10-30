import { useAddBankAccountMutation, useDeleteBankingInformationMutation } from "../../store";
import SubmitButton from "../../Components/ui/SubmitButton";
import useAlert from "../../hooks/useAlert";

export default function StripeOnboardingButton({ connection, onDisconnect }) {
  const setAlert = useAlert();
  const [addBankAccount, { isLoading }] = useAddBankAccountMutation();
  const [deleteBankingInformation, { isLoading: reconnecting }] = useDeleteBankingInformationMutation();
  const needsReconnect = connection?.stripe_connection_status === "reconnect_required";
  const continuing = connection?.stripe_connection_status === "onboarding";
  const managing = connection?.stripe_connection_status === "connected";

  const handleConnect = async (e) => {
    e.preventDefault();

    try {
      if (needsReconnect) {
        await deleteBankingInformation(connection.id).unwrap();
      }
      const response = await addBankAccount().unwrap();
      const url = response?.onboarding_url;

      if (url) {
        window.location.href = url;
      } else {
        setAlert({
          type: "danger",
          message: "Unable to create onboarding link.",
        });
      }
    } catch (err) {
      setAlert({
        type: "danger",
        message: err?.data?.detail || "Failed to connect Stripe account.",
      });
    }
  };

  return (
    <form
      className="mt-5 flex flex-wrap items-center justify-center gap-3"
      onSubmit={handleConnect}
    >
      <SubmitButton
        btnClass="flex items-center gap-2 rounded-xl bg-secondary px-6 py-3 md:text-lg font-semibold text-white shadow hover:shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
        btnName={needsReconnect ? "Reconnect Stripe" : continuing ? "Continue Stripe setup" : managing ? "Manage Stripe details" : "Connect Stripe for Payouts"}
        isLoading={isLoading || reconnecting}
      />
      {continuing && onDisconnect && (
        <button
          type="button"
          className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          onClick={onDisconnect}
          disabled={isLoading || reconnecting}
        >
          Disconnect
        </button>
      )}
    </form>
  );
}
