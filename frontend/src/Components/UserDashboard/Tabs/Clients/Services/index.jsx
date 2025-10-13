import { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import CreateClientServiceForm from './CreateClientServiceForm';
import { useFetchClientQuery, useFetchBusinessQuery } from '../../../../../store';
import ClientServicesData from './ClientServicesData';

export default function ClientServices({ token, role }) {
    const { id: clientIdFromUrl } = useParams();
    const [searchParams] = useSearchParams();
    const [showModal, setShowModal] = useState(false);

    const userIdFromQuery = searchParams.get('user');
    const isManagerMode = !!clientIdFromUrl;
    const clientId = clientIdFromUrl || null;
    const userId = userIdFromQuery || null;

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

    return (
        <>
            <nav aria-label="breadcrumb mb-3">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to="/dashboard/home" className="text-success">
                            Dashboard
                        </Link>
                    </li>
                    {isManagerMode ? (
                        <li className="breadcrumb-item">
                            <Link to="/dashboard/clients" className="text-success">
                                Clients
                            </Link>
                        </li>
                    ) : null}

                    <li className="breadcrumb-item active" aria-current="page">
                        {title}
                    </li>
                </ol>
            </nav>

            <div className="clearfix mb-3">
                {isManagerMode && (
                    <button
                        className="btn btn-success float-end"
                        onClick={() => setShowModal(true)}
                        disabled={loadingClient || clientError}
                    >
                        Add
                    </button>
                )}

                {loadingClient && isManagerMode && <h3 className="mb-0 text-muted">Loading client...</h3>}

                {clientError && isManagerMode && (
                    <div className="alert alert-danger mb-0">
                        {clientError?.data?.detail || 'Failed to load client'}
                    </div>
                )}

                <h3 className="mb-0">{title}</h3>
            </div>

            {isManagerMode && (
                <CreateClientServiceForm
                    showModal={showModal}
                    setShowModal={setShowModal}
                    clientId={clientId}
                    businessId={client?.business}
                    serviceOptions={business?.services_offered || []}
                    loadingOptions={loadingBusiness}
                    errorOptions={businessError}
                />
            )}

            <ClientServicesData token={token} role={role} clientId={isManagerMode ? clientId : null} />
        </>
    );
}
