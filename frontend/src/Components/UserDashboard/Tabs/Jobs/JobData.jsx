import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFetchJobsQuery, useDeleteJobMutation } from '../../../../store';
import SubmitButton from '../../../../utils/SubmitButton';
import { formatDate } from '../../../../utils/formatDate';

export default function JobData({ token, role, setAlert }) {
    const [deleteJob, { isLoading: deleting }] = useDeleteJobMutation();
    const [showModal, setShowModal] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState(null);

    // --- Filters ---
    const [serviceFilter, setServiceFilter] = useState('');
    const [assignedToFilter, setAssignedToFilter] = useState('');
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');

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
            { key: 'PENDING', label: 'Pending', color: 'bg-secondary' },
            { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-primary' },
            { key: 'COMPLETED', label: 'Completed', color: 'bg-success' },
            { key: 'CANCELLED', label: 'Cancelled', color: 'bg-danger' },
        ],
        []
    );

    if (isLoading) return <div className="text-center py-4">Loading jobs...</div>;

    return (
        <>
            <div className="row mb-3">
                <div className="col-md-2">
                    <div className="field-wrapper">
                        <select
                            className="form-select"
                            value={serviceFilter}
                            onChange={(e) => setServiceFilter(e.target.value)}
                        >
                            <option value="">All Services</option>
                            {uniqueServices.map((name, idx) => (
                                <option key={idx} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                        <label className="form-label">Service</label>
                    </div>
                </div>

                <div className="col-md-2">
                    <div className="field-wrapper">
                        <select
                            className="form-select"
                            value={assignedToFilter}
                            onChange={(e) => setAssignedToFilter(e.target.value)}
                        >
                            <option value="">All Assignees</option>
                            {uniqueAssignees.map((name, idx) => (
                                <option key={idx} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                        <label className="form-label">Assigned To</label>
                    </div>
                </div>

                <div className="col-md-2">
                    <div className="field-wrapper">
                        <input
                            type="date"
                            className="form-control"
                            value={startDateFilter}
                            onChange={(e) => setStartDateFilter(e.target.value)}
                        />
                        <label className="form-label">Start Date (From)</label>
                    </div>
                </div>

                <div className="col-md-2">
                    <div className="field-wrapper">
                        <input
                            type="date"
                            className="form-control"
                            value={endDateFilter}
                            onChange={(e) => setEndDateFilter(e.target.value)}
                        />
                        <label className="form-label">End Date (To)</label>
                    </div>
                </div>
            </div>

            <div className="d-flex flex-nowrap overflow-auto gap-1 pb-3" style={{ scrollSnapType: 'x mandatory' }}>
                {statusColumns.map(({ key, label, color }) => (
                    <div key={key} className="flex-shrink-0" style={{ minWidth: '310px', scrollSnapAlign: 'start' }}>
                        <div className="h-100 shadow-sm">
                            <h5 className={`mb-2 text-center ${color} bg-gradient text-white p-3 rounded`}>{label}</h5>

                            {groupedJobs[key].length ? (
                                groupedJobs[key].map((job) => (
                                    <div key={job.id} className="shadow-sm p-2 m-2 rounded bg-white position-relative">
                                        {job.assigned_to_name && (
                                            <div
                                                className="position-absolute top-0 end-0 mt-2 me-2"
                                                title={job.assigned_to_name}
                                            >
                                                <div
                                                    className="rounded-circle bg-info bg-gradient text-white d-flex align-items-center justify-content-center"
                                                    style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        fontWeight: 'bold',
                                                        fontSize: '1.1rem',
                                                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                                    }}
                                                >
                                                    {getInitials(job.assigned_to_name)}
                                                </div>
                                            </div>
                                        )}

                                        <h5>{job.title}</h5>
                                        <span className="badge bg-success bg-gradient rounded-pill mb-2">
                                            {job.service_name}
                                        </span>

                                        <p className="mb-1">
                                            <strong>Scheduled Date:</strong> {formatDate(job.scheduled_date)}
                                        </p>

                                        {role === 'MANAGER' && (
                                            <div className="d-flex justify-content-end mt-2">
                                                <button
                                                    className="btn btn-light rounded-circle py-1 px-2 me-2 border-0 fs-6"
                                                    onClick={() => handleDeleteClick(job.id)}
                                                    title="Delete Job"
                                                >
                                                    <i className="fa fa-trash-alt"></i>
                                                </button>
                                                <Link
                                                    className="btn btn-light rounded-circle py-1 px-2 fs-6"
                                                    to={`/dashboard/job/${job.id}`}
                                                    title="Edit Job"
                                                >
                                                    <i className="fa fa-pencil"></i>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-muted small">No {label.toLowerCase()} jobs</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* DELETE MODAL */}
            {showModal && (
                <>
                    <form onSubmit={confirmDelete} className="modal d-block" tabIndex="-1" role="dialog">
                        <div className="modal-dialog modal-dialog-centered" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Delete Job</h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setShowModal(false)}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <p>Are you sure you want to delete this job?</p>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-dark"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <SubmitButton
                                        isLoading={deleting}
                                        btnClass="btn btn-sm btn-danger"
                                        btnName="Delete"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}
        </>
    );
}
