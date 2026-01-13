import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useFetchServiceQuestionnaireQuery, useFetchServiceQuery, useUpdateServiceMutation } from '../../../../store';
import SubmitButton from '../../../ui/SubmitButton';
import AlertDispatcher from '../../../ui/AlertDispatcher';

export default function ServiceQuestionnaireForm({ token, role, business }) {
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
    const [alert, setAlert] = useState({ type: '', message: '' });

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
                    const match = Object.entries(baseQuestions).find(([, q]) => q.text === key);
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
                message: err?.data?.detail || 'Failed to save questionnaire. Please try again.',
            });
        }
    };

    useEffect(() => {
        if (errorQ) {
            setAlert({
                type: 'danger',
                message: 'Failed to load questionnaire. Please try again later.',
            });
        }
    }, [errorQ]);

    if (loadingQ || loadingS) return <div className="text-center py-5">Loading questionnaire...</div>;
    if (!Object.keys(questions).length)
        return (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                No questions found.
            </div>
        );

    const isClient = role === 'CLIENT';

    const portalLabel =
        business?.name || (role === 'CLIENT' ? 'Client Portal' : role === 'EMPLOYEE' ? 'Employee Portal' : 'Dashboard');

    return (
        <div className="space-y-4">
            {alert.message && (
                <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: '', message: '' })}
                />
            )}

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
                    <li>
                        <Link
                            to={isClient ? '/dashboard/services' : '/dashboard/service-questionnaires'}
                            className="font-semibold text-secondary hover:text-accent"
                        >
                            {isClient ? 'Services' : 'Service Questionnaires'}
                        </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li className="font-semibold text-gray-800">{serviceName} Questionnaire</li>
                </ol>
            </nav>

            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
                <form onSubmit={isClient ? handleSubmit : undefined} className="space-y-4">
                    {Object.entries(questions).map(([key, q], index) => (
                        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4" key={key}>
                            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <label className="text-sm font-semibold text-primary">
                                    Q{index + 1}: {q.text}
                                    {q.required && ' *'}
                                </label>
                            </div>

                            <div className="space-y-2">
                                {q.type === 'input' && (
                                    <input
                                        type={q.inputType || 'text'}
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                                        value={q.answer || ''}
                                        onChange={(e) => handleChange(key, e.target.value)}
                                        required={q.required}
                                        disabled={!isClient}
                                    />
                                )}

                                {q.type === 'checkbox-single' && (
                                    <div className="flex flex-wrap gap-3">
                                        {q.options?.map((opt, i) => (
                                            <label key={i} className="flex items-center gap-2 text-sm text-gray-800">
                                                <input
                                                    className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                                                    type="radio"
                                                    name={`q_${key}`}
                                                    checked={q.answer === opt}
                                                    onChange={() => handleChange(key, opt)}
                                                    required={q.required}
                                                    disabled={!isClient}
                                                />
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {q.type === 'checkbox-multiple' && (
                                    <div className="flex flex-wrap gap-3">
                                        {q.options?.map((opt, i) => (
                                            <label key={i} className="flex items-center gap-2 text-sm text-gray-800">
                                                <input
                                                    className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
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
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {isClient && (
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                onClick={() => navigate('/dashboard/services')}
                            >
                                Cancel
                            </button>
                            <SubmitButton
                                btnName="Save Changes"
                                isLoading={saving}
                                btnClass="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentLight disabled:opacity-60"
                            />
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
