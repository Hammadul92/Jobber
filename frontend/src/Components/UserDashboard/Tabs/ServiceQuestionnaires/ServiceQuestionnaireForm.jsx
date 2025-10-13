import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useFetchServiceQuestionnaireQuery, useFetchServiceQuery, useUpdateServiceMutation } from '../../../../store';
import SubmitButton from '../../../../utils/SubmitButton';

export default function ServiceQuestionnaireForm({ token, role }) {
    const { id, serviceId } = useParams();
    const navigate = useNavigate();

    const {
        data: questionnaire,
        isLoading: loadingQ,
        error: errorQ,
    } = useFetchServiceQuestionnaireQuery(id, { skip: !token || !id });

    const { data: service, isLoading: loadingS } = useFetchServiceQuery(serviceId, {
        skip: !token || !serviceId,
    });

    const [updateService, { isLoading: saving }] = useUpdateServiceMutation();
    const [questions, setQuestions] = useState({});
    const [serviceName, setServiceName] = useState('');
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        if (questionnaire) {
            setServiceName(questionnaire.service_name || '');
            const raw = questionnaire.additional_questions_form;

            const baseQuestions = Array.isArray(raw)
                ? Object.fromEntries(raw.map((q, i) => [i, { ...q, answer: '' }]))
                : Array.isArray(raw?.questions)
                  ? Object.fromEntries(raw.questions.map((q, i) => [i, { ...q, answer: '' }]))
                  : {};

            if (service?.filled_questionnaire) {
                for (const [key, value] of Object.entries(service.filled_questionnaire)) {
                    const match = Object.entries(baseQuestions).find(([_, q]) => q.text === key);
                    if (match) {
                        const [matchKey] = match;
                        baseQuestions[matchKey].answer = value;
                    }
                }
            }

            setQuestions(baseQuestions);
        }
    }, [questionnaire, service]);

    const handleChange = (key, value) => {
        setQuestions((prev) => ({
            ...prev,
            [key]: { ...prev[key], answer: value },
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!serviceId) {
            setAlert({ type: 'danger', message: 'Missing service reference in URL.' });
            return;
        }

        const payload = {};
        for (const [, q] of Object.entries(questions)) {
            payload[q.text] =
                q.answer && ((Array.isArray(q.answer) && q.answer.length) || !Array.isArray(q.answer))
                    ? q.answer
                    : q.required
                      ? null
                      : '-';
        }

        try {
            await updateService({
                id: serviceId,
                filled_questionnaire: payload,
            }).unwrap();

            setAlert({ type: 'success', message: 'Questionnaire submitted successfully.' });
        } catch (err) {
            console.error('Failed to save questionnaire:', err);
            setAlert({
                type: 'danger',
                message: 'Failed to save questionnaire. Please try again.',
            });
        }
    };

    if (loadingQ || loadingS) return <div className="text-center py-5">Loading questionnaire...</div>;
    if (errorQ) return <div className="alert alert-danger">Failed to load questionnaire.</div>;
    if (!Object.keys(questions).length) return <div className="alert alert-warning">No questions found.</div>;

    const isClient = role === 'CLIENT';

    return (
        <div>
            <nav aria-label="breadcrumb mb-3">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to="/dashboard/home" className="text-success">
                            Dashboard
                        </Link>
                    </li>
                    <li className="breadcrumb-item">
                        <Link
                            to={isClient ? '/dashboard/services' : '/dashboard/service-questionnaires'}
                            className="text-success"
                        >
                            {isClient ? 'Services' : 'Service Questionnaires'}
                        </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        {serviceName} Questionnaire
                    </li>
                </ol>
            </nav>

            <h3 className="mb-4">{serviceName} Questionnaire</h3>

            <div className="shadow bg-white rounded-4 p-4">
                {alert && (
                    <div className={`alert alert-${alert.type} alert-dismissible`} role="alert">
                        {alert.message}
                        <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
                    </div>
                )}
                <form onSubmit={isClient ? handleSubmit : undefined}>
                    {Object.entries(questions).map(([key, q]) => (
                        <div className="row align-items-center mb-3" key={key}>
                            <label className="col-sm-4 col-form-label fw-bold">
                                {q.text}
                                {q.required && ' (*)'}
                            </label>

                            <div className="col-sm-8">
                                {q.type === 'input' && (
                                    <input
                                        type={q.inputType || 'text'}
                                        className="form-control"
                                        value={q.answer || ''}
                                        onChange={(e) => handleChange(key, e.target.value)}
                                        required={q.required}
                                        disabled={!isClient}
                                    />
                                )}

                                {q.type === 'checkbox-single' && (
                                    <div className="d-flex flex-wrap gap-3">
                                        {q.options?.map((opt, i) => (
                                            <div className="form-check form-check-inline" key={i}>
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name={`q_${key}`}
                                                    checked={q.answer === opt}
                                                    onChange={() => handleChange(key, opt)}
                                                    required={q.required}
                                                    disabled={!isClient}
                                                />
                                                <label className="form-check-label">{opt}</label>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {q.type === 'checkbox-multiple' && (
                                    <div className="d-flex flex-wrap gap-3">
                                        {q.options?.map((opt, i) => (
                                            <div className="form-check form-check-inline" key={i}>
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={q.answer?.includes(opt) || false}
                                                    onChange={(e) => {
                                                        const selected = new Set(q.answer || []);
                                                        if (e.target.checked) selected.add(opt);
                                                        else selected.delete(opt);
                                                        handleChange(key, Array.from(selected));
                                                    }}
                                                    required={q.required && !(q.answer?.length > 0)}
                                                    disabled={!isClient}
                                                />
                                                <label className="form-check-label">{opt}</label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {isClient && (
                        <div className="text-end mt-4">
                            <button
                                type="button"
                                className="btn btn-dark me-2"
                                onClick={() => navigate('/dashboard/services')}
                            >
                                Cancel
                            </button>
                            <SubmitButton btnName="Save Changes" isLoading={saving} btnClass="btn btn-success" />
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
