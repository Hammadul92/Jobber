import { useState } from 'react';
import { Link } from 'react-router-dom';

import CreateQuoteForm from './CreateQuoteForm';
import DataTable from './QuotesDatatable';
import AlertDispatcher from '../../../../utils/AlertDispatcher';

export default function Quotes({ token, role }) {
    const [showModal, setShowModal] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });

    return (
        <>
            <nav aria-label="breadcrumb mb-3">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to={`/dashboard/home`} className="text-success">
                            Dashboard
                        </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        Quotes
                    </li>
                </ol>
            </nav>

            <div className="clearfix mb-3">
                {role === 'MANAGER' && (
                    <button className="btn btn-success float-end" onClick={() => setShowModal(true)}>
                        Add
                    </button>
                )}
                <h3 className="mb-0 fw-bold text-success">Quotes</h3>
            </div>

            {alert.message && (
                <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: '', message: '' })}
                />
            )}

            {role === 'MANAGER' && (
                <CreateQuoteForm token={token} showModal={showModal} setShowModal={setShowModal} setAlert={setAlert} />
            )}

            <div>
                <DataTable token={token} role={role} setAlert={setAlert} />
            </div>
        </>
    );
}
