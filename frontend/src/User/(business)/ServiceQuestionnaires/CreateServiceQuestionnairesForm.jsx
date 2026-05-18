import { useState, useEffect } from "react";
import {
  useFetchServiceQuestionnairesQuery,
  useCreateServiceQuestionnaireMutation,
  useFetchBusinessesQuery,
  useUpdateServiceQuestionnaireMutation,
} from "../../../store";
import SubmitButton from "../../../Components/ui/SubmitButton";
import Input from "../../../Components/ui/Input";
import Dropdown from "../../../Components/ui/Dropdown";
import { CgClose } from "react-icons/cg";
import { LuPlus } from "react-icons/lu";

export default function CreateServiceQuestionnairesForm({
  token,
  showModal,
  setShowModal,
  setAlert,
  initialData = null,
  mode = "create",
  setInitialData = () => {},
}) {
  const [serviceName, setServiceName] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [questions, setQuestions] = useState([
    { text: "", type: "input", inputType: "text", options: [], required: true },
  ]);

  const [createServiceQuestionnaire, { isLoading: isCreating }] =
    useCreateServiceQuestionnaireMutation();
  const [updateServiceQuestionnaire, { isLoading: isUpdating }] =
    useUpdateServiceQuestionnaireMutation();
  const { data: businesses } = useFetchBusinessesQuery(undefined, {
    skip: !token,
  });

  const business = businesses?.[0];
  const servicesOffered = business?.services_offered || [];
  const isSubmitting = isCreating || isUpdating;

  const { data: questionnaireData } = useFetchServiceQuestionnairesQuery(
    undefined,
    { skip: !token },
  );

  const existingQuestionnaires = Array.isArray(questionnaireData)
    ? questionnaireData
    : [];

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: "",
        type: "input",
        inputType: "text",
        options: [],
        required: true,
      },
    ]);
  };

  const handleRemoveQuestion = (index) =>
    setQuestions(questions.filter((_, i) => i !== index));

  const handleQuestionChange = (index, key, value) => {
    const updated = [...questions];
    updated[index][key] = value;

    if (key === "type") {
      if (value.startsWith("checkbox")) updated[index].options = [""];
      else if (value === "input") updated[index].options = [];
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
    updated[qIndex].options.push("");
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
      setAlert?.({
        type: "danger",
        message: "Please fill in all required fields.",
      });
      return;
    }

    try {
      const businessId = business?.id;
      if (!businessId)
        throw new Error("No business found for the current user.");

      if (mode === "edit" && initialData?.id) {
        await updateServiceQuestionnaire({
          id: initialData.id,
          service_name: serviceName,
          is_active: isActive,
          additional_questions_form: questions,
        }).unwrap();

        setAlert?.({
          type: "success",
          message: "Service questionnaire updated successfully.",
        });

        // clear edit state
        setInitialData(null);
        setShowModal(false);
        return;
      }

      await createServiceQuestionnaire({
        business: businessId,
        service_name: serviceName,
        is_active: isActive,
        additional_questions_form: questions,
      }).unwrap();

      setAlert?.({
        type: "success",
        message: "Service questionnaire created successfully.",
      });

      setServiceName("");
      setIsActive(true);
      setQuestions([
        {
          text: "",
          type: "input",
          inputType: "text",
          options: [],
          required: true,
        },
      ]);
      setShowModal(false);
    } catch (err) {
      console.error("Error creating/updating questionnaire:", err);
      setAlert?.({
        type: "danger",
        message: "Something went wrong. Please try again.",
      });
    }
  };

  // populate form when editing, clear when creating or modal closes
  useEffect(() => {
    if (mode === "edit" && initialData && showModal) {
      setServiceName(initialData.service_name || "");
      setIsActive(initialData.is_active ?? true);
      setQuestions(
        Array.isArray(initialData.additional_questions_form) &&
          initialData.additional_questions_form.length
          ? JSON.parse(JSON.stringify(initialData.additional_questions_form))
          : [
              {
                text: "",
                type: "input",
                inputType: "text",
                options: [],
                required: true,
              },
            ],
      );
    } else if (mode === "create" && showModal && !initialData) {
      // Clear form when opening in create mode
      setServiceName("");
      setIsActive(true);
      setQuestions([
        {
          text: "",
          type: "input",
          inputType: "text",
          options: [],
          required: true,
        },
      ]);
    } else if (!showModal) {
      // Clear form when modal closes
      setServiceName("");
      setIsActive(true);
      setQuestions([
        {
          text: "",
          type: "input",
          inputType: "text",
          options: [],
          required: true,
        },
      ]);
    }
  }, [initialData, mode, showModal]);

  if (!showModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 h-screen flex items-start justify-end bg-black/50 px-3"
      onClick={() => setShowModal(false)}
    >
      <div
        className="absolute right-0 top-0 z-10 h-screen w-full md:w-4/6 lg:w-2/6 overflow-hidden border-l border-gray-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <div className="border-b border-gray-100 px-6 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h5 className="text-2xl font-semibold text-slate-800">
                  Create Service Questionnaire
                </h5>
                <p className="mt-1 text-sm text-slate-500">
                  Create question sets for each service so clients can provide
                  details when booking.
                </p>
              </div>
              <button
                type="button"
                className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                <CgClose className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
              <span>
                Create questionnaires for each service. Clients complete these
                when booking.
              </span>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="mb-1 block text-sm uppercase font-semibold text-gray-500">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  id="service_name"
                  value={serviceName}
                  onChange={setServiceName}
                  disabled={mode === "edit"}
                  options={servicesOffered
                    .filter((service) =>
                      mode === "edit"
                        ? true
                        : !existingQuestionnaires.find(
                            (q) => q.service_name === service,
                          ),
                    )
                    .map((service) => ({ label: service, value: service }))}
                  buttonClassName="h-11 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm uppercase font-semibold text-gray-500">
                  Status <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  id="is_active"
                  value={isActive ? "active" : "inactive"}
                  onChange={(value) => setIsActive(value === "active")}
                  options={[
                    { label: "Active", value: "active" },
                    { label: "In Active", value: "inactive" },
                  ]}
                  buttonClassName="h-11 text-sm"
                />
              </div>

              {/* Optional fields right now, without backend support (for future implementation) */}
              {/* <div>
                                <label className="mb-1 block text-sm uppercase font-semibold text-gray-500">Instructions</label>
                                <Textarea id="instructions" value={instructions} onChange={setInstructions} rows={3} placeholder="Optional instructions clients will see" fieldClass="text-sm" />
                            </div>

                            <div className="-mt-8">
                                <PhoneInputField value={contactPhone} setValue={setContactPhone} optional={true} />
                            </div> */}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <h6 className="tracking-wider font-semibold text-secondary">
                Questions
              </h6>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-accentLight"
                onClick={handleAddQuestion}
              >
                <LuPlus className="h-4 w-4" /> Add Question
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {questions.map((q, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text- font-semibold text-gray-700">
                        Q{index + 1}
                      </div>
                      <div className="text- text-gray-600">
                        {q.text || "New Question"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-sm font-medium text-accent underline disabled:text-gray-400 disabled:cursor-not-allowed!"
                        onClick={() => handleRemoveQuestion(index)}
                        disabled={questions.length <= 1}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-3 rounded-lg bg-white py-3">
                    <Input
                      id={`question-text-${index}`}
                      label="Question Text"
                      value={q.text}
                      onChange={(val) =>
                        handleQuestionChange(index, "text", val)
                      }
                      isRequired
                      fieldClass="w-full"
                    />

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm uppercase font-semibold text-gray-500">
                          Field Type
                        </label>
                        <Dropdown
                          id={`question-type-${index}`}
                          value={q.type}
                          onChange={(val) =>
                            handleQuestionChange(index, "type", val)
                          }
                          options={[
                            { label: "Input", value: "input" },
                            {
                              label: "Checkbox (Single)",
                              value: "checkbox-single",
                            },
                            {
                              label: "Checkbox (Multiple)",
                              value: "checkbox-multiple",
                            },
                          ]}
                          buttonClassName="h-11 text-sm"
                        />
                      </div>

                      {q.type === "input" && (
                        <div>
                          <label className="mb-1 block text-sm uppercase font-semibold text-gray-500">
                            Input Type
                          </label>
                          <Dropdown
                            id={`input-type-${index}`}
                            value={q.inputType}
                            onChange={(val) =>
                              handleQuestionChange(index, "inputType", val)
                            }
                            options={[
                              { label: "Text", value: "text" },
                              { label: "Number", value: "number" },
                            ]}
                            buttonClassName="h-11 text-sm"
                          />
                        </div>
                      )}

                      <div className="flex items-end">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                            checked={q.required}
                            onChange={(e) =>
                              handleQuestionChange(
                                index,
                                "required",
                                e.target.checked,
                              )
                            }
                          />{" "}
                          Required
                        </label>
                      </div>
                    </div>

                    {(q.type === "checkbox-single" ||
                      q.type === "checkbox-multiple") && (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Options
                        </label>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                          {q.options.map((opt, optIndex) => (
                            <div
                              key={optIndex}
                              className="flex items-center gap-2"
                            >
                              <Input
                                id={`option-${index}-${optIndex}`}
                                value={opt}
                                onChange={(val) =>
                                  handleOptionChange(index, optIndex, val)
                                }
                                placeholder={`Option ${optIndex + 1}`}
                                fieldClass="h-10 text-sm"
                              />
                              {q.options.length > 1 && (
                                <button
                                  type="button"
                                  className="mb-6 rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-600 transition hover:bg-gray-50"
                                  onClick={() =>
                                    handleRemoveOption(index, optIndex)
                                  }
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}

                          <button
                            type="button"
                            className="h-fit w-fit rounded-lg border border-dashed border-accent px-6 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                            onClick={() => handleAddOption(index)}
                          >
                            Add option
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 bg-white px-6 py-4 shrink-0">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <SubmitButton
                isLoading={isSubmitting}
                btnClass="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accentLight"
                btnName={mode === "edit" ? "Save Changes" : "Create"}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
