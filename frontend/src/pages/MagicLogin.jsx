import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { useMagicLoginMutation } from "../store";

/**
 * MagicLogin page — handles magic link login from emails.
 *
 * URL format:
 *   /service-questionnaire/:questionnaireId/form/:serviceId?token=<magic_token>
 *
 * Flow:
 *   1. Extract token from search params.
 *   2. POST to /api/user/magic-login/ with the token.
 *   3. On success the mutation stores the auth token in localStorage.
 *   4. Redirect the user to the protected questionnaire form.
 */
export default function MagicLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { questionnaireId, serviceId } = useParams();
  const magicToken = searchParams.get("token");

  const [magicLogin] = useMagicLoginMutation();
  const [error, setError] = useState("");

  useEffect(() => {
    const destination = `/user/business/service-questionnaire/${questionnaireId}/form/${serviceId}`;

    // No magic token — fall back to existing session (direct navigation)
    if (!magicToken) {
      const existingToken = localStorage.getItem("token");
      if (existingToken) {
        navigate(destination, { replace: true });
      } else {
        setError("Invalid or missing link. Please request a new one.");
      }
      return;
    }

    // Always honour the magic token — ensures the correct user (the client
    // the email was sent to) is logged in, even if someone else is currently
    // in the browser.
    const login = async () => {
      try {
        await magicLogin({ token: magicToken }).unwrap();
        // Hard redirect: forces a full page reload so React re-initialises
        // from scratch with the new token. This prevents any stale Redux
        // cache or React state from the previous user flashing on screen.
        window.location.replace(destination);
      } catch {
        setError(
          "This link has expired or is invalid. Please contact your service provider for a new link.",
        );
      }
    };

    login();
  }, [magicToken, magicLogin, navigate, questionnaireId, serviceId]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
          <h2 className="mb-2 text-xl font-semibold text-red-700">
            Link Expired
          </h2>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <p className="text-gray-500">Signing you in, please wait…</p>
      </div>
    </div>
  );
}
