import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useFetchTeamMemberQuery } from "../../../store";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import LoadingScreen from "../../../Components/ui/LoadingScreen";
import { useDispatch } from "react-redux";
import { setTopbar, resetTopbar } from "../../../store/topbarSlice";

export default function TeamMember({ token }) {
  const { id } = useParams();
  const dispatch = useDispatch();

  // Declare all state hooks first
  const [name, setName] = useState("");
  const [memberRole, setMemberRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobDuties, setJobDuties] = useState("");
  const [expertise, setExpertise] = useState("");
  const [joinedAt, setJoinedAt] = useState("");
  const [alert, setAlert] = useState({ type: "", message: "" });

  const {
    data: teamMemberData,
    isLoading,
    error,
  } = useFetchTeamMemberQuery(id, { skip: !token });

  // Update topbar when name changes
  useEffect(() => {
    dispatch(
      setTopbar({
        title: name || "Team Member",
        description: "View team member details and information.",
        action: null,
      }),
    );
    return () => {
      dispatch(resetTopbar());
    };
  }, [dispatch, name]);

  useEffect(() => {
    if (teamMemberData) {
      setName(teamMemberData.employee_name || "");
      setEmail(teamMemberData.employee_email || "");
      setMemberRole(teamMemberData.role || "");
      setPhone(teamMemberData.employee_phone || "");
      setJobDuties(teamMemberData.job_duties || "");
      setExpertise(teamMemberData.expertise || "");
      setJoinedAt(teamMemberData.joined_at || "");
    }
  }, [teamMemberData]);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading)
    return <LoadingScreen />;

  if (error) {
    return (
      <AlertDispatcher
        type="danger"
        message={error?.data?.detail || "Failed to load team member."}
        onClose={() => setAlert({ type: "", message: "" })}
      />
    );
  }

  const inputClass =
    "w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-gray-600 focus:outline-none cursor-not-allowed";

  return (
    <>
      {alert.message && (
        <AlertDispatcher
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: "", message: "" })}
        />
      )}

      <div className="space-y-6 bg-white shadow-md rounded-2xl p-4 md:p-10">
        {/* Profile Photo Section */}
        <div>
          <div className="relative mx-auto md:mx-0 w-36 h-36">
            <div className="w-36 h-36 rounded-full bg-linear-to-br from-secondary to-primary flex items-center justify-center border-4 border-white shadow-md">
              <span className="text-5xl font-semibold text-white">
                {name ? name.charAt(0).toUpperCase() : "T"}
              </span>
            </div>
          </div>
          <div className="text-center md:text-left mt-6">
            <span className="block text-secondary font-semibold text-sm mb-2">
              {memberRole ? memberRole.toUpperCase() : "TEAM MEMBER"}
            </span>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:gap-6 md:grid-cols-2">
          {/* Full Name */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Full Name
            </label>
            <input type="text" value={name} disabled className={inputClass} />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Email Address
            </label>
            <input type="email" value={email} disabled className={inputClass} />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Phone Number
            </label>
            <input type="tel" value={phone} disabled className={inputClass} />
          </div>

          {/* Joined Date */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Joined Date
            </label>
            <input
              type="text"
              value={formatDate(joinedAt)}
              disabled
              className={inputClass}
            />
          </div>
        </div>

        {/* Job Duties */}
        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Job Duties
          </label>
          <textarea
            value={jobDuties}
            disabled
            rows="4"
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Expertise */}
        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Expertise
          </label>
          <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-gray-300 bg-gray-50 min-h-12 items-center">
            {expertise ? (
              expertise
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean)
                .map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex rounded-lg bg-secondary/10 px-3 py-1 text-sm font-medium text-secondary"
                  >
                    {skill}
                  </span>
                ))
            ) : (
              <span className="text-sm text-gray-500">—</span>
            )}
          </div>
        </div>

        {/* Action Link */}
        <div className="flex flex-col md:flex-row justify-between items-center md:pt-4 gap-4">
          <span className="text-gray-400 text-sm text-center md:text-left">
            To edit this team member, go back to the Team Members list.
          </span>
          <Link
            to="/user/business/team-members"
            className="inline-flex items-center justify-center rounded-lg bg-secondary px-6 py-2 text-sm font-semibold text-white shadow hover:bg-secondary/90 whitespace-nowrap"
          >
            Back to Team Members
          </Link>
        </div>
      </div>
    </>
  );
}
