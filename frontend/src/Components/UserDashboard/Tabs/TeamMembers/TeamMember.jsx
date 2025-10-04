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
            setPhone(teamMemberData.phone || '');
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
                phone,
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
            <div className="alert alert-danger" role="alert">
                {error?.data?.detail || 'Failed to load team member.'}
            </div>
        );
    }

    return (
        <div>
            <h3 className="mb-4">{name}</h3>

            <form onSubmit={handleSubmit}>
                <div className="row mb-3">
                    {/* Read-only user fields */}
                    <div className="mb-3 col-md-6">
                        <label className="form-label">Name</label>
                        <input type="text" className="form-control" value={name} disabled />
                    </div>

                    <div className="mb-3 col-md-6">
                        <label className="form-label">Role</label>
                        <input type="text" className="form-control" value={role} disabled />
                    </div>

                    <div className="mb-3 col-md-6">
                        <label className="form-label">Email</label>
                        <input type="email" className="form-control" value={email} disabled />
                    </div>

                    <div className="mb-3 col-md-6">
                        <label className="form-label">Joined At</label>
                        <input type="text" className="form-control" value={joinedAt} disabled />
                    </div>
                </div>

                {/* Editable TeamMember fields */}
                <div className="row mb-3">
                    <div className="mb-3 col-md-6">
                        <label className="form-label">Phone</label>
                        <input
                            type="text"
                            className="form-control"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <div className="mb-3 col-md-12">
                        <label className="form-label">Job Duties</label>
                        <textarea
                            className="form-control"
                            rows="3"
                            value={jobDuties}
                            onChange={(e) => setJobDuties(e.target.value)}
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

                {/* Actions */}
                <div>
                    <button
                        type="button"
                        className="btn btn-sm btn-dark me-2"
                        onClick={() => navigate('/dashboard/team-members')}
                    >
                        Cancel
                    </button>

                    <SubmitButton isLoading={updatingMember} btnClass="btn btn-sm btn-success" btnName="Save Changes" />
                </div>
            </form>
        </div>
    );
}
