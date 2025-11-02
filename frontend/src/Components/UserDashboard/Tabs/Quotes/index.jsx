import { useState } from 'react';
import { Link } from 'react-router-dom';

import CreateQuoteForm from './CreateQuoteForm';
import AlertDispatcher from '../../../../utils/AlertDispatcher';
import QuotesData from './QuotesData';

export default function Quotes({ token, role, business }) {
    const [showModal, setShowModal] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });

    return (
        <>
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
                        Quotes
                    </li>
                </ol>
            </nav>

            <div className="d-flex align-items-center justify-content-between mb-3 mt-4">
                <h3 className="mb-0 fw-bold">Quotes</h3>
                {role === 'MANAGER' && (
                    <button className="btn btn-success float-end" onClick={() => setShowModal(true)}>
                        Add
                    </button>
                )}
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
                <QuotesData token={token} role={role} setAlert={setAlert} />
            </div>
        </>
    );
}
