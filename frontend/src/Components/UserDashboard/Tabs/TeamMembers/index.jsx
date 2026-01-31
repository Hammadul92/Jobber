import { useState } from 'react';
import { Link } from 'react-router-dom';
import AlertDispatcher from '../../../ui/AlertDispatcher';
import CreateTeamMemberForm from './CreateTeamMemberForm';
import TeamMembersData from './TeamMembersData';

export default function TeamMembers({ token, business, role }) {
    const [showModal, setShowModal] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });

    const portalLabel =
        business?.name ||
        (role === 'CLIENT' ? 'Client Portal' : role === 'EMPLOYEE' ? 'Employee Portal' : 'Dashboard');

    return (
        <div className="space-y-6">
            {alert.message && (
                <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: '', message: '' })}
                />
            )}

            <nav aria-label="breadcrumb" className="mb-2">
                <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <li>
                        <Link to={`/`} className="font-semibold text-accent hover:text-accentLight">
                            Contractorz
                        </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li>
                        <Link to="/dashboard/home" className="font-semibold text-secondary hover:text-accent">
                            {portalLabel}
                        </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li className="text-gray-700 font-semibold">Team Members</li>
                </ol>
            </nav>

            <div className="flex flex-wrap items-start justify-between gap-y-2 mt-16 md:mt-8">
                <div>
                    <h3 className="text-xl md:text-2xl font-heading font-semibold text-primary">Team Members</h3>
                    <p className="text-sm text-gray-600">Manage your staff access, duties, and expertise.</p>
                </div>
                <button
                    className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accentLight"
                    onClick={() => setShowModal(true)}
                    type="button"
                >
                    Add Member
                </button>
            </div>

            <CreateTeamMemberForm
                token={token}
                showModal={showModal}
                setShowModal={setShowModal}
                setAlert={setAlert}
            />

            <TeamMembersData token={token} setAlert={setAlert} />
        </div>
    );
}
