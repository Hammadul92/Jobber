import { useState } from 'react';
import { useFetchServicesQuery, useFetchTeamMembersQuery, useCreateJobMutation } from '../../../../store';
import SubmitButton from '../../../ui/SubmitButton';
import Select from '../../../ui/Select';
import Input from '../../../ui/Input';
import { CgClose } from 'react-icons/cg'

export default function CreateJobForm({ token, showModal, setShowModal, setAlert }) {
    const [serviceId, setServiceId] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [assignedTo, setAssignedTo] = useState('');

    // Fetch data
    const {
        data: services = [],
        isLoading: loadingServices
    } = useFetchServicesQuery(undefined, { skip: !token });

    const {
        data: teamMembers = [],
        isLoading: loadingTeam
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
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop Background */}
                    <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)}></div>
                    {/* Container */}
                    <div className='relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-xl'>
                        {/* Header */}
                        <div className="flex items-start justify-between p-6 border-b border-gray-100 bg-secondary text-white rounded-t-2xl">
                            <h5 className="text-lg font-semibold font-heading">Create New Job</h5>
                            <button
                                type="button"
                                className="text-gray-200 transition hover:text-gray-400"
                                onClick={() => setShowModal(false)}
                                aria-label="Close"
                            >
                                <CgClose className="h-5 w-5" />
                            </button>
                        </div>
                        {/* Content */}
                        <form
                            onSubmit={handleSubmit}
                            className="p-6"
                            role="dialog"
                            aria-modal="true"
                        >

                            <div className="mt-4 grid gap-4 md:grid-cols-2">
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

                                <Input
                                    type="text"
                                    value={title}
                                    onChange={setTitle}
                                    isRequired={true}
                                    label="Job Title"
                                    id="job-title"
                                />

                                <Input
                                    type="datetime-local"
                                    value={scheduledDate}
                                    onChange={setScheduledDate}
                                    isRequired={true}
                                    label="Scheduled Date"
                                    id="job-scheduled-date"
                                />

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

                            <div className="mt-3">
                                <label className="mb-1 block text-sm font-semibold text-gray-700">Description</label>
                                <textarea
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                                    rows="3"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
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
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
