import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useFetchTeamMemberQuery, useUpdateTeamMemberMutation } from '../../../../store';
import SubmitButton from '../../../ui/SubmitButton';
import AlertDispatcher from '../../../ui/AlertDispatcher';
import Input from '../../../ui/Input';

export default function TeamMember({ token, business, role }) {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: teamMemberData, isLoading, error } = useFetchTeamMemberQuery(id, { skip: !token });
    const [updateTeamMember, { isLoading: updatingMember }] = useUpdateTeamMemberMutation();

    const [phone, setPhone] = useState('');
    const [jobDuties, setJobDuties] = useState('');
    const [expertise, setExpertise] = useState('');
    const [name, setName] = useState('');
    const [memberRole, setMemberRole] = useState('');
    const [email, setEmail] = useState('');
    const [joinedAt, setJoinedAt] = useState('');
    const [alert, setAlert] = useState({ type: '', message: '' });

    useEffect(() => {
        if (teamMemberData) {
            setName(teamMemberData.employee_name || '');
            setEmail(teamMemberData.employee_email || '');
            setMemberRole(teamMemberData.role || '');
            setPhone(teamMemberData.employee_phone || '');
            setJobDuties(teamMemberData.job_duties || '');
            setExpertise(teamMemberData.expertise || '');
            setJoinedAt(teamMemberData.joined_at || '');
        }
    }, [teamMemberData]);

    const portalLabel =
        business?.name ||
        (role === 'CLIENT' ? 'Client Portal' : role === 'EMPLOYEE' ? 'Employee Portal' : 'Dashboard');

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
            navigate('/dashboard/team-members');
        } catch (err) {
            setAlert({
                type: 'danger',
                message: err?.data?.detail || 'Failed to update team member. Please try again.',
            });
        }
    };

    if (isLoading) return <div className="mt-8 text-center text-gray-600">Loading team member...</div>;

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

            <nav aria-label="breadcrumb" className="mb-4">
                <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <li>
                        <Link to={`/dashboard/home`} className="font-semibold text-secondary hover:text-accent">
                            {portalLabel}
                        </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li>
                        <Link to={`/dashboard/team-members`} className="font-semibold text-secondary hover:text-accent">
                            Team Members
                        </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li className="text-gray-700 font-semibold">{name}</li>
                </ol>
            </nav>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white/90 p-5 shadow-sm">
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-secondary text-5xl font-semibold text-white shadow-lg">
                            {name ? name.charAt(0) : 'T'}
                        </div>
                        <h4 className="text-lg font-semibold text-primary">{name}</h4>
                        <span className="mt-1 inline-flex rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase text-secondary">
                            {memberRole || '—'}
                        </span>

                        <div className="mt-3 space-y-1 text-sm text-gray-600">
                            <div className="font-semibold text-secondary">{email}</div>
                            <div>{phone}</div>
                            <div className="text-xs text-gray-500">Joined: {formatDate(joinedAt)}</div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-gray-800">Job Duties</label>
                            <textarea
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                                rows="3"
                                value={jobDuties}
                                onChange={(e) => setJobDuties(e.target.value)}
                                placeholder="Describe their responsibilities..."
                            ></textarea>
                        </div>

                        <Input
                            id="expertise"
                            label={'Expertise'}
                            value={expertise}
                            onChange={setExpertise}
                            fieldClass="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />

                        <div className="flex justify-end">
                            <SubmitButton
                                isLoading={updatingMember}
                                btnClass="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accentLight"
                                btnName="Save Changes"
                            />
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
