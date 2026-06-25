import { useState, useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import { setTopbar, resetTopbar } from "../../../store/topbarSlice";
import {
  registerTopbarActionHandler,
  unregisterTopbarActionHandler,
} from "../../topbarActionRegistry";
import CreateServiceTermsForm from "./CreateServiceTermsForm";
import ServiceTermsData from "./ServiceTermsData";

export default function TermsAndConditions({ token }) {
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [editTemplate, setEditTemplate] = useState(null);
  const dispatch = useDispatch();

  const handleAddTerms = useCallback(() => {
    setEditTemplate(null);
    setShowModal(true);
  }, []);

  useEffect(() => {
    registerTopbarActionHandler("add-service-terms", handleAddTerms);

    dispatch(
      setTopbar({
        title: "Terms & Conditions",
        description:
          "Create reusable service-level terms that are automatically included with every quote.",
        action: {
          type: "button",
          key: "add-service-terms",
          label: "Add Terms",
          title: "Add Terms",
          icon: "plus",
          iconClassName: "h-6 w-6 md:h-4.5 md:w-4.5",
          labelClassName: "hidden md:block",
          className:
            "inline-flex items-center justify-center gap-2 h-10 w-10 md:h-auto md:w-auto rounded-xl bg-accent px-0 md:px-4 py-0 md:py-2 text-sm font-semibold text-white shadow hover:bg-accentLight",
        },
      }),
    );

    return () => {
      unregisterTopbarActionHandler("add-service-terms");
      dispatch(resetTopbar());
    };
  }, [dispatch, handleAddTerms]);

  return (
    <div className="space-y-4">
      {alert.message && (
        <AlertDispatcher
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: "", message: "" })}
        />
      )}

      <CreateServiceTermsForm
        token={token}
        showModal={showModal}
        setShowModal={setShowModal}
        setAlert={setAlert}
        initialData={editTemplate}
        mode={editTemplate ? "edit" : "create"}
        setInitialData={setEditTemplate}
      />

      <ServiceTermsData
        token={token}
        setAlert={setAlert}
        onEdit={(template) => {
          setEditTemplate(template);
          setShowModal(true);
        }}
      />
    </div>
  );
}
