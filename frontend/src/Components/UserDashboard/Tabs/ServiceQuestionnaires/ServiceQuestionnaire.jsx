import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    useFetchServiceQuestionnaireQuery,
    useUpdateServiceQuestionnaireMutation,
    useFetchBusinessesQuery,
} from '../../../../store';
import SubmitButton from '../../../../utils/SubmitButton';
import AlertDispatcher from '../../../../utils/AlertDispatcher';

export default function EditServiceQuestionnairesForm({ token }) {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: questionnaireData, isLoading: loadingQ } = useFetchServiceQuestionnaireQuery(id, {
        skip: !token || !id,
    });

    const { data: businesses } = useFetchBusinessesQuery(undefined, { skip: !token });

    const [updateServiceQuestionnaire, { isLoading: saving }] = useUpdateServiceQuestionnaireMutation();

    const [serviceName, setServiceName] = useState('');
    const [questions, setQuestions] = useState([
        { text: '', type: 'input', inputType: 'text', options: [], required: true },
    ]);
    const [expandedIndex, setExpandedIndex] = useState(0);
    const [alert, setAlert] = useState(null);

    const business = businesses?.[0];
    const servicesOffered = business?.services_offered || [];

    useEffect(() => {
        if (questionnaireData) {
            setServiceName(questionnaireData.service_name || '');
            const clonedQuestions = questionnaireData.additional_questions_form?.length
                ? JSON.parse(JSON.stringify(questionnaireData.additional_questions_form))
                : [{ text: '', type: 'input', inputType: 'text', options: [], required: true }];

            setQuestions(clonedQuestions);
            setExpandedIndex(0);
        }
    }, [questionnaireData]);

    const toggleExpand = (index) => setExpandedIndex(expandedIndex === index ? null : index);

    const handleAddQuestion = () => {
        setQuestions([...questions, { text: '', type: 'input', inputType: 'text', options: [], required: true }]);
        setExpandedIndex(questions.length);
    };

    const handleRemoveQuestion = (index) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

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
        setAlert(null);

        if (!serviceName || questions.some((q) => !q.text.trim())) {
            setAlert({ type: 'danger', message: 'Please fill in all required fields.' });
            return;
        }

        try {
            await updateServiceQuestionnaire({
                id,
                service_name: serviceName,
                additional_questions_form: questions,
            }).unwrap();

            setAlert({ type: 'success', message: 'Service questionnaire updated successfully.' });
            // setTimeout(() => navigate('/dashboard/service-questionnaires'), 1200);
        } catch (err) {
            console.error('Error updating questionnaire:', err);
            setAlert({ type: 'danger', message: 'Failed to update questionnaire. Please try again.' });
        }
    };

    if (loadingQ) return <div className="text-center py-5">Loading questionnaire...</div>;

    return (
        <>
            <nav aria-label="breadcrumb mb-3">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to="/dashboard/home" className="text-success">
                            Dashboard
                        </Link>
                    </li>
                    <li className="breadcrumb-item">
                        <Link to="/dashboard/service-questionnaires" className="text-success">
                            Service Questionnaires
                        </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        Edit Service Questionnaire
                    </li>
                </ol>
            </nav>

            <h3 className="mb-4">Edit Service Questionnaire</h3>

            <div className="shadow bg-white rounded-4 p-4">
                <AlertDispatcher type={alert?.type} message={alert?.message} setAlert={setAlert} />

                <form onSubmit={handleSubmit}>
                    {/* Service Selection */}
                    <div className="row g-3 mb-3">
                        <div className="col-md-6">
                            <label className="form-label">Service Name (*)</label>
                            <select
                                className="form-select"
                                value={serviceName}
                                onChange={(e) => setServiceName(e.target.value)}
                                required
                            >
                                <option value="">Select Service</option>
                                {servicesOffered.map((service, i) => (
                                    <option key={i} value={service}>
                                        {service}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Questions Section */}
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label">Questions (*)</label>
                            <button type="button" className="btn btn-sm btn-primary" onClick={handleAddQuestion}>
                                <i className="fa fa-plus"></i> Add Question
                            </button>
                        </div>

                        <div className="accordion row" id="questionAccordion">
                            {questions.map((q, index) => (
                                <div className="col-md-6" key={index}>
                                    <div className="accordion-item">
                                        <h2 className="accordion-header" id={`heading-${index}`}>
                                            <button
                                                className={`accordion-button ${expandedIndex === index ? '' : 'collapsed'}`}
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
                                                <div className="row g-3">
                                                    <div className="col-md-8">
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

                                                    <div className="col-md-4">
                                                        <label className="form-label">Field Type</label>
                                                        <select
                                                            className="form-select"
                                                            value={q.type}
                                                            onChange={(e) =>
                                                                handleQuestionChange(index, 'type', e.target.value)
                                                            }
                                                        >
                                                            <option value="input">Input</option>
                                                            <option value="checkbox-single">Checkbox (Single)</option>
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
                                                                value={q.inputType || 'text'}
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
                                                            </div>

                                                            <button
                                                                type="button"
                                                                className="btn p-0 mt-2"
                                                                onClick={() => handleAddOption(index)}
                                                            >
                                                                <i className="fa fa-plus"></i> Add Option
                                                            </button>
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
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="d-flex justify-content-end mt-3">
                        <button
                            type="button"
                            className="btn btn-dark me-2"
                            onClick={() => navigate('/dashboard/service-questionnaires')}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <SubmitButton isLoading={saving} btnClass="btn btn-success" btnName="Save Changes" />
                    </div>
                </form>
            </div>
        </>
    );
}
