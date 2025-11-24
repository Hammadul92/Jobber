import { useState } from 'react';
import { Link } from 'react-router-dom';

import CreateServiceQuestionnairesForm from './CreateServiceQuestionnairesForm';
import ServiceQuestionnairesData from './ServiceQuestionnairesData';
import AlertDispatcher from '../../../../utils/AlertDispatcher';

export default function Questionnaires({ token, business }) {
    const [showModal, setShowModal] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });

    return (
        <div>
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
                        Service Questionnaires
                    </li>
                </ol>
            </nav>

            <div className="d-flex align-items-center justify-content-between mb-3 mt-4">
                <h3 className="mb-0 fw-bold">Service Questionnaires</h3>
                <button className="btn btn-success" onClick={() => setShowModal(true)}>
                    Add
                </button>
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
