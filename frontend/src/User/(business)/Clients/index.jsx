import { useState } from "react";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import CreateClientForm from "./CreateClientForm";
import DataTable from "./ClientsDatatable";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import { setTopbar, resetTopbar } from "../../../store/topbarSlice";
import {
  registerTopbarActionHandler,
  unregisterTopbarActionHandler,
} from "../../topbarActionRegistry";

export default function Clients({ token }) {
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const dispatch = useDispatch();

  useEffect(() => {
    registerTopbarActionHandler("add-client", () => setShowModal(true));

    dispatch(
      setTopbar({
        title: "Clients",
        description: "Manage client profiles and their active services.",
        action: {
          type: "button",
          key: "add-client",
          label: "Add Client",
          title: "Add Client",
          icon: "user-plus",
          iconClassName: "h-5 w-5",
          labelClassName: "hidden md:block",
          className:
            "inline-flex items-center gap-2 rounded-lg bg-accent px-3 md:px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accentLight",
        },
      }),
    );

    return () => {
      unregisterTopbarActionHandler("add-client");
      dispatch(resetTopbar());
    };
  }, [dispatch]);

  return (
    <>
      {alert.message && (
        <AlertDispatcher
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: "", message: "" })}
        />
      )}

      <CreateClientForm
        showModal={showModal}
        setShowModal={setShowModal}
        setAlert={setAlert}
      />

      <DataTable token={token} setAlert={setAlert} showAddClient={setShowModal} />
    </>
  );
}
