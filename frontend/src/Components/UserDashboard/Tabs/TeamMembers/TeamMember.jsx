import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFetchTeamMemberQuery, useUpdateTeamMemberMutation } from '../../../../store';
import SubmitButton from '../../../../utils/SubmitButton';

export default function TeamMember({ token }) {
    const { id } = useParams();
    const navigate = useNavigate();

    const {
        data: teamMemberData,
        isLoading,
        error,
    } = useFetchTeamMemberQuery(id, {
        skip: !token,
    });

    const [updateTeamMember, { isLoading: updatingMember }] = useUpdateTeamMemberMutation();

    const [phone, setPhone] = useState('');
    const [jobDuties, setJobDuties] = useState('');
    const [expertise, setExpertise] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [email, setEmail] = useState('');
    const [joinedAt, setJoinedAt] = useState('');

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateTeamMember({
                id,
                job_duties: jobDuties,
                expertise,
            }).unwrap();

            navigate('/dashboard/team-members');
        } catch (err) {
            console.error('Failed to update:', err);
        }
    };

    if (isLoading) return <div>Loading team member...</div>;

    if (error) {
        return (
            <div className="alert alert-danger mt-4" role="alert">
                {error?.data?.detail || 'Failed to load team member.'}
            </div>
        );
    }

    return (
        <>
            <div className="row">
                <div className="col-12 col-lg-3 mb-4">
                    <div className="text-center shadow p-3 bg-white rounded-3 mb-3">
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=120`}
                            alt={name}
                            className="rounded-circle mb-3 shadow-sm"
                            width="90"
                            height="90"
                        />
                        <h4 className="mb-1">{name}</h4>
                        <span className="badge rounded-pill bg-dark p-2">{role}</span>

                        <div className="d-flex flex-column align-items-center small text-muted mt-2">
                            <div>{email}</div>
                            <div>
                                <i className="bi bi-telephone me-2"></i>
                                {phone}
                            </div>
                            <div>
                                <i className="bi bi-calendar-event me-2"></i>
                                Joined: {joinedAt}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-9">
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="mb-3 col-md-12">
                                <label className="form-label">Job Duties</label>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    value={jobDuties}
                                    onChange={(e) => setJobDuties(e.target.value)}
                                    placeholder="Describe their responsibilities..."
                                ></textarea>
                            </div>

                            <div className="mb-3 col-md-12">
                                <label className="form-label">Expertise</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={expertise}
                                    onChange={(e) => setExpertise(e.target.value)}
                                    placeholder="e.g., Plumbing, Electrical Work"
                                />
                            </div>
                        </div>

                        <div className="d-flex justify-content-end">
                            <button
                                type="button"
                                className="btn btn-dark me-2"
                                onClick={() => navigate('/dashboard/team-members')}
                            >
                                Cancel
                            </button>
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
