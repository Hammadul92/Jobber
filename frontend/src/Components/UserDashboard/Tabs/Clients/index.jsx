import CreateClientForm from './CreateClientForm';
import DataTable from './ClientsDatatable';

export default function Clients() {
    return (
        <div className="container mt-4">
            <h3 className="mb-3">Clients</h3>
            <CreateClientForm />

            <div className="mt-3">
                <DataTable />
            </div>
        </div>
    );
}
