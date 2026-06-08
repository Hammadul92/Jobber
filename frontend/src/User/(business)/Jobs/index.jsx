import { useState } from "react";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import CreateJobForm from "./CreateJobForm";
import JobData from "./JobData";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import { setTopbar, resetTopbar } from "../../../store/topbarSlice";
import {
  registerTopbarActionHandler,
  unregisterTopbarActionHandler,
} from "../../topbarActionRegistry";

export default function Jobs({ token, role }) {
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const dispatch = useDispatch();

  useEffect(() => {
    if (role === "MANAGER") {
      registerTopbarActionHandler("add-job", () => setShowModal(true));
    }

    dispatch(
      setTopbar({
        title: "Jobs",
        description:
          "Track one-time and recurring work from scheduling to completion.",
        action:
          role === "MANAGER"
            ? {
                type: "button",
                key: "add-job",
                label: "Add Job",
                title: "Add Job",
                icon: "plus",
                iconClassName: "h-6 w-6 md:h-7 md:w-7",
                labelClassName: "hidden md:inline-flex",
                className:
                  "inline-flex items-center gap-2 rounded-xl bg-accent px-3 md:px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accentLight disabled:opacity-60",
              }
            : null,
      }),
    );

    return () => {
      unregisterTopbarActionHandler("add-job");
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
        <CreateJobForm
          token={token}
          showModal={showModal}
          setShowModal={setShowModal}
          setAlert={setAlert}
        />
      )}

      <JobData role={role} token={token} setAlert={setAlert} />
    </>
  );
}
