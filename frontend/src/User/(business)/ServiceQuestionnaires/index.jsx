import { useState, useCallback } from "react";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import CreateServiceQuestionnairesForm from "./CreateServiceQuestionnairesForm";
import ServiceQuestionnairesData from "./ServiceQuestionnairesData";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import { setTopbar, resetTopbar } from "../../../store/topbarSlice";
import {
  registerTopbarActionHandler,
  unregisterTopbarActionHandler,
} from "../../topbarActionRegistry";

export default function Questionnaires({ token }) {
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [editQuestionnaire, setEditQuestionnaire] = useState(null);
  const dispatch = useDispatch();

  const handleAddQuestionnaire = useCallback(() => {
    setEditQuestionnaire(null);
    setShowModal(true);
  }, []);

  useEffect(() => {
    registerTopbarActionHandler("add-questionnaire", handleAddQuestionnaire);

    dispatch(
      setTopbar({
        title: "Service Questionnaires",
        description:
          "Create question sets for each service so clients can provide details when booking.",
        action: {
          type: "button",
          key: "add-questionnaire",
          label: "Add Questionnaire",
          title: "Add Questionnaire",
          icon: "plus",
          iconClassName: "h-6 w-6 lg:h-5 lg:w-5",
          labelClassName: "hidden md:block",
          className:
            "inline-flex items-center justify-center gap-2 h-10 w-10 md:h-auto md:w-auto rounded-xl lg:rounded-lg bg-accent px-0 md:px-4 py-0 md:py-2 text-sm font-semibold text-white shadow hover:bg-accentLight",
        },
      }),
    );

    return () => {
      unregisterTopbarActionHandler("add-questionnaire");
      dispatch(resetTopbar());
    };
  }, [dispatch, handleAddQuestionnaire]);

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
        initialData={editQuestionnaire}
        mode={editQuestionnaire ? "edit" : "create"}
        setInitialData={setEditQuestionnaire}
      />

      <ServiceQuestionnairesData token={token} setAlert={setAlert} onEdit={(q) => { setEditQuestionnaire(q); setShowModal(true); }} />
    </div>
  );
}
