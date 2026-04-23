import { useState } from "react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";

import CreateServiceQuestionnairesForm from "./CreateServiceQuestionnairesForm";
import ServiceQuestionnairesData from "./ServiceQuestionnairesData";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import { setTopbar, resetTopbar } from "../../../store/topbarSlice";

export default function Questionnaires({ token }) {
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      setTopbar({
        title: "Service Questionnaires",
        description:
          "Create question sets for each service so clients can provide details when booking.",
        action: (
          <button
            className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentLight"
            onClick={() => setShowModal(true)}
            type="button"
          >
            Add Questionnaire
          </button>
        ),
      }),
    );

    return () => {
      dispatch(resetTopbar());
    };
  }, [dispatch]);

  return (
    <div className="space-y-4">

      {alert.message && (
        <AlertDispatcher
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: "", message: "" })}
        />
      )}

      <CreateServiceQuestionnairesForm
        token={token}
        showModal={showModal}
        setShowModal={setShowModal}
        setAlert={setAlert}
      />

      <ServiceQuestionnairesData token={token} setAlert={setAlert} />
    </div>
  );
}
