import { useState, useEffect } from "react";
import {
  useFetchServiceQuestionnairesQuery,
  useDeleteServiceQuestionnaireMutation,
} from "../../../store";
import SubmitButton from "../../../Components/ui/SubmitButton";
import {
  LuCircleAlert,
  LuCircleDashed,
  LuEye,
  LuInfo,
  LuPencilLine,
  LuTrash2,
} from "react-icons/lu";
import { CgClose } from "react-icons/cg";

export default function ServiceQuestionnairesData({ token, setAlert, onEdit }) {
  const [questionnaires, setQuestionnaires] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [previewQuestionnaire, setPreviewQuestionnaire] = useState(null);

  const {
    data: questionnaireData,
    isLoading,
    error,
  } = useFetchServiceQuestionnairesQuery(undefined, { skip: !token });

  const [deleteServiceQuestionnaire, { isLoading: deleting }] =
    useDeleteServiceQuestionnaireMutation();

  useEffect(() => {
    if (questionnaireData) {
      setQuestionnaires(
        Array.isArray(questionnaireData) ? questionnaireData : [],
      );
    }
  }, [questionnaireData]);

  useEffect(() => {
    if (error) {
      setAlert({
        type: "danger",
        message:
          error?.data?.detail || "Failed to load service questionnaires.",
      });
    }
  }, [error, setAlert]);

  const handlePreviewClick = (questionnaire) => {
    setPreviewQuestionnaire(questionnaire);
  };

  const handleDeleteClick = (id) => {
    setSelectedId(id);
    setShowModal(true);
  };

  const confirmDelete = async (e) => {
    e.preventDefault();
    if (!selectedId) return;

    try {
      await deleteServiceQuestionnaire(selectedId).unwrap();
      setAlert({
        type: "success",
        message: "Service questionnaire deleted successfully!",
      });
      setShowModal(false);
      setSelectedId(null);
    } catch (err) {
      setAlert({
        type: "danger",
        message: err?.data?.detail || "Failed to delete service questionnaire.",
      });
    }
  };

  if (isLoading) return <div>Loading service questionnaires...</div>;

  const totalCount = questionnaires.length;
  const activeCount = questionnaires.filter((q) => q.is_active).length;
  const inactiveCount = totalCount - activeCount;

  return (
    <>
      <div className="space-y-5">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-blue-800 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <LuInfo className="h-4 w-4" />
            </span>
            <p className="pt-0.5 leading-6">
              Create questionnaires for each service. Clients complete these
              when a service is added, so you get the details needed. Services
              cannot be assigned without a questionnaire.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">Total Questionnaires</p>
                <p className="mt-1 text-3xl font-semibold text-slate-900">
                  {totalCount}
                </p>
              </div>
              <span className="text-gray-400">
                <LuCircleAlert className="h-4 w-4" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="mt-1 text-3xl font-semibold text-slate-900">
                  {activeCount}
                </p>
              </div>
              <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">Inactive</p>
                <p className="mt-1 text-3xl font-semibold text-slate-900">
                  {inactiveCount}
                </p>
              </div>
              <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-gray-400" />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-2xl md:text-3xl font-semibold text-primary">
            Service Questionnaires
          </h4>
        </div>

        {questionnaires.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-gray-600 shadow-sm">
            <p className="mb-0">No service questionnaires found.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
            {questionnaires.map((q) => (
              <div
                key={q.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="text-lg font-semibold text-slate-900">
                      {q.service_name}
                    </h5>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                      <LuCircleDashed className="h-3.5 w-3.5" />
                      Questions: {q.additional_questions_form?.length || 0}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${q.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {q.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-6 flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                    onClick={() => onEdit?.(q)}
                  >
                    <LuPencilLine className="h-3.5 w-3.5" />
                    Edit
                  </button>

                  <button
                    type="button"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-gray-50"
                    onClick={() => handlePreviewClick(q)}
                  >
                    <LuEye className="h-3.5 w-3.5" />
                    Preview
                  </button>

                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
                    onClick={() => handleDeleteClick(q.id)}
                  >
                    <LuTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewQuestionnaire && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full md:w-3/5 max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h5 className="text-lg font-semibold text-slate-900">
                  Questionnaire Preview
                </h5>
                <p className="mt-1 text-sm text-slate-500">
                  This is the questionnaire preview that shows the saved
                  question set.
                </p>
              </div>
              <button
                type="button"
                className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                onClick={() => setPreviewQuestionnaire(null)}
                aria-label="Close preview"
              >
                <CgClose className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
              <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                {previewQuestionnaire.service_name} questionnaire preview.
              </div>

              <div className="space-y-4">
                {(previewQuestionnaire.additional_questions_form || []).map(
                  (q, index) => (
                    <div
                      key={`${previewQuestionnaire.id}-${index}`}
                      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <label className="text-sm font-semibold text-slate-900">
                          {index + 1}. {q.text}
                          {q.required && (
                            <span className="text-red-500"> *</span>
                          )}
                        </label>
                      </div>

                      <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                        {q.type === "input" && (
                          <input
                            type={q.inputType || "text"}
                            disabled
                            placeholder="Answer preview"
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600"
                          />
                        )}

                        {q.type === "checkbox-single" && (
                          <div className="flex flex-wrap gap-3">
                            {(q.options || []).map((opt, optIndex) => (
                              <label
                                key={optIndex}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                              >
                                <input
                                  type="radio"
                                  disabled
                                  className="h-4 w-4 border-gray-300 text-accent"
                                />
                                {opt}
                              </label>
                            ))}
                          </div>
                        )}

                        {q.type === "checkbox-multiple" && (
                          <div className="flex flex-wrap gap-3">
                            {(q.options || []).map((opt, optIndex) => (
                              <label
                                key={optIndex}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                              >
                                <input
                                  type="checkbox"
                                  disabled
                                  className="h-4 w-4 rounded border-gray-300 text-accent"
                                />
                                {opt}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      {q.description && (
                        <p className="mt-2 text-xs text-gray-500">
                          {q.description}
                        </p>
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 bg-white px-6 py-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  onClick={() => setPreviewQuestionnaire(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <form
            onSubmit={confirmDelete}
            className="max-w-md rounded-2xl bg-white p-6 shadow-lg"
          >
            <div className="flex items-start justify-between">
              <h5 className="text-lg font-semibold text-primary">
                Delete Service Questionnaire
              </h5>
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
