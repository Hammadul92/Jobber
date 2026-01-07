import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFetchServiceQuestionnairesQuery, useDeleteServiceQuestionnaireMutation } from '../../../../store';
import SubmitButton from '../../../ui/SubmitButton';

export default function ServiceQuestionnairesData({ token, setAlert }) {
    const [questionnaires, setQuestionnaires] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    const {
        data: questionnaireData,
        isLoading,
        error,
    } = useFetchServiceQuestionnairesQuery(undefined, { skip: !token });

    const [deleteServiceQuestionnaire, { isLoading: deleting }] = useDeleteServiceQuestionnaireMutation();

    useEffect(() => {
        if (questionnaireData) {
            setQuestionnaires(Array.isArray(questionnaireData) ? questionnaireData : []);
        }
    }, [questionnaireData]);

    useEffect(() => {
        if (error) {
            setAlert({
                type: 'danger',
                message: error?.data?.detail || 'Failed to load service questionnaires.',
            });
        }
    }, [error]);

    const handleDeleteClick = (id) => {
        setSelectedId(id);
        setShowModal(true);
    };

    const confirmDelete = async (e) => {
        e.preventDefault();
        if (!selectedId) return;

        try {
            await deleteServiceQuestionnaire(selectedId).unwrap();
            setAlert({ type: 'success', message: 'Service questionnaire deleted successfully!' });
            setShowModal(false);
            setSelectedId(null);
        } catch (err) {
            setAlert({ type: 'danger', message: err?.data?.detail || 'Failed to delete service questionnaire.' });
        }
    };

    if (isLoading) return <div>Loading service questionnaires...</div>;

    return (
        <>
            <p className="text-muted">
                <i className="fa fa-info me-1"></i>
                Please create questionnaires for each service your business offers. These questionnaires will be sent to
                clients when a service is added, allowing them to provide necessary details. Note that you cannot assign
                a service to a client unless a corresponding questionnaire has been created.
            </p>
            {questionnaires.length === 0 ? (
                <div className="text-center py-5 text-muted">
                    <p className="mb-0">No service questionnaires found.</p>
                </div>
            ) : (
                <div className="row">
                    {questionnaires.map((q) => (
                        <div key={q.id} className="col-md-6 col-lg-3 mb-3">
                            <div className="card shadow-sm h-100 border">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h5 className="card-title mb-0">{q.service_name}</h5>
                                        <span
                                            className={`badge bg-gradient rounded-pill ${q.is_active ? 'bg-success' : 'bg-danger'}`}
                                        >
                                            {q.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    <p className="text-muted small">
                                        <strong>No. of questions:</strong> {q.additional_questions_form?.length || 0}
                                    </p>

                                    <div className="d-flex justify-content-end align-items-center gap-2">
                                        <Link
                                            to={`/dashboard/service-questionnaire/${q.id}`}
                                            className="btn btn-light btn-sm"
                                        >
                                            <i className="fa fa-pencil"></i> Edit
                                        </Link>

                                        <Link
                                            to={`/dashboard/service-questionnaire/${q.id}/form`}
                                            className="btn btn-light btn-sm"
                                        >
                                            <i className="far fa-file"></i> Preview
                                        </Link>

                                        <button
                                            type="button"
                                            className="btn btn-light btn-sm"
                                            onClick={() => handleDeleteClick(q.id)}
                                        >
                                            <i className="fa fa-trash-alt"></i> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showModal && (
                <form onSubmit={confirmDelete} className="modal d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Delete Service Questionnaire</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete this service questionnaire?</p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-dark"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <SubmitButton isLoading={deleting} btnClass="btn btn-sm btn-danger" btnName="Delete" />
                            </div>
                        </div>
                    </div>
                </form>
            )}

            {showModal && <div className="modal-backdrop fade show"></div>}
        </>
    );
}
