import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Grid, Table, TableHeaderRow, TableFilterRow, PagingPanel } from '@devexpress/dx-react-grid-bootstrap4';
import {
    SortingState,
    IntegratedSorting,
    FilteringState,
    IntegratedFiltering,
    PagingState,
    IntegratedPaging,
} from '@devexpress/dx-react-grid';
import { FaCogs, FaTrashAlt, FaPlus } from 'react-icons/fa';
import { useFetchClientsQuery, useDeleteClientMutation } from '../../../../store';
import SubmitButton from '../../../ui/SubmitButton';
import AlertDispatcher from '../../../ui/AlertDispatcher';

export default function ClientsDatatable({ token, showAddClient }) {
    const [rows, setRows] = useState([]);
    const [columns, setColumns] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState(null);
    const [alert, setAlert] = useState({ type: '', message: '' });

    const { data: clientData, isLoading, error } = useFetchClientsQuery(undefined, { skip: !token });

    const [deleteClient, { isLoading: deleting }] = useDeleteClientMutation();

    const [sortingStateColumnExtensions] = useState([{ columnName: 'actions', sortingEnabled: false }]);
    const [defaultSorting] = useState([]);
    const [filteringStateColumnExtensions] = useState([{ columnName: 'actions', filteringEnabled: false }]);

    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [pageSizes] = useState([20, 30, 50]);

    useEffect(() => {
        if (clientData) {
            setRows(clientData.results);
            generateColumns(clientData.columns);
        }
    }, [clientData]);

    useEffect(() => {
        if (error) {
            setAlert({ type: 'danger', message: error?.data?.detail || 'Failed to load client data.' });
        }
    }, [error]);

    const generateColumns = (columns) => {
        const updatedColumns = [...columns, { name: 'actions', title: 'Actions' }];
        setColumns(updatedColumns);
    };

    const stats = useMemo(() => {
        const total = rows.length;
        const active = rows.filter((row) => row.is_active === 'True').length;
        const inactive = total - active;
        return [
            { label: 'Total Clients', value: total},
            { label: 'Active', value: active},
            { label: 'Inactive', value: inactive},
        ];
    }, [rows]);

    const handleDeleteClick = (id) => {
        setSelectedClientId(id);
        setShowModal(true);
    };

    const confirmDelete = async (e) => {
        e.preventDefault();
        if (!selectedClientId) return;

        try {
            await deleteClient(selectedClientId).unwrap();
            setAlert({ type: 'success', message: 'Client deleted successfully!' });
            setShowModal(false);
            setSelectedClientId(null);
        } catch (err) {
            setAlert({ type: 'danger', message: err?.data?.detail || 'Failed to delete client.' });
            console.error('Failed to delete client:', err);
        }
    };

    const Cell = (props) => {
        if (props.column.name === 'actions') {
            return (
                <Table.Cell {...props}>
                    <Link
                        to={`/dashboard/client/${props.row.id}/services`}
                        className="inline-flex items-center gap-2 rounded-lg bg-secondary/90 px-3 py-1 text-xs font-semibold text-white shadow transition hover:bg-secondary"
                        title="Client Services"
                    >
                        <FaCogs className="h-4 w-4" /> Services
                    </Link>
                    <button
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                        onClick={() => handleDeleteClick(props.row.id)}
                        title="Delete Client"
                        type="button"
                    >
                        <FaTrashAlt className="h-4 w-4" /> Delete
                    </button>
                </Table.Cell>
            );
        } else if (props.column.name === 'client_name') {
            return (
                <Table.Cell {...props}>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{props.row.client_name}</span>
                        <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                props.row.is_active === 'True'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-amber-100 text-amber-800'
                            }`}
                        >
                            {props.row.is_active === 'True' ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                    </div>
                </Table.Cell>
            );
        }
        return <Table.Cell {...props} />;
    };

    const HeaderCell = (props) => (
        <TableHeaderRow.Cell
            {...props}
            className="bg-gray-50 text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-600"
        />
    );

    if (isLoading) return <div>Loading data...</div>;

    const isEmpty = !rows.length;

    return (
        <>
            {alert.message && (
                <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: '', message: '' })}
                />
            )}

            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                {stats.map(({ label, value }) => (
                    <div key={label} className="rounded-xl border border-gray-100 bg-white/90 p-px shadow-sm">
                        <div className={`rounded-xl bg-secondary p-4 text-white`}>
                            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-white/80">{label}</p>
                            <p className="text-2xl font-semibold">{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="min-h-[50vh] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center mt-18 gap-2 px-6 py-10 text-center">
                        <p className="text-2xl font-semibold text-primary">No clients yet</p>
                        <p className="max-w-md text-sm text-gray-600">
                            Start by adding a client. We will create their portal credentials and keep services organized.
                        </p>
                        <button
                            className="primary"
                            onClick={() => showAddClient(true)}
                            type="button"
                        >
                            <FaPlus className="h-4 w-4 inline-flex" /> Add Client
                        </button>
                    </div>
                ) : (
                    <Grid rows={rows} columns={columns}>
                        <SortingState defaultSorting={defaultSorting} columnExtensions={sortingStateColumnExtensions} />
                        <IntegratedSorting />

                        <FilteringState columnExtensions={filteringStateColumnExtensions} />
                        <IntegratedFiltering />

                        <PagingState
                            currentPage={currentPage}
                            onCurrentPageChange={setCurrentPage}
                            pageSize={pageSize}
                            onPageSizeChange={setPageSize}
                        />
                        <IntegratedPaging />

                        <Table cellComponent={Cell} />
                        <TableHeaderRow showSortingControls cellComponent={HeaderCell} />
                        <TableFilterRow />
                        <PagingPanel pageSizes={pageSizes} />
                    </Grid>
                )}
            </div>

            {/* Delete Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <form
                        onSubmit={confirmDelete}
                        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
                        role="dialog"
                    >
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                                <h5 className="text-lg font-semibold text-primary">Delete Client</h5>
                                <p className="mt-1 text-sm text-gray-600">This action cannot be undone.</p>
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
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <SubmitButton
                                isLoading={deleting}
                                btnClass="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700 disabled:opacity-60"
                                btnName="Delete"
                            />
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
