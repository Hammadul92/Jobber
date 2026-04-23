import { useState } from "react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import CreateJobForm from "./CreateJobForm";
import JobData from "./JobData";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import { setTopbar, resetTopbar } from "../../../store/topbarSlice";

export default function Jobs({ token, role }) {
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      setTopbar({
        title: "Jobs",
        description: "Track one-time and recurring work from scheduling to completion.",
        action:
          role === "MANAGER" ? (
            <button
              className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentLight"
              onClick={() => setShowModal(true)}
              type="button"
            >
              Add Job
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
