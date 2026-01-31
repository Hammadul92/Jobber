import { useState } from 'react';
import { Link } from 'react-router-dom';
import PayoutDatatable from './PayoutDatatable';
import AlertDispatcher from '../../../ui/AlertDispatcher';

export default function Payouts({ token, role, business }) {
    const [alert, setAlert] = useState({ type: '', message: '' });

    return (
        <>
            <nav aria-label="breadcrumb" className="mb-4">
                <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <li>
                        <Link to={`/`} className="font-semibold text-accent">
                            Contractorz
                        </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li>
                        <Link to="/dashboard/home" className="font-semibold text-secondary hover:text-accent">
                            {business?.name ||
                                (role === 'CLIENT'
                                    ? 'Client Portal'
                                    : role === 'EMPLOYEE'
                                        ? 'Employee Portal'
                                        : 'Dashboard')}
                        </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li className="font-semibold text-gray-800">Payouts</li>
                </ol>
            </nav>

            <div className="mb-5 mt-16 md:mt-8">
                <h3 className="text-xl md:text-2xl font-semibold font-heading text-gray-900">Payouts</h3>
                <p className="text-sm text-gray-500">Track processed payouts and manage refunds.</p>
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
