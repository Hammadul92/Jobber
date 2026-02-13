import { useState } from 'react';
import {
    useFetchServiceQuestionnairesQuery,
    useCreateServiceQuestionnaireMutation,
    useFetchBusinessesQuery,
} from '../../../../store';
import SubmitButton from '../../../ui/SubmitButton';
import Select from '../../../ui/Select';
import { CgClose } from 'react-icons/cg'

export default function CreateServiceQuestionnairesForm({ token, showModal, setShowModal, setAlert }) {
    const [serviceName, setServiceName] = useState('');
    const [questions, setQuestions] = useState([
        { text: '', type: 'input', inputType: 'text', options: [], required: true },
    ]);
    const [expandedIndex, setExpandedIndex] = useState(0);

    const [createServiceQuestionnaire, { isLoading: isCreating }] = useCreateServiceQuestionnaireMutation();
    const { data: businesses } = useFetchBusinessesQuery(undefined, { skip: !token });

    const business = businesses?.[0];
    const servicesOffered = business?.services_offered || [];
    const isSubmitting = isCreating;

    const { data: questionnaireData } = useFetchServiceQuestionnairesQuery(undefined, { skip: !token });

    const existingQuestionnaires = Array.isArray(questionnaireData) ? questionnaireData : [];

    const toggleExpand = (index) => setExpandedIndex(expandedIndex === index ? null : index);

    const handleAddQuestion = () => {
        setQuestions([...questions, { text: '', type: 'input', inputType: 'text', options: [], required: true }]);
        setExpandedIndex(questions.length);
    };

    const handleRemoveQuestion = (index) => setQuestions(questions.filter((_, i) => i !== index));

    const handleQuestionChange = (index, key, value) => {
        const updated = [...questions];
        updated[index][key] = value;

        if (key === 'type') {
            if (value.startsWith('checkbox')) updated[index].options = [''];
            else if (value === 'input') updated[index].options = [];
        }

        setQuestions(updated);
    };

    const handleOptionChange = (qIndex, optIndex, value) => {
        const updated = [...questions];
        updated[qIndex].options[optIndex] = value;
        setQuestions(updated);
    };

    const handleAddOption = (qIndex) => {
        const updated = [...questions];
        updated[qIndex].options.push('');
        setQuestions(updated);
    };

    const handleRemoveOption = (qIndex, optIndex) => {
        const updated = [...questions];
        updated[qIndex].options.splice(optIndex, 1);
        setQuestions(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!serviceName || questions.some((q) => !q.text.trim())) {
            setAlert?.({ type: 'danger', message: 'Please fill in all required fields.' });
            return;
        }

        try {
            const businessId = business?.id;
            if (!businessId) throw new Error('No business found for the current user.');

            await createServiceQuestionnaire({
                business: businessId,
                service_name: serviceName,
                additional_questions_form: questions,
            }).unwrap();

            setAlert?.({ type: 'success', message: 'Service questionnaire created successfully.' });
            setServiceName('');
            setQuestions([{ text: '', type: 'input', inputType: 'text', options: [], required: true }]);
        } catch (err) {
            console.error('Error creating questionnaire:', err);
            setAlert?.({ type: 'danger', message: 'Something went wrong. Please try again.' });
        }

        setShowModal(false);
    };

    if (!showModal) return null;

    return (
        <div className="fixed inset-0 z-50 h-screen flex items-center justify-center bg-black/50 px-3" onClick={() => setShowModal(false)}>
            <div
                className="max-w-4xl rounded-2xl bg-white shadow-xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between bg-secondary rounded-t-2xl border-b border-gray-200 p-6">
                    <div>
                        <h5 className="text-xl font-semibold font-heading text-white">Create Service Questionnaire</h5>
                        <p className="text-xs font-medium uppercase tracking-[0.08em] text-gray-100">Questionnaire</p>
                    </div>
                    <button
                        type="button"
                        className="text-gray-200 transition hover:text-gray-400"
                        onClick={() => setShowModal(false)}
                        aria-label="Close"
                    >
                        <CgClose className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 px-6 py-5 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Select
                                id="service_name"
                                label={'Service Name'}
                                value={serviceName}
                                onChange={setServiceName}
                                isRequired={true}
                                options={servicesOffered
                                    .filter((service) => !existingQuestionnaires.find((q) => q.service_name === service))
                                    .map((service) => ({ value: service, label: service }))}
                            />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <label className="text-sm font-semibold text-gray-800">
                                Questions <sup className="text-red-500">*</sup>
                            </label>
                            <button
                                type="button"
                                className="inline-flex items-center rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-accentLight"
                                onClick={handleAddQuestion}
                            >
                                + Add Question
                            </button>
                        </div>

                        <div className="space-y-3">
                            {questions.map((q, index) => (
                                <div key={index} className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                                    <button
                                        type="button"
                                        className="flex w-full items-center justify-between text-left text-sm font-semibold text-primary"
                                        onClick={() => toggleExpand(index)}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span className="text-gray-500">Q{index + 1}:</span>
                                            {q.text ? q.text.slice(0, 60) : 'New Question'}
                                        </span>
                                        <span className="text-gray-500">{expandedIndex === index ? '−' : '+'}</span>
                                    </button>

                                    {expandedIndex === index && (
                                        <div className="mt-3 space-y-3 rounded-lg bg-white p-3">
                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                                <div className="md:col-span-2">
                                                    <label className="mb-1 block text-sm font-semibold text-gray-800">Question Text</label>
                                                    <input
                                                        type="text"
                                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                                                        value={q.text}
                                                        onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-semibold text-gray-800">Field Type</label>
                                                    <select
                                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                                                        value={q.type}
                                                        onChange={(e) => handleQuestionChange(index, 'type', e.target.value)}
                                                    >
                                                        <option value="input">Input</option>
                                                        <option value="checkbox-single">Checkbox (Single)</option>
                                                        <option value="checkbox-multiple">Checkbox (Multiple)</option>
                                                    </select>
                                                </div>

                                                {q.type === 'input' && (
                                                    <div>
                                                        <label className="mb-1 block text-sm font-semibold text-gray-800">Input Type</label>
                                                        <select
                                                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                                                            value={q.inputType}
                                                            onChange={(e) => handleQuestionChange(index, 'inputType', e.target.value)}
                                                        >
                                                            <option value="text">Text</option>
                                                            <option value="number">Number</option>
                                                        </select>
                                                    </div>
                                                )}

                                                <div className="flex items-end">
                                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                                                            checked={q.required}
                                                            onChange={(e) => handleQuestionChange(index, 'required', e.target.checked)}
                                                        />
                                                        Required
                                                    </label>
                                                </div>
                                            </div>

                                            {(q.type === 'checkbox-single' || q.type === 'checkbox-multiple') && (
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-gray-800">Options</label>
                                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                                        {q.options.map((opt, optIndex) => (
                                                            <div key={optIndex} className="flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                                                                    placeholder={`Option ${optIndex + 1}`}
                                                                    value={opt}
                                                                    onChange={(e) => handleOptionChange(index, optIndex, e.target.value)}
                                                                    required
                                                                />
                                                                {q.options.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        className="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-600 transition hover:bg-gray-50"
                                                                        onClick={() => handleRemoveOption(index, optIndex)}
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                                            onClick={() => handleAddOption(index)}
                                                        >
                                                            Add option
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex justify-end">
                                                {questions.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="text-sm font-semibold text-red-600 transition hover:text-red-700"
                                                        onClick={() => handleRemoveQuestion(index)}
                                                    >
                                                        Remove question
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
                        <button
                            type="button"
                            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                            onClick={() => setShowModal(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <SubmitButton
                            isLoading={isSubmitting}
                            btnClass="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentLight disabled:opacity-60"
                            btnName="Create"
                        />
                    </div>
                </form>
            </div>
        </div>
    );
}
