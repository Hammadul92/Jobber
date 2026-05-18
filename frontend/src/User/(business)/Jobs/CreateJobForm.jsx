import { useState } from "react";
import {
  useFetchServicesQuery,
  useFetchTeamMembersQuery,
  useCreateJobMutation,
} from "../../../store";
import Textarea from "../../../Components/ui/Textarea";
import SubmitButton from "../../../Components/ui/SubmitButton";
import Select from "../../../Components/ui/Select";
import Input from "../../../Components/ui/Input";
import { LuInfo, LuX } from "react-icons/lu";

export default function CreateJobForm({
  token,
  showModal,
  setShowModal,
  setAlert,
}) {
  const [serviceId, setServiceId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  // Fetch data
  const { data: services = [], isLoading: loadingServices } =
    useFetchServicesQuery(undefined, { skip: !token });

  const { data: teamMembers = [], isLoading: loadingTeam } =
    useFetchTeamMembersQuery(undefined, { skip: !token });

  const [createJob, { isLoading: isCreating }] = useCreateJobMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createJob({
        service: serviceId,
        title,
        description,
        scheduled_date: scheduledDate,
        assigned_to: assignedTo || null,
      }).unwrap();

      setAlert({
        type: "success",
        message: "Job created successfully!",
      });

      setServiceId("");
      setTitle("");
      setDescription("");
      setScheduledDate("");
      setAssignedTo("");
      setShowModal(false);
    } catch (err) {
      const errorMessage =
        err?.data?.error ||
        err?.data?.detail ||
        "Something went wrong while creating the job. Please try again.";

      setAlert({
        type: "danger",
        message: errorMessage,
      });
      setShowModal(false);
    }
  };

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => setShowModal(false)}
            role="button"
            tabIndex={-1}
            aria-label="Close modal backdrop"
          />

          <div
            className="absolute right-0 top-0 flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl"
            style={{ maxWidth: "560px" }}
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="shrink-0 border-b border-gray-200 px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h5 className="text-3xl font-semibold text-slate-900">
                    Create New Job
                  </h5>
                  <p className="mt-1 text-sm text-slate-500">
                    Create new jobs and add services.
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-0.5 text-slate-400 transition hover:text-slate-700"
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                >
                  <LuX className="h-4 w-4" />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 pb-6">
                <div className="mb-6 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-3 text-xs font-semibold text-blue-700">
                  <LuInfo className="mt-px h-4 w-4 shrink-0" />
                  To create a job, the service must already be assigned to a
                  client. Only client-linked services appear in the list.
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Job Details
                  </p>

                  <Select
                    id="job-service"
                    label="Service"
                    value={serviceId}
                    onChange={setServiceId}
                    isRequired={true}
                    fieldClass="h-11 text-sm"
                    options={[
                      { value: "", label: "Select Service" },
                      ...(!loadingServices && services
                        ? services.map((service) => ({
                            value: service.id,
                            label: `${service.service_name} (${service.client_name})`,
                          }))
                        : []),
                    ]}
                  />

                  <Input
                    type="text"
                    value={title}
                    onChange={setTitle}
                    isRequired={true}
                    label="Job Title"
                    id="job-title"
                    fieldClass="h-11 px-4 py-2 text-sm"
                  />

                  <Input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={setScheduledDate}
                    isRequired={true}
                    label="Scheduled Date"
                    id="job-scheduled-date"
                    fieldClass="h-11 px-4 py-2 text-sm"
                  />

                  <Select
                    id="job-assigned-to"
                    label="Assigned To"
                    value={assignedTo}
                    onChange={setAssignedTo}
                    isRequired={true}
                    fieldClass="h-11 text-sm"
                    options={[
                      { value: "", label: "Select Assignee" },
                      ...(!loadingTeam && teamMembers
                        ? teamMembers
                            .filter((member) => member.is_active === "True")
                            .map((member) => ({
                              value: member.id,
                              label: member.employee_name,
                            }))
                        : []),
                    ]}
                  />
                </div>

                <div className="mt-2 space-y-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Description
                  </p>

                  <Textarea
                    id="job-description"
                    label="Description"
                    value={description}
                    onChange={setDescription}
                    isRequired={false}
                    fieldClass="text-sm"
                    rows={5}
                    placeholder="Type here....."
                  />
                </div>
              </div>

              <div className="shrink-0 border-t border-gray-200 bg-white px-6 py-4">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                    onClick={() => setShowModal(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
                  <SubmitButton
                    isLoading={isCreating}
                    btnClass="bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accentLight"
                    btnName="Create Job"
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
