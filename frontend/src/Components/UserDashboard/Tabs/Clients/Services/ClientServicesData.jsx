import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaTrashAlt, FaPencilAlt, FaSlidersH } from 'react-icons/fa';
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
    }, [isError, error, setAlert]);

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
        { key: 'PENDING', label: 'Pending', gradient: 'from-amber-100 to-orange-50', text: 'text-amber-900' },
        { key: 'ACTIVE', label: 'Active', gradient: 'from-green-100 to-emerald-50', text: 'text-emerald-900' },
        { key: 'COMPLETED', label: 'Completed', gradient: 'from-blue-100 to-secondary/10', text: 'text-secondary' },
        { key: 'CANCELLED', label: 'Cancelled', gradient: 'from-red-100 to-rose-50', text: 'text-red-900' },
    ];

    const hasFilters = typeFilter || countryFilter || provinceFilter;

    if (isLoading) return <div className="text-center py-4">Loading services...</div>;

    return (
        <>
            {/* FILTERS */}
            <div className="mb-4 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                        <FaSlidersH className="h-4 w-4 text-secondary" />
                        Filters
                    </div>
                    {hasFilters && (
                        <button
                            className="text-xs font-semibold text-secondary underline underline-offset-4"
                            onClick={() => {
                                setTypeFilter('');
                                setCountryFilter('');
                                setProvinceFilter('');
                            }}
                            type="button"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
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
                    <div>
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
                    <div>
                        <Select
                            id="province_state"
                            label={'Provice/State'}
                            value={provinceFilter}
                            onChange={setProvinceFilter}
                            options={provinces[countryFilter]}
                        />
                    </div>
                </div>
            </div>

            {/* GRID VIEW */}
            <div className="flex flex-nowrap gap-3 overflow-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
                {statusColumns.map(({ key, label, gradient, text }) => (
                    <div
                        key={key}
                        className="flex-shrink-0"
                        style={{ minWidth: '320px', maxWidth: '320px', scrollSnapAlign: 'start' }}
                    >
                        <div className="h-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div
                                className={`bg-gradient-to-r ${gradient} ${text} rounded-t-2xl px-4 py-3 text-center text-sm font-semibold`}
                            >
                                {label}
                            </div>

                            {groupedServices[key].length ? (
                                groupedServices[key].map((service) => (
                                    <div key={service.id} className="m-3 rounded-xl border border-gray-100 bg-white/90 p-3 shadow-sm">
                                        <div className="mb-2 flex items-center justify-between gap-2">
                                            <h6 className="mb-0 text-sm font-semibold text-primary">{service.service_name}</h6>
                                            <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase text-secondary">
                                                {service.service_type === 'SUBSCRIPTION' ? 'Subscription' : 'One-Time'}
                                            </span>
                                        </div>

                                        {['ACTIVE', 'COMPLETED'].includes(service.status) && (
                                            <p className="mb-1 text-xs text-gray-700">
                                                <span className="font-semibold text-primary">Price:</span> ${service.price} {service.currency}
                                                {service.billing_cycle ? ` • ${service.billing_cycle}` : ''}
                                            </p>
                                        )}

                                        <p className="mb-1 flex items-center justify-between text-xs text-gray-700">
                                            <span>
                                                <span className="font-semibold text-primary">Start:</span> {formatDate(service.start_date, false)}
                                            </span>
                                            {service.end_date && (
                                                <span>
                                                    <span className="font-semibold text-primary">End:</span> {formatDate(service.end_date, false)}
                                                </span>
                                            )}
                                        </p>

                                        <p className="mb-2 text-xs text-gray-700">
                                            <span className="font-semibold text-primary">Service Address:</span>{' '}
                                            {service.street_address}, {service.city}, {service.province_state}, {service.country}
                                        </p>

                                        {role === 'MANAGER' &&
                                            service.quotations?.length > 0 &&
                                            service.quotations.map((quote) => {
                                                return (
                                                    <Link
                                                        key={quote.id}
                                                        to={`/dashboard/quote/${quote.id}`}
                                                        title={`Quotation: ${quote.quote_number}`}
                                                        className="mr-1 inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent"
                                                    >
                                                        {quote.quote_number}
                                                    </Link>
                                                );
                                            })}

                                        <div className="mt-3 flex items-center justify-between gap-2">
                                            {service.service_questionnaires?.id ? (
                                                <Link
                                                    to={`/dashboard/service-questionnaire/${service.service_questionnaires?.id}/form/${service.id}`}
                                                    className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-white shadow"
                                                >
                                                    {service.filled_questionnaire && <FaCheckCircle className="h-3.5 w-3.5" />}
                                                    Service Qs: {service.service_questionnaires?.questionnaire?.length}
                                                </Link>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-800">
                                                    No Questionnaire
                                                </span>
                                            )}

                                            {role === 'MANAGER' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                                                        onClick={() => handleDeleteClick(service.id)}
                                                        title="Delete Service"
                                                        type="button"
                                                    >
                                                        <FaTrashAlt className="h-4 w-4" /> Delete
                                                    </button>
                                                    <Link
                                                        className="inline-flex items-center gap-2 rounded-lg border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary transition hover:bg-secondary/20"
                                                        to={`/dashboard/service/${service.id}`}
                                                        title="Edit Service"
                                                    >
                                                        <FaPencilAlt className="h-4 w-4" /> Edit
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="p-4 text-center text-xs text-gray-500">No {label.toLowerCase()} services</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* DELETE MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <form
                        onSubmit={confirmDelete}
                        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
                        role="dialog"
                    >
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                                <h5 className="text-lg font-semibold text-primary">Delete Service</h5>
                                <p className="mt-1 text-sm text-gray-600">This cannot be undone.</p>
                            </div>
                            <button
                                type="button"
                                className="text-gray-400 transition hover:text-gray-600"
                                onClick={() => setShowModal(false)}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <SubmitButton
                                isLoading={deleting}
                                btnClass="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-lg disabled:opacity-60"
                                btnName="Delete"
                            />
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
