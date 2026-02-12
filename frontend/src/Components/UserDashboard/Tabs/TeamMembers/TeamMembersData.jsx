import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFetchTeamMembersQuery, useDeleteTeamMemberMutation } from '../../../../store';
import SubmitButton from '../../../ui/SubmitButton';

export default function TeamMembersData({ token, setAlert }) {
    const [showModal, setShowModal] = useState(false);
    const [selectedTeamMemberId, setSelectedTeamMemberId] = useState(null);

    const { data: teamMemberData, isLoading, error } = useFetchTeamMembersQuery(undefined, { skip: !token });
    const [deleteTeamMember, { isLoading: deleting }] = useDeleteTeamMemberMutation();

    useEffect(() => {
        if (error) {
            setAlert({
                type: 'danger',
                message: error?.data?.detail || 'Failed to load team members. Please try again later.',
            });
        }
    }, [error, setAlert]);

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
            setAlert({ type: 'success', message: 'Team member deleted successfully.' });
        } catch (err) {
            setAlert({
                type: 'danger',
                message: err?.data?.detail || 'Failed to delete team member. Please try again.',
            });
        }
    };

    if (isLoading) return <div className="mt-6 text-center text-gray-600">Loading team members...</div>;
    if (error) return null;

    return (
        <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teamMemberData && teamMemberData.length > 0 ? (
                    teamMemberData.map((m) => (
                        <div key={m.id} className="rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm">
                            <div className="mb-3 flex items-start justify-between gap-3">
                                <div>
                                    <h5 className="text-base font-semibold text-primary">{m.employee_name}</h5>
                                    <p className="text-xs uppercase tracking-wide text-gray-500">{m.role}</p>
                                </div>
                                <span
                                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                        m.is_active === 'True'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-rose-100 text-rose-700'
                                    }`}
                                >
                                    {m.is_active === 'True' ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="space-y-1 text-sm text-gray-700">
                                <p>
                                    <span className="font-semibold text-secondary">Email:</span> {m.employee_email}
                                </p>
                                <p>
                                    <span className="font-semibold text-secondary">Phone:</span> {m.employee_phone}
                                </p>
                                <p>
                                    <span className="font-semibold text-secondary">Job Duties:</span>{' '}
                                    {m.job_duties || '-'}
                                </p>
                                <p>
                                    <span className="font-semibold text-secondary">Expertise:</span> {m.expertise || '-'}
                                </p>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-2">
                                <Link
                                    to={`/dashboard/team-member/${m.id}`}
                                    className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-secondary hover:border-accent hover:text-accent"
                                    title="Edit Team Member"
                                >
                                    Edit
                                </Link>

                                <button
                                    type="button"
                                    className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-rose-600 hover:border-rose-200 hover:bg-rose-50 disabled:cursor-not-allowed! disabled:opacity-60!"
                                    onClick={() => handleDeleteClick(m.id)}
                                    disabled={m.role === 'MANAGER'}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full rounded-xl border border-dashed border-gray-200 bg-white/70 px-6 py-12 text-center text-gray-600">
                        No team members found.
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <form onSubmit={confirmDelete} className="max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                                <h5 className="text-lg font-semibold text-primary">Delete Team Member</h5>
                                <p className="text-sm text-gray-600">This action cannot be undone.</p>
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

                        <p className="text-sm text-gray-700">Are you sure you want to delete this team member?</p>

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
