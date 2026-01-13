import { useState } from 'react';
import { Link } from 'react-router-dom';
import CreateInvoiceForm from './CreateInvoiceForm';
import InvoiceDatatable from './InvoiceDatatable';
import AlertDispatcher from '../../../ui/AlertDispatcher';

export default function Invoices({ token, role, business }) {
    const [showModal, setShowModal] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });

    return (
        <>
            <nav aria-label="breadcrumb" className="mb-4">
                <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <li>
                        <Link to={`/`} className="font-semibold text-secondary hover:text-accent">
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
                    <li className="font-semibold text-gray-800">Invoices</li>
                </ol>
            </nav>

            <div className="mb-5 mt-8 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-2xl font-heading font-semibold text-gray-900">Invoices</h3>
                    <p className="text-sm text-gray-500">Manage billing, due dates, and payments.</p>
                </div>
                {role === 'MANAGER' && (
                    <button
                        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentLight"
                        onClick={() => setShowModal(true)}
                    >
                        Add Invoice
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
                <CreateInvoiceForm
                    token={token}
                    showModal={showModal}
                    setShowModal={setShowModal}
                    setAlert={setAlert}
                    business={business}
                />
            )}

            <InvoiceDatatable role={role} token={token} setAlert={setAlert} />
        </>
    );
}
