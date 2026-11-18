import { useState } from "react";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import CreateJobForm from "./CreateJobForm";
import JobData from "./JobData";
import GenerateJobsDialog from "./GenerateJobsDialog";
import { setTopbar, resetTopbar } from "../../../store/topbarSlice";
import {
  registerTopbarActionHandler,
  unregisterTopbarActionHandler,
} from "../../topbarActionRegistry";

export default function Jobs({ token, role }) {
  const [showModal, setShowModal] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (role === "MANAGER") {
      registerTopbarActionHandler("add-job", () => setShowModal(true));
      registerTopbarActionHandler("generate-jobs", () => setShowGenerate(true));
    }

    dispatch(
      setTopbar({
        title: "Jobs",
        description:
          "Track one-time and recurring work from scheduling to completion.",
        secondaryActions:
          role === "MANAGER"
            ? [
                {
                  type: "button",
                  key: "generate-jobs",
                  label: "Generate Jobs",
                  title: "Generate jobs for many services at once",
                  icon: "zap",
                  iconClassName: "h-5 w-5 md:h-6 md:w-6",
                  labelClassName: "hidden md:inline-flex",
                  className:
                    "inline-flex items-center gap-2 rounded-xl border border-accent bg-white px-3 md:px-4 py-2 text-sm font-semibold text-accent shadow-sm hover:bg-accent/5",
                },
              ]
            : [],
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
      unregisterTopbarActionHandler("generate-jobs");
      dispatch(resetTopbar());
    };
  }, [dispatch, role]);

  return (
    <>
      {role === "MANAGER" && (
        <CreateJobForm
          token={token}
          showModal={showModal}
          setShowModal={setShowModal}
        />
      )}

      {role === "MANAGER" && (
        <GenerateJobsDialog
          token={token}
          open={showGenerate}
          onClose={() => setShowGenerate(false)}
        />
      )}

      <JobData role={role} token={token} />
    </>
  );
}
