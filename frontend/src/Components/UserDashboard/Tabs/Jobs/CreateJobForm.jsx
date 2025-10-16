import { useState } from 'react';
import { useFetchServicesQuery, useFetchTeamMembersQuery, useCreateJobMutation } from '../../../../store';
import SubmitButton from '../../../../utils/SubmitButton';

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
            console.error('Create job error:', err);
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
                                <h5 className="modal-title">Create New Job</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="row">
                                        {/* Service Select */}
                                        <div className="col-md-6">
                                            <div className="field-wrapper">
                                                <select
                                                    className="form-select"
                                                    value={serviceId}
                                                    onChange={(e) => setServiceId(e.target.value)}
                                                    required
                                                >
                                                    <option value="">Select Service</option>
                                                    {!loadingServices &&
                                                        services &&
                                                        services.map((service) => (
                                                            <option key={service.id} value={service.id}>
                                                                {service.service_name} ({service.client_name})
                                                            </option>
                                                        ))}
                                                </select>

                                                <label className="form-label">Service (*)</label>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="field-wrapper">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    required
                                                />
                                                <label className="form-label">Job Title (*)</label>
                                            </div>
                                        </div>

                                        <div className="col-md-12">
                                            <div className="field-wrapper">
                                                <textarea
                                                    className="form-control"
                                                    rows="3"
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                ></textarea>
                                                <label className="form-label">Description</label>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="field-wrapper">
                                                <input
                                                    type="datetime-local"
                                                    className="form-control"
                                                    value={scheduledDate}
                                                    onChange={(e) => setScheduledDate(e.target.value)}
                                                    required
                                                />
                                                <label className="form-label">Scheduled Date (*)</label>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="field-wrapper">
                                                <select
                                                    className="form-select"
                                                    value={assignedTo}
                                                    onChange={(e) => setAssignedTo(e.target.value)}
                                                >
                                                    <option value="">Select</option>
                                                    {!loadingTeam &&
                                                        teamMembers &&
                                                        teamMembers.results.map((member) => (
                                                            <option key={member.id} value={member.id}>
                                                                {member.employee_name}
                                                            </option>
                                                        ))}
                                                </select>

                                                <label className="form-label">Assigned To</label>
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
