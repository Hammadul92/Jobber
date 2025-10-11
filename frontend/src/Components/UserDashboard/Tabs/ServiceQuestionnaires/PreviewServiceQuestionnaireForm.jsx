import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFetchServiceQuestionnaireQuery } from '../../../../store';

export default function PreviewServiceQuestionnaireForm({ token }) {
    const { id } = useParams();
    const {
        data: questionnaire,
        isLoading,
        error,
    } = useFetchServiceQuestionnaireQuery(id, {
        skip: !token || !id,
    });

    const [questions, setQuestions] = useState([]);
    const [serviceName, setServiceName] = useState('');

    useEffect(() => {
        if (questionnaire) {
            setServiceName(questionnaire.service_name || '');
            const raw = questionnaire.additional_questions_form;

            if (Array.isArray(raw)) {
                setQuestions(raw);
            } else if (raw && Array.isArray(raw.questions)) {
                setQuestions(raw.questions);
            } else {
                setQuestions([]);
            }
        }
    }, [questionnaire]);

    if (isLoading) {
        return <div className="text-center py-5">Loading preview...</div>;
    }

    if (error) {
        return <div className="alert alert-danger">Failed to load questionnaire preview.</div>;
    }

    if (!questions.length) {
        return <div className="alert alert-warning">No additional questions found for this questionnaire.</div>;
    }

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
                        <Link to={`/dashboard/service-questionnaires`} className="text-success">
                            Service Questionnaires
                        </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        {serviceName} Questionnaire
                    </li>
                </ol>
            </nav>
            <h3 className="mb-4">{serviceName} Questionnaire</h3>

            <div className="shadow bg-white rounded-4">
                <div className="p-3">
                    <form>
                        {questions.map((q, index) => (
                            <div className="mb-4" key={index}>
                                {q.type === 'input' ? (
                                    <div className="d-flex align-items-center gap-3">
                                        <label className="form-label mb-0">
                                            {q.text}
                                            {q.required && ' (*)'}
                                        </label>
                                        <input
                                            type={q.inputType || 'text'}
                                            className="form-control w-auto flex-grow-1"
                                            disabled
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <label className="form-label">
                                            {q.text}
                                            {q.required && ' (*)'}
                                        </label>

                                        {q.type === 'checkbox-single' && (
                                            <div className="mt-2">
                                                {q.options?.map((opt, i) => (
                                                    <div className="form-check" key={i}>
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name={`q_${index}`}
                                                            disabled
                                                        />
                                                        <label className="form-check-label">{opt}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {q.type === 'checkbox-multiple' && (
                                            <div className="mt-2">
                                                {q.options?.map((opt, i) => (
                                                    <div className="form-check" key={i}>
                                                        <input className="form-check-input" type="checkbox" disabled />
                                                        <label className="form-check-label">{opt}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </form>
                </div>
            </div>
        </div>
    );
}
