import { useNavigate } from "react-router-dom";
import { LuChevronLeft } from "react-icons/lu";

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
      className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-slate-600 transition-colors hover:text-accent"
      aria-label="Go back"
    >
      <LuChevronLeft className="h-4 w-4" strokeWidth={3} />
      Go back
    </button>
  );
}
