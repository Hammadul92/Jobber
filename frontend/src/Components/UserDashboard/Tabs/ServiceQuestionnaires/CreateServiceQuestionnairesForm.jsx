import { useState } from 'react';
import {
    useFetchServiceQuestionnairesQuery,
    useCreateServiceQuestionnaireMutation,
    useFetchBusinessesQuery,
} from '../../../../store';
import SubmitButton from '../../../ui/SubmitButton';
import Select from '../../../ui/Select';

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

    const {
        data: questionnaireData,
        isLoading,
        error,
    } = useFetchServiceQuestionnairesQuery(undefined, { skip: !token });

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
        <>
            <div className="modal d-block" tabIndex="-1" role="dialog">
                <div className="modal-dialog modal-lg" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title fw-bold">Create Service Questionnaire</h5>
                            <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {/* Service selection */}
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <Select
                                            id="service_name"
                                            label={'Service Name'}
                                            value={serviceName}
                                            onChange={setServiceName}
                                            isRequired={true}
                                            options={servicesOffered
                                                .filter(
                                                    (service) =>
                                                        !questionnaireData.find((q) => q.service_name === service)
                                                )
                                                .map((service) => ({ value: service, label: service }))}
                                        />
                                    </div>
                                </div>

                                {/* Questions Section */}
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="form-label fw-bold">
                                        Questions <sup className="text-danger small">(*)</sup>
                                    </label>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-primary"
                                        onClick={handleAddQuestion}
                                    >
                                        <i className="fa fa-plus"></i> Add Question
                                    </button>
                                </div>

                                <div className="accordion" id="questionAccordion">
                                    {questions.map((q, index) => (
                                        <div className="accordion-item" key={index}>
                                            <h2 className="accordion-header" id={`heading-${index}`}>
                                                <button
                                                    className={`accordion-button ${
                                                        expandedIndex === index ? '' : 'collapsed'
                                                    }`}
                                                    type="button"
                                                    onClick={() => toggleExpand(index)}
                                                >
                                                    <span className="me-2 fw-semibold">Q{index + 1}:</span>
                                                    {q.text ? q.text.slice(0, 60) : 'New Question'}
                                                </button>
                                            </h2>

                                            <div
                                                id={`collapse-${index}`}
                                                className={`accordion-collapse collapse ${
                                                    expandedIndex === index ? 'show' : ''
                                                }`}
                                            >
                                                <div className="accordion-body">
                                                    <div className="row">
                                                        <div className="col-md-8 mb-3">
                                                            <label className="form-label">Question Text</label>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                value={q.text}
                                                                onChange={(e) =>
                                                                    handleQuestionChange(index, 'text', e.target.value)
                                                                }
                                                                required
                                                            />
                                                        </div>

                                                        <div className="col-md-4 mb-3">
                                                            <label className="form-label">Field Type</label>
                                                            <select
                                                                className="form-select"
                                                                value={q.type}
                                                                onChange={(e) =>
                                                                    handleQuestionChange(index, 'type', e.target.value)
                                                                }
                                                            >
                                                                <option value="input">Input</option>
                                                                <option value="checkbox-single">
                                                                    Checkbox (Single)
                                                                </option>
                                                                <option value="checkbox-multiple">
                                                                    Checkbox (Multiple)
                                                                </option>
                                                            </select>
                                                        </div>

                                                        {q.type === 'input' && (
                                                            <div className="col-md-4">
                                                                <label className="form-label">Input Type</label>
                                                                <select
                                                                    className="form-select"
                                                                    value={q.inputType}
                                                                    onChange={(e) =>
                                                                        handleQuestionChange(
                                                                            index,
                                                                            'inputType',
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                >
                                                                    <option value="text">Text</option>
                                                                    <option value="number">Number</option>
                                                                </select>
                                                            </div>
                                                        )}

                                                        <div className="col-md-3 d-flex align-items-end">
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={q.required}
                                                                    onChange={(e) =>
                                                                        handleQuestionChange(
                                                                            index,
                                                                            'required',
                                                                            e.target.checked
                                                                        )
                                                                    }
                                                                />
                                                                <label className="form-check-label">Required</label>
                                                            </div>
                                                        </div>

                                                        {(q.type === 'checkbox-single' ||
                                                            q.type === 'checkbox-multiple') && (
                                                            <div className="col-md-12 mt-2">
                                                                <label className="form-label">Options</label>
                                                                <div className="row g-2">
                                                                    {q.options.map((opt, optIndex) => (
                                                                        <div
                                                                            key={optIndex}
                                                                            className="col-md-4 d-flex align-items-center"
                                                                        >
                                                                            <div className="input-group">
                                                                                <input
                                                                                    type="text"
                                                                                    className="form-control form-control-sm"
                                                                                    placeholder={`Option ${optIndex + 1}`}
                                                                                    value={opt}
                                                                                    onChange={(e) =>
                                                                                        handleOptionChange(
                                                                                            index,
                                                                                            optIndex,
                                                                                            e.target.value
                                                                                        )
                                                                                    }
                                                                                    required
                                                                                />
                                                                                {q.options.length > 1 && (
                                                                                    <button
                                                                                        type="button"
                                                                                        className="btn btn-sm btn-light border"
                                                                                        onClick={() =>
                                                                                            handleRemoveOption(
                                                                                                index,
                                                                                                optIndex
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <i className="fa fa-trash-alt"></i>
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    <div className="col">
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-sm btn-primary"
                                                                            onClick={() => handleAddOption(index)}
                                                                        >
                                                                            <i className="fa fa-plus"></i>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="d-flex justify-content-end mt-2">
                                                        {questions.length > 1 && (
                                                            <button
                                                                type="button"
                                                                className="btn p-0"
                                                                onClick={() => handleRemoveQuestion(index)}
                                                            >
                                                                <i className="fa fa-trash-alt fs-5"></i>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-dark"
                                    onClick={() => setShowModal(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <SubmitButton
                                    isLoading={isSubmitting}
                                    btnClass="btn btn-sm btn-success"
                                    btnName="Create"
                                />
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="modal-backdrop fade show"></div>
        </>
    );
}
