import { useState } from "react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import { useDispatch } from "react-redux";

import CreateClientForm from "./CreateClientForm";
import DataTable from "./ClientsDatatable";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import { setTopbar, resetTopbar } from "../../../store/topbarSlice";

export default function Clients({ token }) {
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const dispatch = useDispatch();


  useEffect(() => {
    dispatch(
      setTopbar({
        title: "Clients",
        description: "Manage client profiles and their active services.",
        action: (
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accentLight"
            onClick={() => setShowModal(true)}
            type="button"
          >
            Add Client
          </button>
        ),
      }),
    );

    return () => {
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
      <div className="rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-sm">
        <DataTable
          token={token}
          setAlert={setAlert}
          showAddClient={setShowModal}
        />
      </div>
    </>
  );
}
