import { useState } from 'react';
import { Link } from 'react-router-dom';
import CreateJobForm from './CreateJobForm';
import JobData from './JobData';
import AlertDispatcher from '../../../ui/AlertDispatcher';

export default function Jobs({ token, role, business }) {
    const [showModal, setShowModal] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });

    return (
        <>
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
                            {business?.name ||
                                (role === 'CLIENT'
                                    ? 'Client Portal'
                                    : role === 'EMPLOYEE'
                                      ? 'Employee Portal'
                                      : 'Dashboard')}
                        </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li className="font-semibold text-gray-800">Jobs</li>
                </ol>
            </nav>

            <div className="mb-5 mt-2 flex items-center justify-between gap-3">
                <h3 className="text-2xl font-semibold text-primary">Jobs</h3>
                {role === 'MANAGER' && (
                    <button
                        className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentLight"
                        onClick={() => setShowModal(true)}
                        type="button"
                    >
                        Add Job
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
                <CreateJobForm token={token} showModal={showModal} setShowModal={setShowModal} setAlert={setAlert} />
            )}

            <JobData role={role} token={token} setAlert={setAlert} />
        </>
    );
}
