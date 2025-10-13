import { useState } from 'react';
import { Link } from 'react-router-dom';

import CreateQuoteForm from './CreateQuoteForm';
import DataTable from './QuotesDatatable';

export default function Quotes({ token, role }) {
    const [showModal, setShowModal] = useState(false);

    return (
        <div>
            <nav aria-label="breadcrumb mb-3">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to={`/dashboard/home`} className="text-success">
                            Dashboard
                        </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        Quotes
                    </li>
                </ol>
            </nav>

            <div className="clearfix mb-3">
                {role === 'MANAGER' ? (
                    <button className="btn btn-success float-end" onClick={() => setShowModal(true)}>
                        Add
                    </button>
                ) : null}
                <h3 className="mb-0">Quotes</h3>
            </div>

            {role === 'MANAGER' ? (
                <CreateQuoteForm token={token} showModal={showModal} setShowModal={setShowModal} />
            ) : null}

            <div className="">
                <DataTable token={token} role={role} />
            </div>
        </div>
    );
}
