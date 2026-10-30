import { useState } from "react";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import CreateQuoteForm from "./CreateQuoteForm";
import QuotesData from "./QuotesData";
import { setTopbar, resetTopbar } from "../../../store/topbarSlice";
import {
  registerTopbarActionHandler,
  unregisterTopbarActionHandler,
} from "../../topbarActionRegistry";
import useAlert from "../../../hooks/useAlert";

export default function Quotes({ token, role }) {
  const [showModal, setShowModal] = useState(false);
  const setAlert = useAlert();
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!location.state?.quoteSent) return;
    setAlert({ type: "success", message: "Quote email sent successfully!" });
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate, setAlert]);

  useEffect(() => {
    if (role === "MANAGER") {
      registerTopbarActionHandler("add-quote", () => setShowModal(true));
    }

    dispatch(
      setTopbar({
        title: "Quotes",
        description: "Create, send and track quotes and client approvals.",
        action:
          role === "MANAGER"
            ? {
                type: "button",
                key: "add-quote",
                label: "Add Quote",
                title: "Add Quote",
                icon: "plus",
                iconClassName: "h-6 w-6 md:h-4.5 md:w-4.5",
                labelClassName: "hidden md:block",
                className:
                  "inline-flex items-center gap-2 rounded-lg bg-accent px-3 md:px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accentLight",
              }
            : null,
      }),
    );

    return () => {
      unregisterTopbarActionHandler("add-quote");
      dispatch(resetTopbar());
    };
  }, [dispatch, role]);

  return (
    <>
      {role === "MANAGER" && (
        <CreateQuoteForm
          token={token}
          showModal={showModal}
          setShowModal={setShowModal}
        />
      )}

      <div>
        <QuotesData token={token} role={role} />
      </div>
    </>
  );
}
