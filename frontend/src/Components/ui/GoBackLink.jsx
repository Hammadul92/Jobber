import { useNavigate } from "react-router-dom";
import { LuArrowLeft } from "react-icons/lu";

// Back arrow shown beside the page title; falls back to the list page when
// there is no in-app history (e.g. the page was opened from an email link).
export default function GoBackLink({ fallback }) {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-600 transition hover:border-accent hover:text-accent md:h-10 md:w-10"
      aria-label="Go back"
      title="Go back"
    >
      <LuArrowLeft className="h-5 w-5" strokeWidth={2.5} />
    </button>
  );
}
