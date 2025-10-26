import { useState } from 'react';
import { Link } from 'react-router-dom';
import AlertDispatcher from '../../../../utils/AlertDispatcher';
import CreateTeamMemberForm from './CreateTeamMemberForm';
import DataTable from './TeamMembersDatatable';

export default function TeamMembers({ token }) {
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

            <nav aria-label="breadcrumb mb-3">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to={`/dashboard/home`} className="text-success">
                            Dashboard
                        </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        Team Members
                    </li>
                </ol>
            </nav>

            <div className="clearfix mb-3">
                <button className="btn btn-success float-end" onClick={() => setShowModal(true)}>
                    Add
                </button>
                <h3 className="mb-0 fw-bold text-success">Team Members</h3>
            </div>

            <CreateTeamMemberForm token={token} showModal={showModal} setShowModal={setShowModal} setAlert={setAlert} />

            <div>
                <DataTable token={token} />
            </div>
        </div>
    );
}
