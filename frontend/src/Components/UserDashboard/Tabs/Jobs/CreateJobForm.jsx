import { useState } from 'react';
import { useFetchServicesQuery, useFetchTeamMembersQuery, useCreateJobMutation } from '../../../../store';
import SubmitButton from '../../../ui/SubmitButton';
import Select from '../../../ui/Select';
import Input from '../../../ui/Input';

export default function CreateJobForm({ token, showModal, setShowModal, setAlert }) {
    const [serviceId, setServiceId] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [assignedTo, setAssignedTo] = useState('');

    // Fetch data
    const {
        data: services = [],
        isLoading: loadingServices,
        isError: errorServices,
    } = useFetchServicesQuery(undefined, { skip: !token });

    const {
        data: teamMembers = [],
        isLoading: loadingTeam,
        isError: errorTeam,
    } = useFetchTeamMembersQuery(undefined, { skip: !token });

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
                type: 'success',
                message: 'Job created successfully!',
            });

            setServiceId('');
            setTitle('');
            setDescription('');
            setScheduledDate('');
            setAssignedTo('');
            setShowModal(false);
        } catch (err) {
            const errorMessage =
                err?.data?.error ||
                err?.data?.detail ||
                'Something went wrong while creating the job. Please try again.';

            setAlert({
                type: 'danger',
                message: errorMessage,
            });
            setShowModal(false);
        }
    };

    return (
        <>
            {showModal && (
                <div className="modal d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">Create New Job</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <Select
                                                id="job-service"
                                                label="Service"
                                                value={serviceId}
                                                onChange={setServiceId}
                                                isRequired={true}
                                                options={[
                                                    { value: '', label: 'Select Service' },
                                                    ...(!loadingServices && services
                                                        ? services
                                                              .filter((service) => service.status === 'ACTIVE')
                                                              .map((service) => ({
                                                                  value: service.id,
                                                                  label: `${service.service_name} (${service.client_name})`,
                                                              }))
                                                        : []),
                                                ]}
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <Input
                                                type="text"
                                                fieldClass="form-control"
                                                value={title}
                                                onChange={setTitle}
                                                isRequired={true}
                                                label="Job Title"
                                                id="job-title"
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <Input
                                                type="datetime-local"
                                                fieldClass="form-control"
                                                value={scheduledDate}
                                                onChange={setScheduledDate}
                                                isRequired={true}
                                                label="Scheduled Date"
                                                id="job-scheduled-date"
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <Select
                                                id="job-assigned-to"
                                                label="Assigned To"
                                                value={assignedTo}
                                                onChange={setAssignedTo}
                                                isRequired={true}
                                                options={[
                                                    { value: '', label: 'Select' },
                                                    ...(!loadingTeam && teamMembers
                                                        ? teamMembers
                                                              .filter((member) => member.is_active === 'True')
                                                              .map((member) => ({
                                                                  value: member.id,
                                                                  label: member.employee_name,
                                                              }))
                                                        : []),
                                                ]}
                                            />
                                        </div>
                                        <div className="col-md-12">
                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Description</label>
                                                <textarea
                                                    className="form-control"
                                                    rows="3"
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-dark"
                                        onClick={() => setShowModal(false)}
                                        disabled={isCreating}
                                    >
                                        Cancel
                                    </button>
                                    <SubmitButton
                                        isLoading={isCreating}
                                        btnClass="btn btn-sm btn-success"
                                        btnName="Create Job"
                                    />
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {showModal && <div className="modal-backdrop fade show"></div>}
        </>
    );
}
