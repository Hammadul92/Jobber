import { useState } from 'react';
import { Link } from 'react-router-dom';

import CreateServiceQuestionnairesForm from './CreateServiceQuestionnairesForm';
import ServiceQuestionnairesData from './ServiceQuestionnairesData';
import AlertDispatcher from '../../../ui/AlertDispatcher';

export default function Questionnaires({ token, business, role }) {
    const [showModal, setShowModal] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });

    const portalLabel =
        business?.name || (role === 'CLIENT' ? 'Client Portal' : role === 'EMPLOYEE' ? 'Employee Portal' : 'Dashboard');

    return (
        <div className="space-y-4">
            <nav aria-label="breadcrumb" className="text-sm text-gray-600">
                <ol className="flex flex-wrap items-center gap-2">
                    <li>
                        <Link to={`/`} className="font-semibold text-accent hover:text-secondary">
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
                    <li className="text-gray-800 font-semibold">Service Questionnaires</li>
                </ol>
            </nav>

            <div className="mt-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h3 className="text-2xl font-heading font-semibold text-primary">Service Questionnaires</h3>
                        <p className="text-sm text-gray-600">
                            Create question sets for each service so clients can provide details when booking.
                        </p>
                    </div>
                    <button
                        className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentLight"
                        onClick={() => setShowModal(true)}
                    >
                        Add Questionnaire
                    </button>
                </div>
            </div>

            {alert.message && (
                <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: '', message: '' })}
                />
            )}

            <CreateServiceQuestionnairesForm
                token={token}
                showModal={showModal}
                setShowModal={setShowModal}
                setAlert={setAlert}
            />

            <ServiceQuestionnairesData token={token} setAlert={setAlert} />
        </div>
    );
}
