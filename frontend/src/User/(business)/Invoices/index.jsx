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
        description:
          "Manage billing, due dates, payments, and invoice activity.",
        action:
          role === "MANAGER"
            ? {
                type: "button",
                key: "add-invoice",
                label: "Add Invoice",
                title: "Add Invoice",
                icon: "plus",
                iconClassName: "h-6 w-6 md:h-4.5 md:w-4.5",
                labelClassName: "hidden md:inline-flex",
                className:
                  "inline-flex items-center gap-2 rounded-xl bg-accent px-2 md:px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accentLight disabled:opacity-60",
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

      <InvoiceDatatable
        role={role}
        token={token}
        setAlert={setAlert}
        onAddInvoice={() => setShowModal(true)}
      />
    </>
  );
}
