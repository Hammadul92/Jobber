import { useState } from "react";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import CreateClientForm from "./CreateClientForm";
import DataTable from "./ClientsDatatable";
import QuickAddDialog from "./QuickAddDialog";
import { setTopbar, resetTopbar } from "../../../store/topbarSlice";
import {
  registerTopbarActionHandler,
  unregisterTopbarActionHandler,
} from "../../topbarActionRegistry";

export default function Clients({ token, business }) {
  const [showModal, setShowModal] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    registerTopbarActionHandler("add-client", () => setShowModal(true));
    registerTopbarActionHandler("quick-add", () => setShowQuickAdd(true));

    dispatch(
      setTopbar({
        title: "Clients",
        description: "Manage client profiles and their active services.",
        secondaryActions: [
          {
            type: "button",
            key: "quick-add",
            label: "Quick Add",
            title: "Add a client, service and quote from a note",
            icon: "sparkles",
            iconClassName: "h-5 w-5 md:h-4.5 md:w-4.5",
            labelClassName: "hidden md:block",
            className:
              "inline-flex items-center gap-2 rounded-xl border border-accent bg-white px-3 md:px-4 py-2 text-sm font-semibold text-accent shadow-sm hover:bg-accent/5",
          },
        ],
        action: {
          type: "button",
          key: "add-client",
          label: "Add Client",
          title: "Add Client",
          icon: "user-plus",
          iconClassName: "h-6 w-6 md:h-4.5 md:w-4.5",
          labelClassName: "hidden md:block",
          className:
            "inline-flex items-center gap-2 rounded-xl bg-accent px-3 md:px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accentLight",
        },
      }),
    );

    return () => {
      unregisterTopbarActionHandler("add-client");
      unregisterTopbarActionHandler("quick-add");
      dispatch(resetTopbar());
    };
  }, [dispatch]);

  return (
    <>
      <CreateClientForm
        showModal={showModal}
        setShowModal={setShowModal}
      />

      <QuickAddDialog
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        business={business}
      />

      <DataTable
        token={token}
        showAddClient={setShowModal}
      />
    </>
  );
}
