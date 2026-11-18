import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useFetchTeamMemberQuery } from "../../../store";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import { setTopbar, resetTopbar } from "../../../store/topbarSlice";
import TeamMemberHours from "./TeamMemberHours";

// /user/business/team-members/:id/hours: a team member's hours worked.
// Their details are edited from the Team Members list.
export default function TeamMember({ token }) {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { data: member, error } = useFetchTeamMemberQuery(id, { skip: !token });
  const name = member?.employee_name || "";

  useEffect(() => {
    dispatch(
      setTopbar({
        title: name || "Hours worked",
        description: "Hours logged on completed jobs, by day, month and year.",
        action: null,
      }),
    );
    return () => {
      dispatch(resetTopbar());
    };
  }, [dispatch, name]);

  if (error) {
    return (
      <AlertDispatcher
        type="danger"
        message={error?.data?.detail || "Failed to load team member."}
      />
    );
  }

  return <TeamMemberHours token={token} memberId={id} />;
}
