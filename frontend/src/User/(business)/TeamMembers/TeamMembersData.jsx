import { useState, useEffect, useMemo } from "react";
import { LuSearch, LuFilter } from "react-icons/lu";
import { LuTrash2, LuPencilLine } from "react-icons/lu";
import {
  useFetchTeamMembersQuery,
  useDeleteTeamMemberMutation,
} from "../../../store";
import SubmitButton from "../../../Components/ui/SubmitButton";
import LoadingScreen from "../../../Components/ui/LoadingScreen";
import RecordsTable from "../../../Components/ui/RecordsTable";

export default function TeamMembersData({ token, setAlert, onEdit }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openFilter, setOpenFilter] = useState(null);
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedExpertise, setSelectedExpertise] = useState("ALL");

  const {
    data: teamMemberData,
    isLoading,
    error,
  } = useFetchTeamMembersQuery(undefined, { skip: !token });
  const [deleteTeamMember, { isLoading: deleting }] =
    useDeleteTeamMemberMutation();

  useEffect(() => {
    if (error) {
      setAlert({
        type: "danger",
        message:
          error?.data?.detail ||
          "Failed to load team members. Please try again later.",
      });
    }
  }, [error, setAlert]);

  useEffect(() => {
    const handleClickOutside = () => setOpenFilter(null);
    if (openFilter) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openFilter]);

  const toText = (value) =>
    value === null || value === undefined ? "" : String(value).trim();

  const toTitleCase = (value) =>
    toText(value)
      .toLowerCase()
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  const isMemberActive = (member) => {
    const value = String(member?.is_active ?? "").toLowerCase();
    return value === "true" || value === "1" || value === "yes";
  };

  const members = useMemo(() => {
    return (teamMemberData || []).map((member) => ({
      ...member,
      _role: toText(member?.role).toUpperCase(),
      _expertise: toText(member?.expertise),
      _active: isMemberActive(member),
      _searchBlob: JSON.stringify(member).toLowerCase(),
    }));
  }, [teamMemberData]);

  const roleOptions = useMemo(() => {
    const roles = [...new Set(members.map((m) => m._role))]
      .filter(Boolean)
      .sort();
    return ["ALL", ...roles];
  }, [members]);

  const expertiseOptions = useMemo(() => {
    const values = [...new Set(members.map((m) => m._expertise))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    return ["ALL", ...values];
  }, [members]);

  const statusOptions = ["ALL", "ACTIVE", "PENDING"];

  const filteredMembers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return members.filter((m) => {
      const memberStatus = m._active ? "ACTIVE" : "PENDING";
      const matchesRole = selectedRole === "ALL" || m._role === selectedRole;
      const matchesStatus =
        selectedStatus === "ALL" || memberStatus === selectedStatus;
      const matchesExpertise =
        selectedExpertise === "ALL" || m._expertise === selectedExpertise;

      if (!query) {
        return matchesRole && matchesStatus && matchesExpertise;
      }

      return (
        matchesRole &&
        matchesStatus &&
        matchesExpertise &&
        m._searchBlob.includes(query)
      );
    });
  }, [members, searchTerm, selectedRole, selectedStatus, selectedExpertise]);

  const stats = useMemo(() => {
    const total = members.length;
    const active = members.filter((m) => m._active).length;
    const pending = total - active;
    const roles = new Set(members.map((m) => m._role)).size;

    return {
      total,
      active,
      pending,
      roles,
    };
  }, [members]);

  const getExpertiseTags = (expertise) => {
    const value = toText(expertise);
    if (!value) return [];

    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  };

  const handleDeleteClick = (id) => {
    setSelectedTeamMemberId(id);
    setShowModal(true);
  };

  const confirmDelete = async (e) => {
    e.preventDefault();
    if (!selectedTeamMemberId) return;

    try {
      await deleteTeamMember(selectedTeamMemberId).unwrap();
      setShowModal(false);
      setSelectedTeamMemberId(null);
      setAlert({
        type: "success",
        message: "Team member deleted successfully.",
      });
    } catch (err) {
      setAlert({
        type: "danger",
        message:
          err?.data?.detail ||
          "Failed to delete team member. Please try again.",
      });
    }
  };

  const columns = [
    {
      key: "member",
      title: "Team Member",
      width: "14%",
      className: "px-4 py-3 font-semibold text-slate-900",
      render: (member) => member.employee_name || "—",
    },
    {
      key: "role",
      title: "Role",
      width: "9%",
      render: (member) => toTitleCase(member.role) || "—",
    },
    {
      key: "email",
      title: "Email",
      width: "18%",
      className: "break-all px-4 py-3 text-slate-700",
      render: (member) => member.employee_email || "—",
    },
    {
      key: "phone",
      title: "Phone",
      width: "13%",
      render: (member) => member.employee_phone || "—",
    },
    {
      key: "duties",
      title: "Job Duties",
      width: "16%",
      render: (member) => (
        <span className="line-clamp-4" title={member.job_duties || undefined}>
          {member.job_duties || "—"}
        </span>
      ),
    },
    {
      key: "expertise",
      title: "Expertise",
      width: "14%",
      render: (member) => {
        const tags = getExpertiseTags(member.expertise);
        return tags.length ? (
          <div className="line-clamp-4 leading-7" title={tags.join(", ")}>
            {tags.map((tag) => (
              <span
                key={tag}
                className="mr-1 inline-block rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-slate-800"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          "—"
        );
      },
    },
    {
      key: "status",
      title: "Status",
      width: "8%",
      render: (member) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${member._active ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
        >
          {member._active ? "ACTIVE" : "PENDING"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      width: "8%",
      render: (member) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit?.(member)}
            className="rounded-xl p-2 text-secondary hover:bg-secondary/5"
            title={`Edit ${member.employee_name}`}
            aria-label={`Edit ${member.employee_name}`}
          >
            <LuPencilLine className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteClick(member.id)}
            disabled={member.role === "MANAGER"}
            className="rounded-xl p-2 text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
            title={`Delete ${member.employee_name}`}
            aria-label={`Delete ${member.employee_name}`}
          >
            <LuTrash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) return <LoadingScreen />;
  if (error)
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
        Failed to load team members. Please refresh the page or try again later.
      </div>
    );

  const hasRoleFilter = selectedRole !== "ALL";
  const hasStatusFilter = selectedStatus !== "ALL";
  const hasExpertiseFilter = selectedExpertise !== "ALL";

  const buttonClass =
    "relative inline-flex h-8 md:h-10 lg:h-12 items-center gap-2 rounded-lg md:rounded-xl border border-gray-300 bg-white px-3 md:px-5 text-base font-medium text-slate-700 transition hover:border-gray-400";

  const dropdownClass =
    "absolute right-0 top-[calc(100%+6px)] z-20 space-y-1.5 min-w-48 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg";

  return (
    <>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-5">
            <p className="mb-1 text-base font-light text-slate-600">
              Total Members
            </p>
            <p className="text-3xl font-semibold text-slate-900">
              {stats.total}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-5">
            <p className="mb-1 text-base font-light text-slate-600">Active</p>
            <p className="text-3xl font-semibold text-slate-900">
              {stats.active}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-5">
            <p className="mb-1 text-base font-light text-slate-600">Pending</p>
            <p className="text-3xl font-semibold text-slate-900">
              {stats.pending}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-5">
            <p className="mb-1 text-base font-light text-slate-600">Roles</p>
            <p className="text-3xl font-semibold text-slate-900">
              {stats.roles}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-4">
              <div className="relative w-full xl:flex-1">
                <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search members..."
                  className="h-12 w-full rounded-xl border border-gray-300 bg-gray-50 pl-11 pr-3 text-lg text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-between md:justify-start md:flex-wrap items-center gap-2.5 md:gap-3">
                <div
                  className="relative"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() =>
                      setOpenFilter((current) =>
                        current === "role" ? null : "role",
                      )
                    }
                  >
                    <LuFilter className="h-4 w-4 md:h-5 md:w-5" />
                    Role
                    {hasRoleFilter ? (
                      <span
                        className="absolute left-1.5 md:left-3.5 top-0.5 md:top-1.5 lg:top-2.5 h-2.5 w-2.5 rounded-full bg-accent"
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                  {openFilter === "role" && (
                    <div className={dropdownClass}>
                      {roleOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm ${
                            selectedRole === option
                              ? "bg-slate-100 text-slate-900"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                          onClick={() => {
                            setSelectedRole(option);
                            setOpenFilter(null);
                          }}
                        >
                          <span>
                            {option === "ALL" ? "All" : toTitleCase(option)}
                          </span>
                          {selectedRole === option ? <span>✓</span> : null}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className="relative"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() =>
                      setOpenFilter((current) =>
                        current === "status" ? null : "status",
                      )
                    }
                  >
                    <LuFilter className="h-4 w-4 md:h-5 md:w-5" />
                    Status
                    {hasStatusFilter ? (
                      <span
                        className="absolute left-1.5 md:left-3.5 top-0.5 md:top-1.5 lg:top-2.5 h-2.5 w-2.5 rounded-full bg-orange-500"
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                  {openFilter === "status" && (
                    <div className={dropdownClass}>
                      {statusOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm ${
                            selectedStatus === option
                              ? "bg-slate-100 text-slate-900"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                          onClick={() => {
                            setSelectedStatus(option);
                            setOpenFilter(null);
                          }}
                        >
                          <span>
                            {option === "ALL" ? "All" : toTitleCase(option)}
                          </span>
                          {selectedStatus === option ? <span>✓</span> : null}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className="relative"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() =>
                      setOpenFilter((current) =>
                        current === "expertise" ? null : "expertise",
                      )
                    }
                  >
                    <LuFilter className="h-4 w-4 md:h-5 md:w-5" />
                    Expertise
                    {hasExpertiseFilter ? (
                      <span
                        className="absolute left-1.5 md:left-3.5 top-0.5 md:top-1.5 lg:top-2.5 h-2.5 w-2.5 rounded-full bg-orange-500"
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                  {openFilter === "expertise" && (
                    <div className={dropdownClass}>
                      {expertiseOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm ${
                            selectedExpertise === option
                              ? "bg-slate-100 text-slate-900"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                          onClick={() => {
                            setSelectedExpertise(option);
                            setOpenFilter(null);
                          }}
                        >
                          <span>
                            {option === "ALL" ? "All" : toTitleCase(option)}
                          </span>
                          {selectedExpertise === option ? <span>✓</span> : null}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <RecordsTable
            columns={columns}
            tableClassName="min-w-[900px] sm:min-w-[1300px]"
            rows={filteredMembers}
            rowKey={(member) => member.id}
            empty={
              <div className="mx-auto max-w-md text-center">
                <h5 className="text-xl font-medium text-slate-900">
                  {members.length
                    ? "No team members match your filters."
                    : "No team members yet"}
                </h5>
                <p className="mt-2 text-sm text-slate-500">
                  {members.length
                    ? "Try adjusting your search or filters."
                    : "Add a team member to start managing staff access and duties."}
                </p>
              </div>
            }
            footer={
              <p>
                Showing {filteredMembers.length} of {members.length} team
                members
              </p>
            }
          />
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={confirmDelete}
            className="max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-6"
          >
            <div className="flex items-start justify-between gap-3">
              <h5 className="text-xl font-medium text-primary">
                Delete Team Member
              </h5>
              <button
                type="button"
                className="text-2xl text-gray-500 hover:text-gray-800"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <p className="text-gray-700">
              Are you sure you want to delete this team member?
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
                onClick={() => setShowModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <SubmitButton
                isLoading={deleting}
                btnClass="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100"
                btnName="Delete"
              />
            </div>
          </form>
        </div>
      )}
    </>
  );
}
