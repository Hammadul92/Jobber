import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFetchServicesQuery, useDeleteServiceMutation } from '../../../../../store';
import SubmitButton from '../../../../ui/SubmitButton';
import { countries, provinces } from '../../../../../constants/locations';
import { formatDate } from '../../../../../utils/formatDate';
import Select from '../../../../ui/Select';

export default function ClientServicesData({ token, role, clientId, setAlert }) {
    const [deleteService, { isLoading: deleting }] = useDeleteServiceMutation();
    const [showModal, setShowModal] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState(null);

    const queryArg = role === 'CLIENT' ? null : clientId;
    const { data: services = [], isLoading, isError, error } = useFetchServicesQuery(queryArg, { skip: !token });

    const [typeFilter, setTypeFilter] = useState('');
    const [countryFilter, setCountryFilter] = useState('');
    const [provinceFilter, setProvinceFilter] = useState('');

    useEffect(() => {
        if (isError) {
            const msg = error?.data?.detail || 'Failed to load services. Please try again.';
            setAlert({ type: 'danger', message: msg });
        }
    }, [isError, error]);

    const filteredServices = useMemo(() => {
        return services.filter((service) => {
            return (
                (!typeFilter || service.service_type === typeFilter) &&
                (!countryFilter || service.country === countryFilter) &&
                (!provinceFilter || service.province_state === provinceFilter)
            );
        });
    }, [services, typeFilter, countryFilter, provinceFilter]);

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
            setAlert({ type: 'success', message: 'Service deleted successfully!' });
        } catch (err) {
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
            {/* FILTERS */}
            <div className="row mb-3 mt-3">
                <div className="col-md-3 col-6">
                    <Select
                        id="type_filter"
                        label={'Subscription type'}
                        value={typeFilter}
                        onChange={setTypeFilter}
                        options={[
                            { value: 'ONE_TIME', label: 'One Time' },
                            { value: 'SUBSCRIPTION', label: 'Subscription' },
                        ]}
                    />
                </div>
                <div className="col-md-3 col-6">
                    <Select
                        id="country_filter"
                        label={'Country'}
                        value={countryFilter}
                        onChange={(value) => {
                            setCountryFilter(value);
                            setProvinceFilter('');
                        }}
                        options={countries}
                    />
                </div>
                <div className="col-md-3 col-6">
                    <Select
                        id="province_state"
                        label={'Provice/State'}
                        value={provinceFilter}
                        onChange={setProvinceFilter}
                        options={provinces[countryFilter]}
                    />
                </div>
            </div>

            {/* GRID VIEW */}
            <div className="d-flex flex-nowrap overflow-auto gap-1" style={{ scrollSnapType: 'x mandatory' }}>
                {statusColumns.map(({ key, label, color }) => (
                    <div
                        key={key}
                        className="flex-shrink-0"
                        style={{ minWidth: '300px', maxWidth: '300px', scrollSnapAlign: 'start' }}
                    >
                        <div className="h-100 shadow-sm">
                            <h5 className={`mb-2 text-center ${color} bg-gradient text-white p-3 rounded`}>{label}</h5>

                            {groupedServices[key].length ? (
                                groupedServices[key].map((service) => (
                                    <div key={service.id} className={`shadow-sm p-2 m-2 rounded`}>
                                        <div className="mb-2 d-flex justify-content-between">
                                            <h6 className="fw-bold text-muted mb-0">{service.service_name}</h6>
                                            <span className="badge bg-dark bg-gradient rounded-pill">
                                                {service.service_type}
                                            </span>
                                        </div>

                                        {['ACTIVE', 'COMPLETED'].includes(service.status) && (
                                            <p className="mb-1 small text-muted">
                                                <strong>Price:</strong> ${service.price} {service.currency}
                                            </p>
                                        )}

                                        <p className="mb-1 small d-flex justify-content-between text-muted">
                                            <span>
                                                <strong>Start:</strong> {formatDate(service.start_date, false)}
                                            </span>
                                            {service.end_date && (
                                                <span>
                                                    <strong>End:</strong> {formatDate(service.end_date, false)}
                                                </span>
                                            )}
                                        </p>

                                        <p className="mb-1 small text-muted">
                                            <strong>Service Address:</strong> {service.street_address}, {service.city},{' '}
                                            {service.province_state}, {service.country}
                                        </p>

                                        {role === 'MANAGER' &&
                                            service.quotations?.length > 0 &&
                                            service.quotations.map((quote, i) => {
                                                return (
                                                    <Link
                                                        key={quote.id}
                                                        to={`/dashboard/quote/${quote.id}`}
                                                        title={`Quotation: ${quote.quote_number}`}
                                                        className={`badge bg-info bg-gradient rounded-pill text-decoration-none me-1`}
                                                    >
                                                        {quote.quote_number}
                                                    </Link>
                                                );
                                            })}

                                        <div className="d-flex justify-content-between align-items-center mt-2">
                                            {service.service_questionnaires?.id ? (
                                                <Link
                                                    to={`/dashboard/service-questionnaire/${service.service_questionnaires?.id}/form/${service.id}`}
                                                >
                                                    <span className="badge bg-primary bg-gradient rounded-pill">
                                                        {service.filled_questionnaire && (
                                                            <i className="fas fa-check-circle me-1"></i>
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
                                                <div className="d-flex gap-2">
                                                    <button
                                                        className="btn btn-light btn-sm"
                                                        onClick={() => handleDeleteClick(service.id)}
                                                        title="Delete Service"
                                                    >
                                                        <i className="fa fa-trash-alt"></i> Delete
                                                    </button>
                                                    <Link
                                                        className="btn btn-light btn-sm"
                                                        to={`/dashboard/service/${service.id}`}
                                                        title="Edit Service"
                                                    >
                                                        <i className="fa fa-pencil"></i> Edit
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
