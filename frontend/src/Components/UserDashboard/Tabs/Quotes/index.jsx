import { useState } from 'react';
import { Link } from 'react-router-dom';

import CreateQuoteForm from './CreateQuoteForm';
import AlertDispatcher from '../../../ui/AlertDispatcher';
import QuotesData from './QuotesData';

export default function Quotes({ token, role, business }) {
    const [showModal, setShowModal] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });

    const portalLabel =
        business?.name ||
        (role === 'CLIENT' ? 'Client Portal' : role === 'EMPLOYEE' ? 'Employee Portal' : 'Dashboard');

    return (
        <>
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
                    <li className="text-gray-700 font-semibold">Quotes</li>
                </ol>
            </nav>

            <div className="flex flex-wrap items-start justify-between mt-16 md:mt-8 mb-5 gap-y-2">
                <div>
                    <h3 className="text-xl md:text-2xl font-heading font-semibold text-primary">Quotes</h3>
                    <p className="text-sm text-gray-600">Manage your staff access, duties, and expertise.</p>
                </div>
                <button
                    className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accentLight"
                    onClick={() => setShowModal(true)}
                    type="button"
                >
                    Add Quote
                </button>
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

            <div >
                <QuotesData token={token} role={role} setAlert={setAlert} />
            </div>
        </>
    );
}
