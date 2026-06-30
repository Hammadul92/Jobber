import { useState, useEffect } from "react";
import {
  useFetchBusinessesQuery,
  useFetchServiceTermsTemplatesQuery,
  useCreateServiceTermsTemplateMutation,
  useUpdateServiceTermsTemplateMutation,
} from "../../../store";
import Dropdown from "../../../Components/ui/Dropdown";
import SubmitButton from "../../../Components/ui/SubmitButton";
import RichTextEditor from "../../../Components/ui/RichTextEditor";
import { CgClose } from "react-icons/cg";

const getPlainTextFromHtml = (html) => {
  if (!html) return "";
  const documentBody = new DOMParser().parseFromString(html, "text/html").body;
  return documentBody.textContent || "";
};

export default function CreateServiceTermsForm({
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
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState(0);

  const [createServiceTermsTemplate, { isLoading: isCreating }] =
    useCreateServiceTermsTemplateMutation();
  const [updateServiceTermsTemplate, { isLoading: isUpdating }] =
    useUpdateServiceTermsTemplateMutation();
  const { data: businesses } = useFetchBusinessesQuery(undefined, {
    skip: !token,
  });
  const { data: templatesData } = useFetchServiceTermsTemplatesQuery(undefined, {
    skip: !token,
  });

  const business = businesses?.[0];
  const servicesOffered = business?.services_offered || [];
  const existingTemplates = Array.isArray(templatesData) ? templatesData : [];
  const isSubmitting = isCreating || isUpdating;
  const maxWords = 10000;
  const plainContent = getPlainTextFromHtml(content);

  useEffect(() => {
    if (mode === "edit" && initialData && showModal) {
      setServiceName(initialData.service_name || "");
      setContent(initialData.content || "");
      setWordCount(
        getPlainTextFromHtml(initialData.content || "").trim()
          ? getPlainTextFromHtml(initialData.content || "").trim().split(/\s+/).length
          : 0,
      );
      setIsActive(initialData.is_active ?? true);
      return;
    }

    if (!showModal || (mode === "create" && showModal && !initialData)) {
      setServiceName("");
      setContent("");
      setWordCount(0);
      setIsActive(true);
    }
  }, [initialData, mode, showModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!serviceName || !plainContent.trim()) {
      setAlert({
        type: "danger",
        message: "Please fill in all required fields.",
      });
      return;
    }

    if (wordCount > maxWords) {
      setAlert({
        type: "danger",
        message: "General terms and conditions cannot exceed 10,000 words.",
      });
      return;
    }

    try {
      const businessId = business?.id;
      if (!businessId) {
        throw new Error("No business found for the current user.");
      }

      const payload = {
        business: businessId,
        service_name: serviceName,
        content: content.trim(),
        is_active: isActive,
      };

      if (mode === "edit" && initialData?.id) {
        await updateServiceTermsTemplate({
          id: initialData.id,
          ...payload,
        }).unwrap();

        setAlert({
          type: "success",
          message: "Service terms updated successfully.",
        });
      } else {
        await createServiceTermsTemplate(payload).unwrap();
        setAlert({
          type: "success",
          message: "Service terms created successfully.",
        });
      }

      setInitialData(null);
      setShowModal(false);
    } catch (err) {
      const message =
        err?.data?.service_name?.[0] ||
        err?.data?.content?.[0] ||
        err?.data?.detail ||
        "Something went wrong. Please try again.";

      setAlert({
        type: "danger",
        message,
      });
    }
  };

  if (!showModal) return null;

  return (
    <div
      className="fixed h-screen inset-0 z-50 flex items-start justify-end bg-black/50 px-3"
      onClick={() => setShowModal(false)}
    >
      <div
        className="absolute right-0 top-0 z-10 h-screen w-full overflow-hidden border-l border-gray-200 bg-white shadow-2xl md:w-5/6 lg:w-3/5 xl:w-2/5"
        onClick={(event) => event.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <div className="border-b border-gray-100 px-6 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h5 className="text-2xl font-semibold text-slate-800">
                  {mode === "edit"
                    ? "Edit Service Terms"
                    : "Create Service Terms"}
                </h5>
                <p className="mt-1 text-sm text-slate-500">
                  Add reusable service-level terms that are automatically added
                  to quotes.
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

            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
              Each offered service should have one active general terms
              template. These terms are included with every quote for that
              service.
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-6">
              <div>
                <label className="mb-1 block text-sm font-semibold uppercase text-gray-500">
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
                        : !existingTemplates.find(
                            (template) => template.service_name === service,
                          ),
                    )
                    .map((service) => ({ label: service, value: service }))}
                  buttonClassName="h-11 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold uppercase text-gray-500">
                  Status <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  id="is_active"
                  value={isActive ? "active" : "inactive"}
                  onChange={(value) => setIsActive(value === "active")}
                  options={[
                    { label: "Active", value: "active" },
                    { label: "Inactive", value: "inactive" },
                  ]}
                  buttonClassName="h-11 text-sm"
                />
              </div>

              <RichTextEditor
                id="service-terms-content"
                label="General Terms & Conditions"
                value={content}
                onChange={setContent}
                maxWords={maxWords}
                isRequired={true}
                onWordCountChange={setWordCount}
                onLimitReached={() =>
                  setAlert({
                    type: "danger",
                    message:
                      "General terms and conditions cannot exceed 10,000 words.",
                  })
                }
                placeholder="Add the reusable terms and conditions for this service..."
              />
              <div className="flex justify-end">
                <p
                  className={`text-xs ${
                    wordCount >= maxWords ? "text-rose-600" : "text-slate-500"
                  }`}
                >
                  {wordCount.toLocaleString()} / {maxWords.toLocaleString()} words
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 bg-white px-6 py-4">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <SubmitButton
                isLoading={isSubmitting}
                btnClass="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accentLight"
                btnName={mode === "edit" ? "Save Changes" : "Create Terms"}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
