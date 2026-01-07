import { useState } from 'react';
import { Link } from 'react-router-dom';
import PayoutDatatable from './PayoutDatatable';
import AlertDispatcher from '../../../ui/AlertDispatcher';

export default function Payouts({ token, role, business }) {
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
                        Payouts
                    </li>
                </ol>
            </nav>

            <div className="mt-4 mb-3">
                <h3 className="mb-0">Payouts</h3>
            </div>

            {alert.message && (
                <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: '', message: '' })}
                />
            )}

            <PayoutDatatable role={role} token={token} setAlert={setAlert} />
        </>
    );
}
