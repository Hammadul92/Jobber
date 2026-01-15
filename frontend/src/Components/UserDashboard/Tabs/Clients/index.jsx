import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';

import CreateClientForm from './CreateClientForm';
import DataTable from './ClientsDatatable';
import AlertDispatcher from '../../../ui/AlertDispatcher';

export default function Clients({ token, business, role }) {
    const [showModal, setShowModal] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });

    const portalLabel = useMemo(
        () =>
            business?.name ||
            (role === 'CLIENT' ? 'Client Portal' : role === 'EMPLOYEE' ? 'Employee Portal' : 'Dashboard'),
        [business?.name, role]
    );

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
                    <li className="text-gray-700 font-semibold">Clients</li>
                </ol>
            </nav>

            <div className="mt-8 mb-7 flex flex-wrap items-start justify-between">
                <div>
                    <h3 className="text-2xl font-heading font-semibold text-primary">Clients</h3>
                    <p className="text-sm text-gray-600">Manage client profiles and their active services.</p>
                </div>
                <button
                    className="primary px-4! py-2! text-sm!"
                    onClick={() => setShowModal(true)}
                    type="button"
                >
                    Add Client
                </button>
            </div>

            <CreateClientForm showModal={showModal} setShowModal={setShowModal} setAlert={setAlert} />
            <div className="rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-sm">
                <DataTable token={token} setAlert={setAlert} showAddClient={setShowModal} />
            </div>
        </>
    );
}
