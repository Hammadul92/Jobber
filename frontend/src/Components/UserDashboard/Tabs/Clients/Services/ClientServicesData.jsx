import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFetchServicesQuery, useDeleteServiceMutation } from '../../../../../store';
import SubmitButton from '../../../../../utils/SubmitButton';
import AlertDispatcher from '../../../../../utils/AlertDispatcher';
import { countries, provinces } from '../../../../../utils/locations';

export default function ClientServicesData({ token, role, clientId }) {
    const [deleteService, { isLoading: deleting }] = useDeleteServiceMutation();
    const [showModal, setShowModal] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState(null);
    const [alert, setAlert] = useState({ type: '', message: '' });

    const queryArg = role === 'CLIENT' ? null : clientId;
    const { data: services = [], isLoading, isError, error, refetch } = useFetchServicesQuery(queryArg, { skip: !token });

    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [countryFilter, setCountryFilter] = useState('');
    const [provinceFilter, setProvinceFilter] = useState('');

    // Handle error
    useEffect(() => {
        if (isError) {
            const msg =
                error?.data?.detail ||
                'Failed to load services. Please try again.';
            setAlert({ type: 'danger', message: msg });
        }
    }, [isError, error]);

    // Filter services
    const filteredServices = useMemo(() => {
        return services.filter((service) => {
            return (
                (!statusFilter || service.status === statusFilter) &&
                (!typeFilter || service.service_type === typeFilter) &&
                (!countryFilter || service.country === countryFilter) &&
                (!provinceFilter || service.province_state === provinceFilter)
            );
        });
    }, [services, statusFilter, typeFilter, countryFilter, provinceFilter]);

    // Group services by status
    const groupedServices = useMemo(() => {
        const groups = { ACTIVE: [], PENDING: [], COMPLETED: [], CANCELLED: [] };
        filteredServices.forEach((svc) => {
            if (groups[svc.status]) groups[svc.status].push(svc);
            else groups.PENDING.push(svc);
        });
        return groups;
    }, [filteredServices]);

    const handleDeleteClick = (id) => {
        setSelectedServiceId(id);
        setShowModal(true);
    };

    const confirmDelete = async (e) => {
        e.preventDefault();
        if (!selectedServiceId) return;
        try {
            await deleteService(selectedServiceId).unwrap();
            refetch();
            setAlert({ type: 'success', message: 'Service deleted successfully!' });
        } catch (err) {
            console.error('Failed to delete service:', err);
            const msg = err?.data?.detail || 'Failed to delete service. Please try again.';
            setAlert({ type: 'danger', message: msg });
        } finally {
            setShowModal(false);
            setSelectedServiceId(null);
        }
    };

    const statusColumns = [
        { key: 'PENDING', label: 'Pending', color: 'bg-secondary' },
        { key: 'ACTIVE', label: 'Active', color: 'bg-success' },
        { key: 'COMPLETED', label: 'Completed', color: 'bg-primary' },
        { key: 'CANCELLED', label: 'Cancelled', color: 'bg-danger' },
    ];

    if (isLoading) return <div className="text-center py-4">Loading services...</div>;

    return (
        <>
            {alert.message && (
                <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: '', message: '' })}
                />
            )}

            {/* FILTERS */}
            <div className="mb-3 shadow-sm p-2 bg-white rounded">
                <div className="row">
                    <div className="col-md-3">
                        <div className='field-wrapper'>
                        <select
                            className="form-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="PENDING">PENDING</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="CANCELLED">CANCELLED</option>
                        </select>
                        <label className='form-label'>Status</label>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className='field-wrapper'>
                        <select
                            className="form-select"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="">All Types</option>
                            <option value="ONE_TIME">ONE_TIME</option>
                            <option value="SUBSCRIPTION">SUBSCRIPTION</option>
                        </select>
                        <label className='form-label'>Subscription Type</label>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className='field-wrapper'>
                        <select
                            className="form-select"
                            value={countryFilter}
                            onChange={(e) => {
                                setCountryFilter(e.target.value);
                                setProvinceFilter('');
                            }}
                        >
                            <option value="">All Countries</option>
                            {countries.map((c) => (
                                <option key={c.code} value={c.code}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        <label className='form-label'>Country</label>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className='field-wrapper'>
                        <select
                            className="form-select"
                            value={provinceFilter}
                            onChange={(e) => setProvinceFilter(e.target.value)}
                        >
                            <option value="">All Provinces/States</option>
                            {countryFilter &&
                                provinces[countryFilter]?.map((prov) => (
                                    <option key={prov.code} value={prov.code}>
                                        {prov.name}
                                    </option>
                                ))}
                        </select>
                        <label className='form-label'>Province/State</label>
                        </div>
                    </div>
                </div>
            </div>

            {/* GRID VIEW */}
            <div className="d-flex flex-nowrap overflow-auto gap-2" style={{ scrollSnapType: 'x mandatory' }}>
                {statusColumns.map(({ key, label, color }) => (
                    <div
                        key={key}
                        className="flex-shrink-0"
                        style={{ minWidth: '319px', scrollSnapAlign: 'start' }}
                    >
                        <div className="bg-white rounded p-0 shadow-sm h-100">
                            <h5 className={`mb-2 text-center ${color} bg-gradient text-white p-3 rounded-top`}>
                                {label}
                            </h5>

                            {groupedServices[key].length ? (
                                groupedServices[key].map((service) => (
                                    <div key={service.id} className={`shadow-sm p-2 m-2 rounded`}>
                                        <div className="clearfix mb-2">
                                            <span className="badge bg-dark rounded-pill float-end me-2">
                                                {service.service_type}
                                            </span>
                                            <h6 className="fw-bold mb-0">{service.service_name}</h6>
                                        </div>

                                        {['ACTIVE', 'COMPLETED'].includes(service.status) && (
                                            <p className="mb-1 small">
                                                <strong>Price:</strong> ${service.price} {service.currency}
                                            </p>
                                        )}

                                        <p className="mb-1 small">
                                            <strong>Start:</strong> {service.start_date}
                                        </p>
                                        {service.end_date && (
                                            <p className="mb-1 small">
                                                <strong>End:</strong> {service.end_date}
                                            </p>
                                        )}

                                        <p className="mb-1 small text-muted">
                                            <i className="fa fa-map-marker-alt me-1"></i>
                                            {service.street_address}, {service.city}, {service.province_state},{' '}
                                            {service.country}
                                        </p>

                                        {role === 'MANAGER' && service.quotations?.length > 0 && (
                                            <p className="small mb-1">
                                                <strong>Quotations: </strong>
                                                {service.quotations.map((quote, i) => {
                                                    const statusClass =
                                                        quote.status === 'SIGNED'
                                                            ? 'success'
                                                            : quote.status === 'SENT'
                                                              ? 'primary'
                                                              : quote.status === 'EXPIRED'
                                                                ? 'danger'
                                                                : 'secondary';
                                                    return (
                                                        <span key={quote.id}>
                                                            <Link
                                                                to={`/dashboard/quote/${quote.id}`}
                                                                className={`text-${statusClass} text-decoration-none fw-semibold`}
                                                            >
                                                                {quote.quote_number}
                                                            </Link>
                                                            {i < service.quotations.length - 1 && ', '}
                                                        </span>
                                                    );
                                                })}
                                            </p>
                                        )}

                                        <div className="d-flex justify-content-between align-items-center mt-2">
                                            {service.service_questionnaires?.id ? (
                                                <Link
                                                    to={`/dashboard/service-questionnaire/${service.service_questionnaires?.id}/form/${service.id}`}
                                                >
                                                    <span className="badge bg-primary rounded-pill p-2">
                                                        {service.filled_questionnaire && (
                                                            <i className="fa fa-check me-1"></i>
                                                        )}
                                                        Service Qs:{' '}
                                                        {service.service_questionnaires?.questionnaire?.length}
                                                    </span>
                                                </Link>
                                            ) : (
                                                <span className="badge bg-warning text-dark rounded-pill p-2">
                                                    No Questionnaire
                                                </span>
                                            )}

                                            {role === 'MANAGER' && (
                                                <div>
                                                    <button
                                                        className="btn btn-light rounded-circle py-1 px-2 me-2 border-0 fs-6"
                                                        onClick={() => handleDeleteClick(service.id)}
                                                        title="Delete Service"
                                                    >
                                                        <i className="fa fa-trash-alt"></i>
                                                    </button>
                                                    <Link
                                                        className="btn btn-light rounded-circle py-1 px-2 fs-6"
                                                        to={`/dashboard/service/${service.id}`}
                                                        title="Edit Service"
                                                    >
                                                        <i className="fa fa-pencil"></i>
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-muted small p-3">No {label.toLowerCase()} services</p>
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
                                    <h5 className="modal-title">Delete Service</h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setShowModal(false)}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <p>Are you sure you want to delete this service?</p>
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
