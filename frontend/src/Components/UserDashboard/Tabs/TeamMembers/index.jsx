import { useState } from 'react';
import { Link } from 'react-router-dom';
import AlertDispatcher from '../../../../utils/AlertDispatcher';
import CreateTeamMemberForm from './CreateTeamMemberForm';
import TeamMembersData from './TeamMembersData';

export default function TeamMembers({ token, business }) {
    const [showModal, setShowModal] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });

    return (
        <div>
            {alert.message && (
                <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: '', message: '' })}
                />
            )}

            <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to={`/`} className="text-success">
                            Contractorz
                        </Link>
                    </li>
                    <li className="breadcrumb-item">
                        <Link to="/dashboard/home" className="text-success">
                            {business?.name ||
                                (role === 'CLIENT'
                                    ? 'Client Portal'
                                    : role === 'EMPLOYEE'
                                      ? 'Employee Portal'
                                      : 'Dashboard')}
                        </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        Team Members
                    </li>
                </ol>
            </nav>

            <div className="d-flex align-items-center justify-content-between mb-3 mt-4">
                <h3 className="mb-0 fw-bold">Team Members</h3>
                <button className="btn btn-success float-end" onClick={() => setShowModal(true)}>
                    Add
                </button>
            </div>

            <CreateTeamMemberForm token={token} showModal={showModal} setShowModal={setShowModal} setAlert={setAlert} />

            <TeamMembersData token={token} setAlert={setAlert} />
        </div>
    );
}
