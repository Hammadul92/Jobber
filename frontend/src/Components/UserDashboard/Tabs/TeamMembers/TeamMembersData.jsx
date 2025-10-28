import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetchTeamMembersQuery, useDeleteTeamMemberMutation } from '../../../../store';
import SubmitButton from '../../../../utils/SubmitButton';

export default function TeamMembersData({ token, setAlert }) {
    const [showModal, setShowModal] = useState(false);
    const [selectedTeamMemberId, setSelectedTeamMemberId] = useState(null);

    const { data: teamMemberData, isLoading, error } = useFetchTeamMembersQuery(undefined, { skip: !token });
    const [deleteTeamMember, { isLoading: deleting }] = useDeleteTeamMemberMutation();

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

    if (isLoading) return <div>Loading data...</div>;

    if (error) {
        setAlert({
            type: 'danger',
            message: error?.data?.detail || 'Failed to load team members. Please try again later.',
        });
        return null;
    }

    return (
        <>
            <div className="row">
                {teamMemberData && teamMemberData.length > 0 ? (
                    teamMemberData.map((m) => (
                        <div key={m.id} className="col-md-6 col-lg-3 mb-3">
                            <div className="card shadow-sm border-0 h-100">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h5 className="card-title mb-0">{m.employee_name}</h5>
                                        <span className="badge bg-dark bg-gradient rounded-pill">{m.role}</span>
                                    </div>

                                    <p className="text-muted small mb-1">Email: {m.employee_email}</p>
                                    <p className="text-muted small mb-1">Phone: {m.employee_phone}</p>
                                    <p className="text-muted small mb-1">Job Duties: {m.job_duties || '-'}</p>
                                    <p className="text-muted small">Expertise: {m.expertise || '-'}</p>

                                    <div className="d-flex justify-content-between align-items-center gap-2">
                                        <div>
                                            <span
                                                className={`badge bg-gradient rounded-pill ${
                                                    m.is_active === 'True' ? 'bg-success' : 'bg-danger'
                                                }`}
                                            >
                                                {m.is_active === 'True' ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div>
                                            <Link
                                                to={`/dashboard/team-member/${m.id}`}
                                                className="btn btn-light rounded-circle py-1 px-2 border-0 fs-6 me-2"
                                                title="Edit Team Member"
                                            >
                                                <i className="fa fa-pencil"></i>
                                            </Link>

                                            <button
                                                type="button"
                                                className="btn btn-light rounded-circle py-1 px-2 border-0 fs-6"
                                                onClick={() => handleDeleteClick(m.id)}
                                                disabled={m.role === 'MANAGER'}
                                            >
                                                <i className="fa fa-trash-alt"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-12 text-center py-5">
                        <p className="text-muted mb-0">No team members found.</p>
                    </div>
                )}
            </div>

            {showModal && (
                <form onSubmit={confirmDelete} className="modal d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Delete Team Member</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete this team member?</p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-dark"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <SubmitButton isLoading={deleting} btnClass="btn btn-sm btn-danger" btnName="Delete" />
                            </div>
                        </div>
                    </div>
                </form>
            )}

            {showModal && <div className="modal-backdrop fade show"></div>}
        </>
    );
}
