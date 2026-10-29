import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams, useParams } from "react-router-dom";
import { useMagicLoginMutation } from "../store";

/**
 * MagicLogin page — handles magic link login from emails.
 *
 * URL format:
 *   /service-questionnaire/:questionnaireId/form/:serviceId?token=<magic_token>
 *
 * Flow:
 *   1. Extract token from search params.
 *   2. POST to /api/user/magic-login/ with the token (each link works once).
 *   3. On success the mutation stores the auth token in localStorage.
 *   4. Redirect the user to the protected questionnaire form.
 */
export default function MagicLogin({ destination: destinationOverride }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { questionnaireId, serviceId } = useParams();
  const magicToken = searchParams.get("token");
  const destination =
    destinationOverride ||
    `/user/business/service-questionnaire/${questionnaireId}/form/${serviceId}`;

  const [magicLogin] = useMagicLoginMutation();
  const [error, setError] = useState("");

  useEffect(() => {
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
        const response = await magicLogin({ token: magicToken }).unwrap();
        localStorage.setItem("token", response.token);
        // Hard redirect: forces a full page reload so React re-initialises
        // from scratch with the new token. This prevents any stale Redux
        // cache or React state from the previous user flashing on screen.
        window.location.replace(destination);
      } catch {
        // Links work once; reopening one on a signed-in device keeps the session.
        if (localStorage.getItem("token")) {
          window.location.replace(destination);
          return;
        }
        setError(
          "This link has already been used or has expired. Sign in to continue, or use Forgot password to set a password for your account.",
        );
      }
    };

    login();
  }, [
    destinationOverride,
    destination,
    magicToken,
    magicLogin,
    navigate,
    questionnaireId,
    serviceId,
  ]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
          <h2 className="mb-2 text-xl font-semibold text-red-700">
            Link No Longer Valid
          </h2>
          <p className="text-sm text-red-600">{error}</p>
          <Link
            to={`/sign-in?next=${encodeURIComponent(destination)}`}
            className="mt-4 inline-block font-medium text-secondary underline"
          >
            Sign in to continue
          </Link>
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
