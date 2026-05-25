import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useFetchJobQuery,
  useUpdateJobMutation,
  useFetchTeamMembersQuery,
  useFetchJobPhotosQuery,
  useCreateJobPhotoMutation,
  useFetchServiceQuery,
} from "../../../store";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import { formatDate } from "../../../utils/formatDate";
import Select from "../../../Components/ui/Select";
import Textarea from "../../../Components/ui/Textarea";
import Input from "../../../Components/ui/Input";
import { LuUpload } from "react-icons/lu";

export default function Job({ token, role }) {
  const { id } = useParams();

  const {
    data: jobData,
    isLoading,
    error,
  } = useFetchJobQuery(id, { skip: !token });
  const [updateJob, { isLoading: updatingJob }] = useUpdateJobMutation();
  const { data: teamMembers } = useFetchTeamMembersQuery(undefined, {
    skip: !token,
  });
  const { data: jobPhotos, refetch: refetchPhotos } = useFetchJobPhotosQuery(
    id,
    { skip: !token },
  );
  const [createJobPhoto, { isLoading: uploading }] =
    useCreateJobPhotoMutation();

  const { data: serviceData } = useFetchServiceQuery(jobData?.service, {
    skip: !jobData?.service || !token,
  });

  // --- State ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [status, setStatus] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [alert, setAlert] = useState({ type: "", message: "" });

  const [photoType, setPhotoType] = useState("BEFORE");
  const [selectedFile, setSelectedFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoInputKey, setPhotoInputKey] = useState(0);

  createdAt;
  useEffect(() => {
    if (jobData) {
      setTitle(jobData.title || "");
      setDescription(jobData.description || "");
      setAssignedTo(jobData.assigned_to || "");
      setScheduledDate(jobData.scheduled_date?.slice(0, 16) || "");
      setStatus(jobData.status || "PENDING");
      setCreatedAt(jobData.created_at || "");
    }
  }, [jobData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateJob({
        id,
        title,
        description,
        assigned_to: assignedTo,
        scheduled_date: scheduledDate,
        status,
      }).unwrap();

      setAlert({ type: "success", message: "Job updated successfully." });
    } catch (err) {
      console.error(err);
      setAlert({
        type: "danger",
        message: err?.data?.detail || "Failed to update job.",
      });
    }
  };

  const handlePhotoChange = (input) => {
    const file = input?.target?.files?.[0] || null;
    if (!file) return;
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setSelectedFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhotoPreview = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setSelectedFile(null);
    setPhotoPreview("");
    setPhotoInputKey((currentKey) => currentKey + 1);
  };

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      return setAlert({
        type: "danger",
        message: "Please select a photo first.",
      });
    }

    const formData = new FormData();
    formData.append("job", id);
    formData.append("photo_type", photoType);
    formData.append("photo", selectedFile);

    try {
      await createJobPhoto(formData).unwrap();
      setAlert({ type: "success", message: "Photo uploaded successfully." });
      setSelectedFile(null);
      setPhotoPreview("");
      refetchPhotos();
    } catch (err) {
      console.error(err);
      setAlert({
        type: "danger",
        message: err?.data?.detail || "Failed to upload photo.",
      });
    }
  };

  if (isLoading) return <div>Loading job details...</div>;

  if (error) {
    return (
      <AlertDispatcher
        type="danger"
        message={error?.data?.detail || "Failed to load job details."}
        onClose={() => setAlert({ type: "", message: "" })}
      />
    );
  }

  return (
    <>
      {alert.message && (
        <AlertDispatcher
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: "", message: "" })}
        />
      )}

      {/* Breadcrumb removed to match desired design */}

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
            <div className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <span
              className={`absolute right-4 top-4 inline-flex rounded-md px-3 py-1 text-xs font-semibold ${
                status === "COMPLETED"
                  ? "bg-emerald-100 text-emerald-700"
                  : status === "IN_PROGRESS"
                    ? "bg-blue-100 text-blue-700"
                    : status === "CANCELLED"
                      ? "bg-rose-100 text-rose-700"
                      : status === "PENDING"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-700"
              }`}
            >
              {status.replace("_", " ")}
            </span>

            <h5 className="mb-4 text-2xl font-medium text-gray-900">
              {title}
            </h5>
            {serviceData ? (
              <div className="space-y-2 text-base text-gray-800">
                <p>
                  <span className="font-medium block text-sm text-gray-600">Service:</span>{" "}
                  {serviceData.service_name}
                </p>
                <p>
                  <span className="font-medium block text-sm text-gray-600">Client:</span>{" "}
                  {serviceData.client_name || "—"}
                </p>
                <p>
                  <span className="font-medium block text-sm text-gray-600">
                    Service Address:
                  </span>{" "}
                  {serviceData.street_address}, {serviceData.city},{" "}
                  {serviceData.province_state}, {serviceData.country},{" "}
                  {serviceData.postal_code}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Loading service info...</p>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <form onSubmit={handlePhotoUpload} className="space-y-4">
              <Select
                id="photoType"
                label={"Photo Type"}
                value={photoType}
                onChange={setPhotoType}
                isRequired={true}
                options={[
                  { value: "BEFORE", label: "Before" },
                  { value: "AFTER", label: "After" },
                ]}
              />

              <Input
                key={photoInputKey}
                type="file"
                fieldClass="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                onChange={handlePhotoChange}
                label="Choose Photo"
                id="job-photo-upload"
                isRequired={true}
              />

              {photoPreview && (
                <div className="relative overflow-hidden rounded-lg shadow-sm">
                  <button
                    type="button"
                    onClick={handleRemovePhotoPreview}
                    className="absolute right-1 top-1 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500/70 text-white transition hover:bg-red"
                    aria-label="Remove selected photo"
                  >
                    ×
                  </button>
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="mx-auto h-48 w-full max-w-xs object-cover"
                  />
                </div>
              )}

              <div>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-3 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-accentLight disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={uploading}
                >
                  <LuUpload className="h-4 w-4" /> Upload
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-8">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="grid gap-y-0 gap-x-4 md:grid-cols-2">
              <Input
                type="text"
                fieldClass="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 h-10"
                value={title}
                onChange={setTitle}
                placeholder="Enter job title"
                isDisabled={role !== "MANAGER"}
                isRequired={true}
                label="Title"
                id="job-title"
              />

              <Select
                isRequired={true}
                id="job-status"
                label="Status"
                value={status}
                onChange={setStatus}
                options={[
                  { value: "PENDING", label: "Pending" },
                  { value: "IN_PROGRESS", label: "In Progress" },
                  { value: "COMPLETED", label: "Completed" },
                  { value: "CANCELLED", label: "Cancelled" },
                ]}
                fieldClass="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-slate-700"
              />

              <Select
                isRequired={true}
                id="job-assigned-to"
                label="Assigned To"
                value={assignedTo}
                onChange={setAssignedTo}
                isDisabled={role !== "MANAGER"}
                fieldClass="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-slate-700"
                options={[
                  { value: "", label: "Select" },
                  ...(teamMembers
                    ? teamMembers
                        .filter((member) => member.is_active === "True")
                        .map((member) => ({
                          value: member.id,
                          label: member.employee_name,
                        }))
                    : []),
                ]}
              />

              <Input
                type="datetime-local"
                fieldClass="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                value={scheduledDate}
                onChange={setScheduledDate}
                isDisabled={role !== "MANAGER"}
                label="Scheduled Date"
                id="job-scheduled-date"
              />
            </div>

            <div>
              <Textarea
                id="job-description"
                label="Description"
                value={description}
                onChange={setDescription}
                isRequired={false}
                fieldClass="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm h-40"
                rows={6}
                placeholder="Job description..."
                isDisabled={role !== "MANAGER"}
              />
            </div>

            <div className="-mt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-3 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accentLight disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ minWidth: 140 }}
                disabled={updatingJob}
              >
                Save Changes
              </button>
            </div>
          </form>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">
                Job Photos
              </h4>
              <p className="text-sm text-gray-500">
                Uploads are visible by type and timestamp.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {jobPhotos?.length ? (
                jobPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                  >
                    <img
                      src={photo.photo}
                      alt={photo.photo_type}
                      className="h-44 w-full object-cover"
                    />

                    <span className="absolute right-3 top-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {photo.photo_type}
                    </span>

                    <div className="absolute bottom-0 left-0 w-full bg-gray-800 px-3 py-2 text-center text-xs font-semibold text-white rounded-b-lg">
                      {formatDate(photo.uploaded_at)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-sm text-gray-500">No photos uploaded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
