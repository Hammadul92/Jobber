import { useState } from 'react';
import { Link } from 'react-router-dom';

import CreateServiceQuestionnairesForm from './CreateServiceQuestionnairesForm';
import DataTable from './ServiceQuestionnairesDatatable';

export default function Questionnaires({ token }) {
    const [showModal, setShowModal] = useState(false);

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
                    Add Questionnaire
                </button>
                <h3 className="mb-0">Questionnaires</h3>
            </div>

            <CreateServiceQuestionnairesForm token={token} showModal={showModal} setShowModal={setShowModal} />
            <DataTable token={token} />
        </div>
    );
}
