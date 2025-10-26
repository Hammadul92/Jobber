import { useState } from 'react';
import { Link } from 'react-router-dom';

import CreateServiceQuestionnairesForm from './CreateServiceQuestionnairesForm';
import DataTable from './ServiceQuestionnairesDatatable';
import AlertDispatcher from '../../../../utils/AlertDispatcher';

export default function Questionnaires({ token }) {
    const [showModal, setShowModal] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });

    return (
        <div>
            <nav aria-label="breadcrumb mb-3">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to={`/dashboard/home`} className="text-success">
                            Dashboard
                        </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        Service Questionnaires
                    </li>
                </ol>
            </nav>

            <div className="clearfix mb-3">
                <button className="btn btn-success float-end" onClick={() => setShowModal(true)}>
                    Add
                </button>
                <h3 className="mb-0 fw-bold text-success">Service Questionnaires</h3>
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

            <DataTable token={token} setAlert={setAlert} />
        </div>
    );
}
