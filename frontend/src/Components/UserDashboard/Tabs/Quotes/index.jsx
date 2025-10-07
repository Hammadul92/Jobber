import { useState } from 'react';

import CreateQuoteForm from './CreateQuoteForm';
import DataTable from './QuotesDatatable';

export default function Quotes({ token }) {
    const [showModal, setShowModal] = useState(false);

    return (
        <div>
            <div className="clearfix mb-3">
                <button className="btn btn-success float-end" onClick={() => setShowModal(true)}>
                    Add Quote
                </button>
                <h3 className="mb-0">Quotes</h3>
            </div>

            <CreateQuoteForm token={token} showModal={showModal} setShowModal={setShowModal} />

            <div className="">
                <DataTable token={token} />
            </div>
        </div>
    );
}
