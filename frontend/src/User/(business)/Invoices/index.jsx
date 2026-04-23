import { useState } from "react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import CreateInvoiceForm from "./CreateInvoiceForm";
import InvoiceDatatable from "./InvoiceDatatable";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import { setTopbar, resetTopbar } from "../../../store/topbarSlice";

export default function Invoices({ token, role, business }) {
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      setTopbar({
        title: "Invoices",
        description: "Manage billing, due dates, and payments.",
        action:
          role === "MANAGER" ? (
            <button
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentLight"
              onClick={() => setShowModal(true)}
              type="button"
            >
              Add Invoice
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
        <CreateInvoiceForm
          token={token}
          showModal={showModal}
          setShowModal={setShowModal}
          setAlert={setAlert}
          business={business}
        />
      )}

      <InvoiceDatatable role={role} token={token} setAlert={setAlert} />
    </>
  );
}
