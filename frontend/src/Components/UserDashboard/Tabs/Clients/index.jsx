import { useState } from 'react';

import CreateClientForm from './CreateClientForm';
import DataTable from './ClientsDatatable';

export default function Clients() {
    const [showModal, setShowModal] = useState(false);

    return (
        <div>
            <div className="clearfix mb-3">
                <button className="btn btn-success float-end" onClick={() => setShowModal(true)}>
                    Add Client
                </button>
                <h3 className="mb-0">Clients</h3>
            </div>

            <CreateClientForm showModal={showModal} setShowModal={setShowModal} />

            <div className="">
                <DataTable />
            </div>
        </div>
    );
}
