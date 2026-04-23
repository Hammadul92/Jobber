import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { LuSearch, LuFilter } from "react-icons/lu";
import { LuMail, LuPhone, LuTrash2 } from "react-icons/lu";
import {
  useFetchTeamMembersQuery,
  useDeleteTeamMemberMutation,
} from "../../../store";
import SubmitButton from "../../../Components/ui/SubmitButton";

export default function TeamMembersData({ token, setAlert }) {
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

  const getInitial = (name) => {
    const safeName = toText(name);
    return safeName ? safeName.charAt(0).toUpperCase() : "U";
  };

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

  if (isLoading)
    return (
      <div className="mt-6 text-center text-gray-600">
        Loading team members...
      </div>
    );
  if (error) return null;

  const hasRoleFilter = selectedRole !== "ALL";
  const hasStatusFilter = selectedStatus !== "ALL";
  const hasExpertiseFilter = selectedExpertise !== "ALL";

  const buttonClass =
    "relative inline-flex h-12 items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 text-lg font-medium text-slate-700 transition hover:border-gray-400";

  const dropdownClass =
    "absolute right-0 top-[calc(100%+6px)] z-20 space-y-1.5 min-w-48 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg";

  return (
    <>
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-5">
            <p className="mb-1 text-base font-light text-slate-600">Total Members</p>
            <p className="text-3xl font-semibold text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-5">
            <p className="mb-1 text-base font-light text-slate-600">Active</p>
            <p className="text-3xl font-semibold text-slate-900">{stats.active}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-5">
            <p className="mb-1 text-base font-light text-slate-600">Pending</p>
            <p className="text-3xl font-semibold text-slate-900">{stats.pending}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-5">
            <p className="mb-1 text-base font-light text-slate-600">Roles</p>
            <p className="text-3xl font-semibold text-slate-900">{stats.roles}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
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

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() =>
                    setOpenFilter((current) =>
                      current === "role" ? null : "role",
                    )
                  }
                >
                  <LuFilter className="h-5 w-5" />
                  Role
                  {hasRoleFilter ? (
                    <span
                      className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-accent"
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

              <div className="relative" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() =>
                    setOpenFilter((current) =>
                      current === "status" ? null : "status",
                    )
                  }
                >
                  <LuFilter className="h-5 w-5" />
                  Status
                  {hasStatusFilter ? (
                    <span
                      className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-orange-500"
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

              <div className="relative" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() =>
                    setOpenFilter((current) =>
                      current === "expertise" ? null : "expertise",
                    )
                  }
                >
                  <LuFilter className="h-5 w-5" />
                  Expertise
                  {hasExpertiseFilter ? (
                    <span
                      className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-orange-500"
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
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((m) => (
            <div
              key={m.id}
              className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-orange-100 text-2xl font-semibold text-orange-700">
                    {getInitial(m.employee_name)}
                  </div>
                  <div>
                    <h5 className="text-2xl font-medium text-slate-900">
                      {m.employee_name}
                    </h5>
                    <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                      {toTitleCase(m.role)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="rounded-md p-1 text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed! disabled:opacity-40"
                  onClick={() => handleDeleteClick(m.id)}
                  disabled={m.role === "MANAGER"}
                  aria-label="Delete member"
                >
                  <LuTrash2 className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <span
                  className={`inline-flex rounded-lg border px-3 py-0.5 text-sm font-semibold ${
                    m._active
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {m._active ? "Active" : "Pending"}
                </span>
              </div>

              <div className="space-y-2 text-base text-slate-600">
                <p className="flex items-center gap-3">
                  <LuMail className="h-5 w-5 text-slate-400" />
                  <span className="truncate">{m.employee_email || "-"}</span>
                </p>
                <p className="flex items-center gap-3">
                  <LuPhone className="h-5 w-5 text-slate-400" />
                  <span>{m.employee_phone || "-"}</span>
                </p>
              </div>

              <div className="mt-5 space-y-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-700">
                    Job Duties
                  </p>
                  <p className="text-base text-slate-600">
                    {m.job_duties || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-700">
                    Expertise
                  </p>
                  <div className="my-1 flex flex-wrap gap-2">
                    {getExpertiseTags(m.expertise).length ? (
                      getExpertiseTags(m.expertise).map((tag) => (
                        <span
                          key={`${m.id}-${tag}`}
                          className="rounded-lg bg-gray-100 px-3 py-1 text-sm font-medium text-slate-700"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">-</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-auto border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/user/business/team-member/${m.id}`}
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-base font-medium text-white hover:bg-slate-800"
                    title="Edit Team Member"
                  >
                    Edit
                  </Link>

                  <Link
                    to={`/user/business/team-member/${m.id}`}
                    className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-base font-medium text-slate-700 hover:bg-gray-50"
                    title="View Profile"
                  >
                    View Profile
                  </Link>
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="col-span-full rounded-xl border border-dashed border-gray-200 bg-white/70 px-5 py-10 text-center text-gray-600">
            No team members match the selected filters.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={confirmDelete}
            className="max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h5 className="text-lg font-semibold text-primary">
                  Delete Team Member
                </h5>
                <p className="text-sm text-gray-600">
                  This action cannot be undone.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-700">
              Are you sure you want to delete this team member?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                onClick={() => setShowModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <SubmitButton
                isLoading={deleting}
                btnClass="inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-rose-700"
                btnName="Delete"
              />
            </div>
          </form>
        </div>
      )}
    </>
  );
}
