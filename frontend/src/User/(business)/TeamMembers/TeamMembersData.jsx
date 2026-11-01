import { useState, useEffect, useMemo } from "react";
import { LuTrash2, LuPencilLine } from "react-icons/lu";
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
import { pluralize } from "../../../utils/pluralize";
import TablePagination from "../../../Components/ui/TablePagination";
import useServerTable from "../../../hooks/useServerTable";
import useAlert from "../../../hooks/useAlert";
import TableToolbar, {
  TableStats,
  ToolbarSelect,
  tableCardClass,
} from "../../../Components/ui/TableToolbar";

const ROLE_OPTIONS = [
  { value: "", label: "All roles" },
  { value: "MANAGER", label: "Manager" },
  { value: "EMPLOYEE", label: "Employee" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "true", label: "Active" },
  { value: "false", label: "Pending" },
];

const BULK_ACTIONS = [
  {
    key: "delete",
    label: "Remove",
    tone: "danger",
    confirmMessage: (count) =>
      `Remove ${pluralize(count, "team member")} from your business?`,
    successMessage: (count) => `${pluralize(count, "team member")} removed.`,
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

export default function TeamMembersData({ token, onEdit }) {
  const setAlert = useAlert();
  const [showModal, setShowModal] = useState(false);
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState(null);

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

  return (
    <>
      <div className="space-y-5">
        <TableStats stats={stats} />

        <div className={tableCardClass}>
          <TableToolbar
            searchValue={table.searchInput}
            onSearchChange={table.setSearchInput}
            searchPlaceholder="Search name, email, phone or duties"
            isFiltered={table.hasActiveFilters}
            onClear={table.resetFilters}
          >
            <ToolbarSelect
              id="team-role-filter"
              label="Role"
              value={table.filters.role}
              onChange={(value) => table.setFilter("role", value)}
              options={ROLE_OPTIONS}
            />
            <ToolbarSelect
              id="team-status-filter"
              label="Status"
              value={table.filters.is_active}
              onChange={(value) => table.setFilter("is_active", value)}
              options={STATUS_OPTIONS}
            />
          </TableToolbar>
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
