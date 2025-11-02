import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import CreateClientServiceForm from './CreateClientServiceForm';
import { useFetchClientQuery, useFetchBusinessQuery } from '../../../../../store';
import ClientServicesData from './ClientServicesData';
import AlertDispatcher from '../../../../../utils/AlertDispatcher';

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
            <nav aria-label="breadcrumb mb-3">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to={`/`} className="text-success">
                            Contractorz
                        </Link>
                    </li>
                    <li className="breadcrumb-item">
                        <Link to="/dashboard/home" className="text-success">
                            {isManagerMode ? business?.name : 'Client Portal'}
                        </Link>
                    </li>
                    {isManagerMode && (
                        <li className="breadcrumb-item">
                            <Link to="/dashboard/clients" className="text-success">
                                Clients
                            </Link>
                        </li>
                    )}
                    <li className="breadcrumb-item active" aria-current="page">
                        {title}
                    </li>
                </ol>
            </nav>

            {alert.message && (
                <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: '', message: '' })}
                />
            )}

            <div className="clearfix">
                {isManagerMode && (
                    <button
                        className="btn btn-success float-end"
                        onClick={() => setShowModal(true)}
                        disabled={loadingClient || !!clientError}
                    >
                        Add
                    </button>
                )}

                <h3 className="mb-0 fw-bold">{title}</h3>
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
