import { useState } from 'react';
import { Link } from 'react-router-dom';

import CreateClientForm from './CreateClientForm';
import DataTable from './ClientsDatatable';
import AlertDispatcher from '../../../../utils/AlertDispatcher';

export default function Clients({ token }) {
    const [showModal, setShowModal] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });

    return (
        <>
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
                        <Link to={`/dashboard/home`} className="text-success">
                            Dashboard
                        </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        Clients
                    </li>
                </ol>
            </nav>

            <div className="d-flex align-items-center justify-content-between mb-3 mt-4">
                <h3 className="mb-0">Clients</h3>
                <button className="btn btn-success" onClick={() => setShowModal(true)}>
                    Add
                </button>
            </div>
            <CreateClientForm showModal={showModal} setShowModal={setShowModal} setAlert={setAlert} />
            <DataTable token={token} setAlert={setAlert} />
        </>
    );
}
