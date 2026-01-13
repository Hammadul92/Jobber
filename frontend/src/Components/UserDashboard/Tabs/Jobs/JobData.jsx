import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFetchJobsQuery, useDeleteJobMutation } from '../../../../store';
import SubmitButton from '../../../ui/SubmitButton';
import { formatDate } from '../../../../utils/formatDate';
import Input from '../../../ui/Input';
import Select from '../../../ui/Select';

export default function JobData({ token, role, setAlert }) {
    const [deleteJob, { isLoading: deleting }] = useDeleteJobMutation();
    const [showModal, setShowModal] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState(null);

    // --- Filters ---
    const [serviceFilter, setServiceFilter] = useState('');
    const [assignedToFilter, setAssignedToFilter] = useState('');
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');
    const [activeTab, setActiveTab] = useState('PENDING');

    const { data: jobs = [], isLoading, isError, error, refetch } = useFetchJobsQuery(undefined, { skip: !token });

    // --- Error handling ---
    useEffect(() => {
        if (isError) {
            console.error('Fetch jobs error:', error);
            setAlert({
                type: 'danger',
                message: 'Failed to load jobs. Please try again later.',
            });
        }
    }, [isError, error, setAlert]);

    const uniqueServices = useMemo(() => [...new Set(jobs.map((j) => j.service_name).filter(Boolean))], [jobs]);
    const uniqueAssignees = useMemo(() => [...new Set(jobs.map((j) => j.assigned_to_name || 'Unassigned'))], [jobs]);

    const filteredJobs = useMemo(() => {
        return jobs.filter((job) => {
            const matchService = !serviceFilter || job.service_name === serviceFilter;
            const matchAssigned =
                !assignedToFilter ||
                (assignedToFilter === 'Unassigned' && !job.assigned_to_name) ||
                job.assigned_to_name === assignedToFilter;
            const matchStart = !startDateFilter || new Date(job.scheduled_date) >= new Date(startDateFilter);
            const matchEnd = !endDateFilter || new Date(job.scheduled_date) <= new Date(endDateFilter);
            return matchService && matchAssigned && matchStart && matchEnd;
        });
    }, [jobs, serviceFilter, assignedToFilter, startDateFilter, endDateFilter]);

    const groupedJobs = useMemo(() => {
        const groups = { PENDING: [], IN_PROGRESS: [], COMPLETED: [], CANCELLED: [] };
        filteredJobs.forEach((job) => {
            if (groups[job.status]) groups[job.status].push(job);
            else groups.PENDING.push(job);
        });
        return groups;
    }, [filteredJobs]);

    const handleDeleteClick = (id) => {
        setSelectedJobId(id);
        setShowModal(true);
    };

    const confirmDelete = async (e) => {
        e.preventDefault();
        if (!selectedJobId) return;

        try {
            await deleteJob(selectedJobId).unwrap();
            refetch();
            setAlert({
                type: 'success',
                message: 'Job deleted successfully!',
            });
        } catch (err) {
            console.error('Failed to delete job:', err);
            const msg = err?.data?.detail || 'Failed to delete job. Please try again.';
            setAlert({
                type: 'danger',
                message: msg,
            });
        } finally {
            setShowModal(false);
            setSelectedJobId(null);
        }
    };

    const getInitials = (name) =>
        !name
            ? ''
            : name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

    const statusColumns = useMemo(
        () => [
            { key: 'PENDING', label: 'Pending', color: 'bg-amber-100 text-amber-700' },
            { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
            { key: 'COMPLETED', label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
            { key: 'CANCELLED', label: 'Cancelled', color: 'bg-rose-100 text-rose-700' },
        ],
        []
    );

    if (isLoading) return <div className="py-10 text-center text-sm text-gray-500">Loading jobs...</div>;

    return (
        <>
            <div className="mb-5 grid gap-4 md:grid-cols-4">
                <Select
                    id="jobs-service-filter"
                    label="Service"
                    value={serviceFilter}
                    onChange={setServiceFilter}
                    options={[
                        { value: '', label: 'All Services' },
                        ...uniqueServices.map((name) => ({ value: name, label: name })),
                    ]}
                />

                <Select
                    id="jobs-assignedto-filter"
                    label="Assigned To"
                    value={assignedToFilter}
                    onChange={setAssignedToFilter}
                    options={[
                        { value: '', label: 'All Assignees' },
                        ...uniqueAssignees.map((name) => ({ value: name, label: name })),
                    ]}
                />

                <Input
                    type="date"
                    value={startDateFilter}
                    onChange={setStartDateFilter}
                    label="Start Date (From)"
                    id="jobdata-start-date"
                />

                <Input
                    type="date"
                    value={endDateFilter}
                    onChange={setEndDateFilter}
                    label="End Date (To)"
                    id="jobdata-end-date"
                />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm min-h-[65vh] max-h-[65vh] overflow-auto">
                <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3">
                    {statusColumns.map(({ key, label, color }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setActiveTab(key)}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                activeTab === key
                                    ? `${color} shadow-sm`
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {groupedJobs[activeTab]?.length ? (
                            groupedJobs[activeTab].map((job) => (
                                <div key={job.id} className="relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    {job.assigned_to_name && (
                                        <div className="absolute right-3 top-3" title={job.assigned_to_name}>
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700 shadow-sm">
                                                {getInitials(job.assigned_to_name)}
                                            </div>
                                        </div>
                                    )}

                                    <h5 className="mb-1 text-base font-semibold text-gray-900">{job.title}</h5>
                                    <p className="text-xs text-gray-500">
                                        <span className="font-semibold text-gray-700">Service:</span> {job.service_name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        <span className="font-semibold text-gray-700">Scheduled:</span> {formatDate(job.scheduled_date)}
                                    </p>

                                    {role === 'MANAGER' && (
                                        <div className="mt-4 flex justify-end gap-2">
                                            <button
                                                type="button"
                                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-rose-200 hover:text-rose-700"
                                                onClick={() => handleDeleteClick(job.id)}
                                                title="Delete Job"
                                            >
                                                Delete
                                            </button>
                                            <Link
                                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-secondary transition hover:border-secondary hover:text-accent"
                                                to={`/dashboard/job/${job.id}`}
                                                title="Edit Job"
                                            >
                                                Edit
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="col-span-full py-6 text-center text-sm font-semibold text-gray-400">
                                No {statusColumns.find((s) => s.key === activeTab)?.label.toLowerCase()} jobs
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-gray-900/40" onClick={() => setShowModal(false)}></div>

                    <form
                        onSubmit={confirmDelete}
                        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="flex items-center justify-between">
                            <h5 className="text-lg font-semibold text-gray-900">Delete Job</h5>
                            <button
                                type="button"
                                className="text-gray-400 transition hover:text-gray-600"
                                onClick={() => setShowModal(false)}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="mt-3 text-sm text-gray-600">Are you sure you want to delete this job?</p>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <SubmitButton
                                isLoading={deleting}
                                btnClass="bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"
                                btnName="Delete"
                            />
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
