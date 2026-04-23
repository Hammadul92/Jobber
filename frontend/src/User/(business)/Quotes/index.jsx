import { useState } from "react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";

import CreateQuoteForm from "./CreateQuoteForm";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import QuotesData from "./QuotesData";
import { setTopbar, resetTopbar } from "../../../store/topbarSlice";

export default function Quotes({ token, role }) {
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const dispatch = useDispatch();


  useEffect(() => {
    dispatch(
      setTopbar({
        title: "Quotes",
        description: "Manage your staff access, duties, and expertise.",
        action:
          role === "MANAGER" ? (
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accentLight"
              onClick={() => setShowModal(true)}
              type="button"
            >
              Add Quote
            </button>
          ) : null,
      }),
    );

    return () => {
      dispatch(resetTopbar());
    };
  }, [dispatch, role]);

  return (
    <>

      {alert.message && (
        <AlertDispatcher
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: "", message: "" })}
        />
      )}

      {role === "MANAGER" && (
        <CreateQuoteForm
          token={token}
          showModal={showModal}
          setShowModal={setShowModal}
          setAlert={setAlert}
        />
      )}

      <div>
        <QuotesData token={token} role={role} setAlert={setAlert} />
      </div>
    </>
  );
}
