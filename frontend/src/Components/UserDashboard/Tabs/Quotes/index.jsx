import { useState } from 'react';

import CreateQuoteForm from './CreateQuoteForm';
import DataTable from './QuotesDatatable';

export default function Quotes({ token, role }) {
    const [showModal, setShowModal] = useState(false);

    return (
        <div>
            <div className="clearfix mb-3">
                {role === 'MANAGER' ? (
                    <button className="btn btn-success float-end" onClick={() => setShowModal(true)}>
                        Add Quote
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
