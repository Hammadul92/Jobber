import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFetchServicesQuery, useDeleteServiceMutation } from '../../../../../store';
import SubmitButton from '../../../../../utils/SubmitButton';
import { countries, provinces } from '../../../../../utils/locations';

export default function ClientServicesData({ token, clientId }) {
    const [deleteService, { isLoading: deleting }] = useDeleteServiceMutation();
    const [showModal, setShowModal] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState(null);

    const {
        data: services,
        isLoading: loadingServices,
        error: serviceError,
        refetch,
    } = useFetchServicesQuery(clientId, { skip: !token });

    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [countryFilter, setCountryFilter] = useState('');
    const [provinceFilter, setProvinceFilter] = useState('');

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
            setShowModal(false);
            setSelectedServiceId(null);
        } catch (err) {
            console.error('Failed to delete service:', err);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'ACTIVE':
                return <span className="badge bg-success rounded-pill float-end">ACTIVE</span>;
            case 'PENDING':
                return <span className="badge bg-primary rounded-pill float-end">PENDING</span>;
            case 'CANCELLED':
                return <span className="badge bg-danger rounded-pill float-end">CANCELLED</span>;
            case 'COMPLETED':
                return <span className="badge bg-secondary rounded-pill float-end">COMPLETED</span>;
            default:
                return null;
        }
    };

    const filteredServices = useMemo(() => {
        if (!services) return [];
        return services.filter((service) => {
            return (
                (!statusFilter || service.status === statusFilter) &&
                (!typeFilter || service.service_type === typeFilter) &&
                (!countryFilter || service.country === countryFilter) &&
                (!provinceFilter || service.province_state === provinceFilter)
            );
        });
    }, [services, statusFilter, typeFilter, countryFilter, provinceFilter]);

    return (
        <>
            {/* Filters */}
            <div className="mb-4 row g-2">
                <div className="col-md-3">
                    <select
                        className="form-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="PENDING">PENDING</option>
                        <option value="CANCELLED">CANCELLED</option>
                        <option value="COMPLETED">COMPLETED</option>
                    </select>
                </div>
                <div className="col-md-3">
                    <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                        <option value="">All Types</option>
                        <option value="ONE_TIME">ONE_TIME</option>
                        <option value="SUBSCRIPTION">SUBSCRIPTION</option>
                    </select>
                </div>
                <div className="col-md-3">
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
                </div>
                <div className="col-md-3">
                    <select
                        className="form-select"
                        value={provinceFilter}
                        onChange={(e) => setProvinceFilter(e.target.value)}
                        disabled={!countryFilter}
                    >
                        <option value="">All Provinces/States</option>
                        {countryFilter &&
                            provinces[countryFilter]?.map((prov) => (
                                <option key={prov.code} value={prov.code}>
                                    {prov.name}
                                </option>
                            ))}
                    </select>
                </div>
            </div>

            <div className="row">
                {loadingServices && <div>Loading services...</div>}
                {serviceError && (
                    <div className="alert alert-danger">{serviceError?.data?.detail || 'Failed to load services'}</div>
                )}
                {filteredServices?.length === 0 && !loadingServices && <p>No services found.</p>}

                {filteredServices?.map((service) => (
                    <div className="col-md-4 mb-3" key={service.id}>
                        <div className="h-100 shadow border-0 bg-white rounded-4 p-3">
                            <div>
                                <div className="clearfix mb-2">
                                    {getStatusBadge(service.status)}

                                    <span className="badge bg-dark rounded-pill float-end me-2">
                                        {service.service_type}
                                    </span>

                                    <h5 className="card-title">{service.service_name}</h5>
                                </div>

                                {service.description && (
                                    <p className="card-text p-2 bg-light">
                                        <i className="fa fa-info"></i> {service.description}
                                    </p>
                                )}

                                <p className="mb-1">
                                    <strong>Price:</strong> ${service.price} {service.currency}
                                </p>

                                <p className="mb-1">
                                    <strong>Start Date:</strong> {service.start_date}
                                </p>

                                {service.end_date && <p className="mb-1">End Date: {service.end_date}</p>}

                                <p className="mb-1">
                                    <strong>Service Address:</strong> {service.street_address}, {service.city},{' '}
                                    {service.province_state}, {service.country}, {service.postal_code}
                                </p>

                                {service.quotations && service.quotations.length > 0 && (
                                    <div className="mb-2">
                                        <strong>Quotations: </strong>
                                        {service.quotations.map((quote, index) => {
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
                                                    {index < service.quotations.length - 1 && ', '}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="clearfix">
                                    <Link
                                        className="badge bg-light rounded-circle p-2 text-secondary float-end fs-5"
                                        to={`/dashboard/service/${service.id}`}
                                    >
                                        <i className="fa fa-pencil"></i>
                                    </Link>
                                    <button
                                        className="badge bg-light rounded-circle p-2 me-2 text-secondary border-0 float-end fs-5"
                                        onClick={() => handleDeleteClick(service.id)}
                                    >
                                        <i className="fa fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Delete Modal */}
            {showModal && (
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
                                <SubmitButton isLoading={deleting} btnClass="btn btn-sm btn-danger" btnName="Delete" />
                            </div>
                        </div>
                    </div>
                </form>
            )}
            {showModal && <div className="modal-backdrop fade show"></div>}
        </>
    );
}
