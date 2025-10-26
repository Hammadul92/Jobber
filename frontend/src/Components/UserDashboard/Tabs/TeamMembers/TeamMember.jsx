import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFetchTeamMemberQuery, useUpdateTeamMemberMutation } from '../../../../store';
import SubmitButton from '../../../../utils/SubmitButton';
import AlertDispatcher from '../../../../utils/AlertDispatcher';

export default function TeamMember({ token }) {
    const { id } = useParams();

    const { data: teamMemberData, isLoading, error } = useFetchTeamMemberQuery(id, { skip: !token });

    const [updateTeamMember, { isLoading: updatingMember }] = useUpdateTeamMemberMutation();

    const [phone, setPhone] = useState('');
    const [jobDuties, setJobDuties] = useState('');
    const [expertise, setExpertise] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [email, setEmail] = useState('');
    const [joinedAt, setJoinedAt] = useState('');
    const [alert, setAlert] = useState({ type: '', message: '' });

    useEffect(() => {
        if (teamMemberData) {
            setName(teamMemberData.employee_name || '');
            setEmail(teamMemberData.employee_email || '');
            setRole(teamMemberData.role || '');
            setPhone(teamMemberData.employee_phone || '');
            setJobDuties(teamMemberData.job_duties || '');
            setExpertise(teamMemberData.expertise || '');
            setJoinedAt(teamMemberData.joined_at || '');
        }
    }, [teamMemberData]);

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateTeamMember({
                id,
                job_duties: jobDuties,
                expertise,
            }).unwrap();

            setAlert({ type: 'success', message: 'Team member updated successfully.' });
        } catch (err) {
            console.error('Failed to update:', err);
            setAlert({
                type: 'danger',
                message: err?.data?.detail || 'Failed to update team member. Please try again.',
            });
        }
    };

    if (isLoading) return <div>Loading team member...</div>;

    if (error) {
        return (
            <AlertDispatcher
                type="danger"
                message={error?.data?.detail || 'Failed to load team member.'}
                onClose={() => setAlert({ type: '', message: '' })}
            />
        );
    }

    return (
        <>
            {alert.message && (
                <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: '', message: '' })}
                />
            )}

            <nav aria-label="breadcrumb mb-3">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to={`/dashboard/home`} className="text-success">
                            Dashboard
                        </Link>
                    </li>
                    <li className="breadcrumb-item">
                        <Link to={`/dashboard/team-members`} className="text-success">
                            Team Members
                        </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        {name}
                    </li>
                </ol>
            </nav>

            <div className="row">
                <div className="col-12 col-lg-3 mb-3">
                    <div className="text-center shadow-sm p-3 bg-white rounded-3 mb-3">
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=120`}
                            alt={name}
                            className="rounded-circle mb-3 shadow-sm"
                            width="90"
                            height="90"
                        />
                        <h4 className="mb-1">{name}</h4>
                        <span className="badge rounded-pill bg-gradient bg-dark p-2">{role}</span>

                        <div className="d-flex flex-column align-items-center small text-muted mt-2">
                            <div>{email}</div>
                            <div>
                                <i className="bi bi-telephone me-2"></i>
                                {phone}
                            </div>
                            <div>
                                <i className="bi bi-calendar-event me-2"></i>
                                Joined: {formatDate(joinedAt)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-9">
                    <form onSubmit={handleSubmit} className="shadow-sm p-3 bg-white rounded">
                        <div className="field-wrapper">
                            <textarea
                                className="form-control"
                                rows="3"
                                value={jobDuties}
                                onChange={(e) => setJobDuties(e.target.value)}
                                placeholder="Describe their responsibilities..."
                            ></textarea>
                            <label className="form-label">Job Duties</label>
                        </div>

                        <div className="field-wrapper">
                            <input
                                type="text"
                                className="form-control"
                                value={expertise}
                                onChange={(e) => setExpertise(e.target.value)}
                                placeholder="e.g., Plumbing, Electrical Work"
                            />
                            <label className="form-label">Expertise</label>
                        </div>

                        <div className="d-flex justify-content-end mt-3">
                            <SubmitButton
                                isLoading={updatingMember}
                                btnClass="btn btn-success"
                                btnName="Save Changes"
                            />
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
