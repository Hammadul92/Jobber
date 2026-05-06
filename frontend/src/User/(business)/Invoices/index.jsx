import { useState } from "react";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import CreateInvoiceForm from "./CreateInvoiceForm";
import InvoiceDatatable from "./InvoiceDatatable";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import { setTopbar, resetTopbar } from "../../../store/topbarSlice";
import {
  registerTopbarActionHandler,
  unregisterTopbarActionHandler,
} from "../../topbarActionRegistry";

export default function Invoices({ token, role, business }) {
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const dispatch = useDispatch();

  useEffect(() => {
    if (role === "MANAGER") {
      registerTopbarActionHandler("add-invoice", () => setShowModal(true));
    }

    dispatch(
      setTopbar({
        title: "Invoices",
        description: "Manage billing, due dates, and payments.",
        action:
          role === "MANAGER"
            ? {
                type: "button",
                key: "add-invoice",
                label: "Add Invoice",
                title: "Add Invoice",
                icon: "plus",
                iconClassName: "h-5 w-5",
                labelClassName: "block",
                className:
                  "rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentLight",
              }
            : null,
      }),
    );

    return () => {
      unregisterTopbarActionHandler("add-invoice");
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
