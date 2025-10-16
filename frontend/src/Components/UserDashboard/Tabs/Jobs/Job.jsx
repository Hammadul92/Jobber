import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    useFetchJobQuery,
    useUpdateJobMutation,
    useFetchTeamMembersQuery,
    useFetchJobPhotosQuery,
    useCreateJobPhotoMutation,
    useFetchServiceQuery,
} from '../../../../store';
import SubmitButton from '../../../../utils/SubmitButton';
import AlertDispatcher from '../../../../utils/AlertDispatcher';

export default function Job({ token, role }) {
    const { id } = useParams();

    // --- API Hooks ---
    const { data: jobData, isLoading, error } = useFetchJobQuery(id, { skip: !token });
    const [updateJob, { isLoading: updatingJob }] = useUpdateJobMutation();
    const { data: teamMembers } = useFetchTeamMembersQuery(undefined, { skip: !token });
    const { data: jobPhotos, refetch: refetchPhotos } = useFetchJobPhotosQuery(id, { skip: !token });
    const [createJobPhoto, { isLoading: uploading }] = useCreateJobPhotoMutation();

    const { data: serviceData } = useFetchServiceQuery(jobData?.service, {
        skip: !jobData?.service || !token,
    });

    // --- State ---
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [status, setStatus] = useState('');
    const [createdAt, setCreatedAt] = useState('');
    const [alert, setAlert] = useState({ type: '', message: '' });

    const [photoType, setPhotoType] = useState('BEFORE');
    const [selectedFile, setSelectedFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');

    useEffect(() => {
        if (jobData) {
            setTitle(jobData.title || '');
            setDescription(jobData.description || '');
            setAssignedTo(jobData.assigned_to || '');
            setScheduledDate(jobData.scheduled_date?.slice(0, 16) || '');
            setStatus(jobData.status || 'PENDING');
            setCreatedAt(jobData.created_at || '');
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

            setAlert({ type: 'success', message: 'Job updated successfully.' });
        } catch (err) {
            console.error(err);
            setAlert({
                type: 'danger',
                message: err?.data?.detail || 'Failed to update job.',
            });
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handlePhotoUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            return setAlert({ type: 'danger', message: 'Please select a photo first.' });
        }

        const formData = new FormData();
        formData.append('job', id);
        formData.append('photo_type', photoType);
        formData.append('photo', selectedFile);

        try {
            await createJobPhoto(formData).unwrap();
            setAlert({ type: 'success', message: 'Photo uploaded successfully.' });
            setSelectedFile(null);
            setPhotoPreview('');
            refetchPhotos();
        } catch (err) {
            console.error(err);
            setAlert({
                type: 'danger',
                message: err?.data?.detail || 'Failed to upload photo.',
            });
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    if (isLoading) return <div>Loading job details...</div>;

    if (error) {
        return (
            <AlertDispatcher
                type="danger"
                message={error?.data?.detail || 'Failed to load job details.'}
                onClose={() => setAlert({ type: '', message: '' })}
            />
        );
    }

    return (
        <>
            {alert.message && (
                <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: '', message: '' })}
                />
            )}

            <nav aria-label="breadcrumb" className="mb-3">
                <ol className="breadcrumb small mb-0">
                    <li className="breadcrumb-item">
                        <Link to="/dashboard/home" className="text-success">
                            Dashboard
                        </Link>
                    </li>
                    <li className="breadcrumb-item">
                        <Link to="/dashboard/jobs" className="text-success">
                            Jobs
                        </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        {title}
                    </li>
                </ol>
            </nav>

            <div className="row g-3">
                {/* LEFT PANEL */}
                <div className="col-12 col-lg-4">
                    {/* JOB SUMMARY */}
                    <div className="card shadow-sm border-0 position-relative">
                        {/* Status badge top-right */}
                        <span
                            className={`badge rounded-pill bg-gradient position-absolute top-0 end-0 m-2 bg-${
                                status === 'COMPLETED' ? 'success' : 'secondary'
                            }`}
                            style={{ fontSize: '0.75rem' }}
                        >
                            {status.replace('_', ' ')}
                        </span>

                        <div className="card-body">
                            <h5 className="mb-2">{title}</h5>
                            {serviceData ? (
                                <>
                                    <p className="mb-1 small text-muted">
                                        <strong>Service:</strong> {serviceData.service_name}
                                    </p>
                                    <p className="mb-1 small text-muted">
                                        <strong>Client:</strong> {serviceData.client_name || '—'}
                                    </p>
                                    <p className="mb-1 small text-muted">
                                        <strong>Service Address:</strong> {serviceData.street_address},{' '}
                                        {serviceData.city}, {serviceData.province_state}, {serviceData.country},{' '}
                                        {serviceData.postal_code}
                                    </p>
                                </>
                            ) : (
                                <p className="small text-muted mb-0">Loading service info...</p>
                            )}
                        </div>
                    </div>

                    {/* PHOTO UPLOAD */}
                    <div className="card shadow-sm border-0 mt-3">
                        <div className="card-body">
                            <form onSubmit={handlePhotoUpload}>
                                <div className="field-wrapper mb-3">
                                    <select
                                        className="form-select"
                                        value={photoType}
                                        onChange={(e) => setPhotoType(e.target.value)}
                                    >
                                        <option value="BEFORE">Before</option>
                                        <option value="AFTER">After</option>
                                    </select>
                                    <label className="form-label">Photo Type</label>
                                </div>

                                <div className="field-wrapper mb-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="form-control"
                                        onChange={handlePhotoChange}
                                    />
                                    <label className="form-label">Choose Photo</label>
                                </div>

                                {photoPreview && (
                                    <div className="text-center mb-3">
                                        <img
                                            src={photoPreview}
                                            alt="Preview"
                                            className="img-fluid rounded shadow-sm"
                                            style={{ maxHeight: 200, objectFit: 'cover' }}
                                        />
                                    </div>
                                )}

                                <SubmitButton
                                    isLoading={uploading}
                                    btnClass="btn btn-sm btn-success float-end"
                                    btnName="Upload"
                                />
                            </form>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="col-12 col-lg-8">
                    {/* JOB FORM */}
                    <form onSubmit={handleSubmit} className="card shadow-sm border-0 mb-3">
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <div className="field-wrapper">
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Enter job title"
                                            disabled={role !== "MANAGER"}
                                        />
                                        <label className="form-label">Title</label>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="field-wrapper">
                                        <select
                                            className="form-select"
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                        >
                                            <option value="PENDING">Pending</option>
                                            <option value="IN_PROGRESS">In Progress</option>
                                            <option value="COMPLETED">Completed</option>
                                            <option value="CANCELLED">Cancelled</option>
                                        </select>
                                        <label className="form-label">Status</label>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="field-wrapper">
                                        <select
                                            className="form-select"
                                            value={assignedTo}
                                            onChange={(e) => setAssignedTo(e.target.value)}
                                            disabled={role !== "MANAGER"}
                                        >
                                            <option value="">Unassigned</option>
                                            {teamMembers?.results?.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.employee_name} - {m.role}
                                                </option>
                                            ))}
                                        </select>
                                        <label className="form-label">Assigned To</label>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="field-wrapper">
                                        <input
                                            type="datetime-local"
                                            className="form-control"
                                            value={scheduledDate}
                                            onChange={(e) => setScheduledDate(e.target.value)}
                                            disabled={role !== "MANAGER"}
                                        />
                                        <label className="form-label">Scheduled Date</label>
                                    </div>
                                </div>

                                <div className="col-12">
                                    <div className="field-wrapper">
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Job description..."
                                            disabled={role !== "MANAGER"}
                                        ></textarea>
                                        <label className="form-label">Description</label>
                                    </div>
                                </div>
                            </div>

                            <div className="d-flex justify-content-end mt-3">
                                <SubmitButton
                                    isLoading={updatingJob}
                                    btnClass="btn btn-success"
                                    btnName="Save Changes"
                                />
                            </div>
                        </div>
                    </form>

                    {/* PHOTOS */}
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <h4 className="fw-bold mb-3">Job Photos</h4>
                            <div className="row g-2">
                                {jobPhotos?.length ? (
                                    jobPhotos.map((photo) => (
                                        <div className="col-6 col-md-4 col-lg-3" key={photo.id}>
                                            <div className="card shadow-sm border-0 position-relative overflow-hidden">
                                                <div className="position-relative">
                                                    <img
                                                        src={photo.photo}
                                                        className="card-img-top rounded"
                                                        alt={photo.photo_type}
                                                        style={{
                                                            height: '180px',
                                                            objectFit: 'cover',
                                                            width: '100%',
                                                        }}
                                                    />

                                                    {/* BEFORE/AFTER badge top-right */}
                                                    <span
                                                        className="badge bg-success position-absolute top-0 end-0 m-2"
                                                        style={{ fontSize: '0.7rem' }}
                                                    >
                                                        {photo.photo_type}
                                                    </span>

                                                    {/* Upload time overlay bottom */}
                                                    <div
                                                        className="position-absolute bottom-0 start-0 w-100 text-white text-center py-1"
                                                        style={{
                                                            background: 'rgba(0,0,0,0.5)',
                                                            fontSize: '0.75rem',
                                                        }}
                                                    >
                                                        {new Date(photo.uploaded_at).toLocaleString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: true,
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted small mb-0">No photos uploaded yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
