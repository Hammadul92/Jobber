import { useEffect, useRef, useState } from "react";
import { useAddBankAccountMutation } from "../store";

export default function StripeOnboardingRefresh() {
  const requested = useRef(false);
  const [error, setError] = useState("");
  const [addBankAccount] = useAddBankAccountMutation();

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    const refreshOnboarding = async () => {
      try {
        const response = await addBankAccount().unwrap();
        if (!response?.onboarding_url) {
          throw new Error("Missing Stripe onboarding URL");
        }
        window.location.replace(response.onboarding_url);
      } catch (requestError) {
        if (requestError?.status === 401) return;
        setError(
          requestError?.data?.detail ||
            "Unable to refresh Stripe onboarding. Return to banking and try again.",
        );
      }
    };

    refreshOnboarding();
  }, [addBankAccount]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-bold text-secondary">
          Refreshing Stripe onboarding
        </h1>
        {error ? (
          <>
            <p className="mt-3 text-gray-600">{error}</p>
            <a
              className="mt-6 inline-flex rounded-xl bg-secondary px-6 py-3 font-semibold text-white"
              href="/user/banking"
            >
              Return to Banking
            </a>
          </>
        ) : (
          <p className="mt-3 text-gray-600">Please wait...</p>
        )}
      </div>
    </main>
  );
}
