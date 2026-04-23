import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import CreateTeamMemberForm from "./CreateTeamMemberForm";
import TeamMembersData from "./TeamMembersData";
import { useDispatch } from "react-redux";
import { setTopbar, resetTopbar } from "../../../store/topbarSlice";

export default function TeamMembers({ token }) {
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      setTopbar({
        title: "Team Members",
        description: "Manage your staff access, duties, and expertise.",
        action: (
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accentLight"
            onClick={() => setShowModal(true)}
            type="button"
          >
            Add Member
          </button>
        ),
      })
    );
    return () => {
      dispatch(resetTopbar());
    };
  }, [dispatch]);

  return (
    <div className="space-y-6">
      {alert.message && (
        <AlertDispatcher
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: "", message: "" })}
        />
      )}

      <CreateTeamMemberForm
        token={token}
        showModal={showModal}
        setShowModal={setShowModal}
        setAlert={setAlert}
      />

      <TeamMembersData token={token} setAlert={setAlert} />
    </div>
  );
}
