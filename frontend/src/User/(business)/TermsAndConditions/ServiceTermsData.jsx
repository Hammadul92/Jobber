import { useEffect, useState } from "react";
import {
  useDeleteServiceTermsTemplateMutation,
  useFetchServiceTermsTemplatesQuery,
} from "../../../store";
import SubmitButton from "../../../Components/ui/SubmitButton";
import RichTextContent from "../../../Components/ui/RichTextContent";
import {
  LuCircleAlert,
  LuCircleDashed,
  LuEye,
  LuInfo,
  LuPencilLine,
  LuTrash2,
} from "react-icons/lu";
import { CgClose } from "react-icons/cg";

export default function ServiceTermsData({ token, setAlert, onEdit }) {
  const [templates, setTemplates] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const {
    data: templatesData,
    isLoading,
    error,
  } = useFetchServiceTermsTemplatesQuery(undefined, { skip: !token });
  const [deleteServiceTermsTemplate, { isLoading: deleting }] =
    useDeleteServiceTermsTemplateMutation();

  useEffect(() => {
    if (templatesData) {
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
    }
  }, [templatesData]);

  useEffect(() => {
    if (error) {
      setAlert({
        type: "danger",
        message:
          error?.data?.detail || "Failed to load service terms templates.",
      });
    }
  }, [error, setAlert]);

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!selectedId) return;

    try {
      await deleteServiceTermsTemplate(selectedId).unwrap();
      setAlert({
        type: "success",
        message: "Service terms deleted successfully!",
      });
      setShowDeleteModal(false);
      setSelectedId(null);
    } catch (err) {
      setAlert({
        type: "danger",
        message: err?.data?.detail || "Failed to delete service terms.",
      });
    }
  };

  if (isLoading) return <div>Loading service terms...</div>;

  const totalCount = templates.length;
  const activeCount = templates.filter((template) => template.is_active).length;
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
              Create one reusable terms template per offered service. These
              general terms are automatically included with every quote, and
              quote-level terms become additional terms on top.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">Total Templates</p>
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
          <h4 className="text-2xl font-semibold text-primary md:text-3xl">
            Service Terms & Conditions
          </h4>
        </div>

        {templates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-gray-600 shadow-sm">
            <p className="mb-0">No service terms templates found.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="text-lg font-semibold text-slate-900">
                      {template.service_name}
                    </h5>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                      <LuCircleDashed className="h-3.5 w-3.5" />
                      {template.content?.trim()?.split(/\s+/).length || 0} words
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${template.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {template.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-600">
                  {template.content}
                </p>

                <div className="mt-auto flex items-center gap-2 pt-6">
                  <button
                    type="button"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                    onClick={() => onEdit?.(template)}
                  >
                    <LuPencilLine className="h-3.5 w-3.5" />
                    Edit
                  </button>

                  <button
                    type="button"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-gray-50"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <LuEye className="h-3.5 w-3.5" />
                    Preview
                  </button>

                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
                    onClick={() => {
                      setSelectedId(template.id);
                      setShowDeleteModal(true);
                    }}
                  >
                    <LuTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl md:w-3/5">
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h5 className="text-xl font-medium text-slate-900">
                  Terms & Conditions Preview
                </h5>
                <p className="mt-1 text-sm text-slate-500">
                  {previewTemplate.service_name} general terms and conditions.
                </p>
              </div>
              <button
                type="button"
                className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                onClick={() => setPreviewTemplate(null)}
                aria-label="Close preview"
              >
                <CgClose className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm leading-7 text-slate-700">
                <RichTextContent html={previewTemplate.content} />
              </div>
            </div>

            <div className="border-t border-gray-200 bg-white px-6 py-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  onClick={() => setPreviewTemplate(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h5 className="text-lg font-semibold text-slate-900">
              Delete Terms Template
            </h5>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Are you sure you want to delete this service terms template?
            </p>
            <form onSubmit={handleDelete} className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedId(null);
                }}
              >
                Cancel
              </button>
              <SubmitButton
                isLoading={deleting}
                btnClass="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"
                btnName="Delete"
              />
            </form>
          </div>
        </div>
      )}
    </>
  );
}
