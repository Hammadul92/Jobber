import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import CreateClientServiceForm from './CreateClientServiceForm';

import { useFetchClientQuery, useFetchBusinessQuery } from '../../../../../store';
import ClientServicesData from './ClientServicesData';

export default function ClientServices({ token }) {
    const { id: clientId } = useParams();
    const [showModal, setShowModal] = useState(false);

    const {
        data: client,
        isLoading: loadingClient,
        error: clientError,
    } = useFetchClientQuery(clientId, { skip: !token });

    const {
        data: business,
        isLoading: loadingBusiness,
        error: businessError,
    } = useFetchBusinessQuery(client?.business, { skip: !client?.business || !token });

    return (
        <>
            <nav aria-label="breadcrumb mb-3">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to={`/dashboard/home`} className="text-success">
                            Dashboard
                        </Link>
                    </li>
                    <li className="breadcrumb-item">
                        <Link to={`/dashboard/clients`} className="text-success">
                            Clients
                        </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        Services for {client && client.client_name}
                    </li>
                </ol>
            </nav>
            <div className="clearfix mb-3">
                <button
                    className="btn btn-success float-end"
                    onClick={() => setShowModal(true)}
                    disabled={loadingClient || clientError}
                >
                    Add Service
                </button>

                {loadingClient && <h3 className="mb-0 text-muted">Loading client...</h3>}
                {clientError && (
                    <div className="alert alert-danger mb-0">
                        {clientError?.data?.detail || 'Failed to load client'}
                    </div>
                )}
                {client && <h3 className="mb-0">Services for {client.client_name}</h3>}
            </div>

            <CreateClientServiceForm
                showModal={showModal}
                setShowModal={setShowModal}
                clientId={clientId}
                businessId={client?.business}
                serviceOptions={business?.services_offered || []}
                loadingOptions={loadingBusiness}
                errorOptions={businessError}
            />

            <ClientServicesData token={token} clientId={clientId} />
        </>
    );
}
