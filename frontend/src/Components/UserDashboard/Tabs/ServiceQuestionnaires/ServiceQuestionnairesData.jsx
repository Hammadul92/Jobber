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
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                <div className="flex items-start gap-2">
                    <span className="text-xl text-secondary border border-blue-200 bg-blue-100 rounded-full px-2.5">ℹ</span>
                    <p className='mt-1.5'>
                        Create questionnaires for each service. Clients complete these when a service is added, so you
                        get the details needed. Services cannot be assigned without a questionnaire.
                    </p>
                </div>
            </div>

            {questionnaires.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-gray-600 shadow-sm">
                    <p className="mb-0">No service questionnaires found.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {questionnaires.map((q) => (
                        <div key={q.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h5 className="text-lg font-semibold text-primary">{q.service_name}</h5>
                                    <p className="text-xs text-gray-500">
                                        Questions: {q.additional_questions_form?.length || 0}
                                    </p>
                                </div>
                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${q.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                >
                                    {q.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="mt-4 flex flex-wrap justify-end gap-2">
                                <Link
                                    to={`/dashboard/service-questionnaire/${q.id}`}
                                    className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                                >
                                    Edit
                                </Link>

                                <Link
                                    to={`/dashboard/service-questionnaire/${q.id}/form`}
                                    className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                                >
                                    Preview
                                </Link>

                                <button
                                    type="button"
                                    className="inline-flex items-center rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                                    onClick={() => handleDeleteClick(q.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
                    <form onSubmit={confirmDelete} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
                        <div className="flex items-start justify-between">
                            <h5 className="text-lg font-semibold text-primary">Delete Service Questionnaire</h5>
                            <button
                                type="button"
                                className="text-gray-500 transition hover:text-gray-700"
                                onClick={() => setShowModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <p className="mt-3 text-sm text-gray-700">
                            Are you sure you want to delete this service questionnaire?
                        </p>
                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                type="button"
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <SubmitButton
                                isLoading={deleting}
                                btnClass="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                                btnName="Delete"
                            />
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
