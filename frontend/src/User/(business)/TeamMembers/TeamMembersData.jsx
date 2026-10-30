import { useState, useEffect, useMemo } from "react";
import { LuSearch, LuFilter, LuTrash2, LuPencilLine } from "react-icons/lu";
import {
  useFetchTeamMembersPageQuery,
  useBulkTeamMembersMutation,
  useDeleteTeamMemberMutation,
} from "../../../store";
import SubmitButton from "../../../Components/ui/SubmitButton";
import LoadingScreen from "../../../Components/ui/LoadingScreen";
import RecordsTable from "../../../Components/ui/RecordsTable";
import RecordLink from "../../../Components/ui/RecordLink";
import BulkActionBar from "../../../Components/ui/BulkActionBar";
import TablePagination from "../../../Components/ui/TablePagination";
import useServerTable from "../../../hooks/useServerTable";

const ROLE_OPTIONS = [
  { value: "", label: "All" },
  { value: "MANAGER", label: "Manager" },
  { value: "EMPLOYEE", label: "Employee" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "true", label: "Active" },
  { value: "false", label: "Pending" },
];

const BULK_ACTIONS = [
  {
    key: "delete",
    label: "Remove",
    tone: "danger",
    confirmMessage: (count) =>
      `Remove ${count} team member${count === 1 ? "" : "s"} from your business?`,
  },
];

// Only the counts are needed for the summary cards.
const COUNT_ONLY = { page: 1, page_size: 1 };

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

const getExpertiseTags = (expertise) =>
  toText(expertise)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

export default function TeamMembersData({ token, setAlert, onEdit }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState(null);
  const [openFilter, setOpenFilter] = useState(null);

  const table = useServerTable();
  const { data, isLoading, isFetching, error } = useFetchTeamMembersPageQuery(
    table.queryArgs,
    { skip: !token },
  );
  const { data: activeData } = useFetchTeamMembersPageQuery(
    { ...COUNT_ONLY, is_active: "true" },
    { skip: !token },
  );
  const { data: pendingData } = useFetchTeamMembersPageQuery(
    { ...COUNT_ONLY, is_active: "false" },
    { skip: !token },
  );
  const [deleteTeamMember, { isLoading: deleting }] =
    useDeleteTeamMemberMutation();
  const [bulkTeamMembers] = useBulkTeamMembersMutation();

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

  const members = useMemo(
    () =>
      (data?.results || []).map((member) => ({
        ...member,
        _role: toText(member?.role).toUpperCase(),
        _active: isMemberActive(member),
      })),
    [data],
  );

  // The business owner's own manager record cannot be removed.
  const selectableIds = members
    .filter((member) => member._role !== "MANAGER")
    .map((member) => member.id);

  const activeCount = activeData?.count;
  const pendingCount = pendingData?.count;
  const stats = [
    {
      label: "Total Members",
      value:
        activeCount === undefined || pendingCount === undefined
          ? "—"
          : activeCount + pendingCount,
    },
    { label: "Active", value: activeCount ?? "—" },
    { label: "Pending", value: pendingCount ?? "—" },
  ];

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

  const runBulkAction = async (action) => {
    const result = await bulkTeamMembers({
      action,
      ids: table.selectedIds,
    }).unwrap();
    table.clearSelection();
    return result;
  };

  const memberNameFor = (id) =>
    members.find((member) => String(member.id) === String(id))
      ?.employee_name || `#${id}`;

  const columns = [
    {
      key: "member",
      title: "Team Member",
      sortKey: "employee__name",
      width: "14%",
      className: "px-4 py-3 font-semibold text-slate-900",
      render: (member) => (
        <RecordLink to={`/user/business/team-member/${member.id}`} className="text-slate-900">
          {member.employee_name || "—"}
        </RecordLink>
      ),
    },
    {
      key: "role",
      title: "Role",
      sortKey: "employee__role",
      width: "9%",
      render: (member) => toTitleCase(member.role) || "—",
    },
    {
      key: "email",
      title: "Email",
      sortKey: "employee__email",
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
            disabled={member._role === "MANAGER"}
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
  if (error && !data)
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
        Failed to load team members. Please refresh the page or try again later.
      </div>
    );

  const buttonClass =
    "relative inline-flex h-8 md:h-10 lg:h-12 items-center gap-2 rounded-lg md:rounded-xl border border-gray-300 bg-white px-3 md:px-5 text-base font-medium text-slate-700 transition hover:border-gray-400";

  const dropdownClass =
    "absolute right-0 top-[calc(100%+6px)] z-20 space-y-1.5 min-w-48 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg";

  const filterMenus = [
    { key: "role", label: "Role", options: ROLE_OPTIONS, dot: "bg-accent" },
    {
      key: "is_active",
      label: "Status",
      options: STATUS_OPTIONS,
      dot: "bg-orange-500",
    },
  ];

  return (
    <>
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-gray-200 bg-white px-5 py-5"
            >
              <p className="mb-1 text-base font-light text-slate-600">
                {stat.label}
              </p>
              <p className="text-3xl font-semibold text-slate-900">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-4">
              <div className="relative w-full xl:flex-1">
                <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={table.searchInput}
                  onChange={(event) => table.setSearchInput(event.target.value)}
                  placeholder="Search name, email, phone or duties..."
                  className="h-12 w-full rounded-xl border border-gray-300 bg-gray-50 pl-11 pr-3 text-lg text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-between md:justify-start md:flex-wrap items-center gap-2.5 md:gap-3">
                {filterMenus.map((menu) => {
                  const current = table.filters[menu.key] || "";
                  return (
                    <div
                      key={menu.key}
                      className="relative"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        className={buttonClass}
                        onClick={() =>
                          setOpenFilter((open) =>
                            open === menu.key ? null : menu.key,
                          )
                        }
                      >
                        <LuFilter className="h-4 w-4 md:h-5 md:w-5" />
                        {menu.label}
                        {current ? (
                          <span
                            className={`absolute left-1.5 md:left-3.5 top-0.5 md:top-1.5 lg:top-2.5 h-2.5 w-2.5 rounded-full ${menu.dot}`}
                            aria-hidden="true"
                          />
                        ) : null}
                      </button>
                      {openFilter === menu.key && (
                        <div className={dropdownClass}>
                          {menu.options.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm ${
                                current === option.value
                                  ? "bg-slate-100 text-slate-900"
                                  : "text-slate-700 hover:bg-slate-100"
                              }`}
                              onClick={() => {
                                table.setFilter(menu.key, option.value);
                                setOpenFilter(null);
                              }}
                            >
                              <span>{option.label}</span>
                              {current === option.value ? (
                                <span>✓</span>
                              ) : null}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <BulkActionBar
            selectedCount={table.selectedIds.length}
            actions={BULK_ACTIONS.map((action) => ({
              ...action,
              describeRow: memberNameFor,
            }))}
            onRun={runBulkAction}
            onClear={table.clearSelection}
          />
          <RecordsTable
            columns={columns}
            tableClassName="min-w-[900px] sm:min-w-[1300px]"
            rows={members}
            rowKey={(member) => member.id}
            ordering={table.ordering}
            onSort={table.toggleSort}
            isFetching={isFetching}
            selection={{
              selectedIds: table.selectedIds,
              onToggle: (id) => {
                if (selectableIds.includes(id)) table.toggleSelected(id);
              },
              onToggleAll: () => table.toggleAllSelected(selectableIds),
            }}
            empty={
              <div className="mx-auto max-w-md text-center">
                <h5 className="text-xl font-medium text-slate-900">
                  {table.hasActiveFilters
                    ? "No team members match your filters."
                    : "No team members yet"}
                </h5>
                <p className="mt-2 text-sm text-slate-500">
                  {table.hasActiveFilters
                    ? "Try adjusting your search or filters."
                    : "Add a team member to start managing staff access and duties."}
                </p>
              </div>
            }
            footer={
              <TablePagination
                page={table.page}
                pageSize={table.pageSize}
                count={data?.count}
                totalPages={data?.total_pages}
                isFetching={isFetching}
                noun="team members"
                onPageChange={table.goToPage}
                onPageSizeChange={table.setPageSize}
              />
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
