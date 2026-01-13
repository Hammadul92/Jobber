import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';
import CreateClientServiceForm from './CreateClientServiceForm';
import { useFetchClientQuery, useFetchBusinessQuery } from '../../../../../store';
import ClientServicesData from './ClientServicesData';
import AlertDispatcher from '../../../../ui/AlertDispatcher';

export default function ClientServices({ token, role }) {
    const { id: clientId } = useParams();
    const [showModal, setShowModal] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });

    const isManagerMode = !!clientId;

    const {
        data: client,
        isLoading: loadingClient,
        error: clientError,
    } = useFetchClientQuery(clientId, { skip: !isManagerMode || !token });

    const {
        data: business,
        isLoading: loadingBusiness,
        error: businessError,
    } = useFetchBusinessQuery(client?.business, {
        skip: !client?.business || !token,
    });

    const title = isManagerMode ? `Services for ${client?.client_name || 'Client'}` : 'Services';

    const displayError = (error) => {
        const msg = Array.isArray(error?.data)
            ? error.data.join(', ')
            : typeof error?.data === 'object'
              ? Object.entries(error.data)
                    .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                    .join(' | ')
              : error?.data?.detail || 'Something went wrong';
        setAlert({ type: 'danger', message: msg });
    };

    if (clientError && !alert.message) displayError(clientError);
    if (businessError && !alert.message) displayError(businessError);

    return (
        <>
            <nav aria-label="breadcrumb" className="mb-4">
                <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <li>
                        <Link to={`/`} className="font-semibold text-accent hover:text-accentLight">
                            Contractorz
                        </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li>
                        <Link to="/dashboard/home" className="font-semibold text-secondary hover:text-accent">
                            {isManagerMode ? business?.name : 'Client Portal'}
                        </Link>
                    </li>
                    {isManagerMode && (
                        <>
                            <li className="text-gray-400">/</li>
                            <li>
                                <Link to="/dashboard/clients" className="font-semibold text-secondary hover:text-accent">
                                    Clients
                                </Link>
                            </li>
                        </>
                    )}
                    <li className="text-gray-400">/</li>
                    <li className="text-gray-700 font-semibold">{title}</li>
                </ol>
            </nav>

            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-accent to-secondary p-[1px] shadow-lg">
                <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-white/95 px-6 py-5">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">Service Desk</p>
                        <h2 className="text-2xl font-semibold text-primary">{title}</h2>
                        <p className="text-sm text-gray-600">
                            Organize subscriptions and one-time jobs with clear statuses, billing cadence, and on-site details.
                        </p>
                    </div>
                    {isManagerMode && (
                        <div className="flex flex-col items-start gap-2 rounded-xl bg-gradient-to-br from-secondary to-primary px-4 py-3 text-white shadow-md">
                            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-white/70">Client</span>
                            <p className="text-sm font-semibold leading-tight">{client?.client_name || 'Pending client'}</p>
                            <p className="text-xs text-white/80">
                                {client?.city || client?.province_state || client?.country
                                    ? [client?.city, client?.province_state, client?.country].filter(Boolean).join(', ')
                                    : 'Location not provided'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {alert.message && (
                <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: '', message: '' })}
                />
            )}

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white/90 px-4 py-3 shadow-sm">
                <div>
                    <h3 className="text-lg font-semibold text-primary">{title}</h3>
                    <p className="text-sm text-gray-600">Track services by status, location, and subscription type.</p>
                </div>
                {isManagerMode && (
                    <button
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent to-secondary px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-lg disabled:opacity-60"
                        onClick={() => setShowModal(true)}
                        disabled={loadingClient || !!clientError}
                        type="button"
                    >
                        <FaPlus className="h-4 w-4" /> Add Service
                    </button>
                )}
            </div>

            {isManagerMode && (
                <CreateClientServiceForm
                    showModal={showModal}
                    setShowModal={setShowModal}
                    clientId={client?.id}
                    businessId={client?.business}
                    serviceOptions={business?.services_offered || []}
                    loadingOptions={loadingBusiness}
                    errorOptions={businessError}
                    setAlert={setAlert}
                />
            )}

            <ClientServicesData
                token={token}
                role={role}
                clientId={isManagerMode ? clientId : null}
                setAlert={setAlert}
            />
        </>
    );
}
