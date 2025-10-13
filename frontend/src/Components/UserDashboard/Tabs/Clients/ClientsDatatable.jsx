import { useState, useEffect } from 'react';
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
import { useFetchClientsQuery, useDeleteClientMutation } from '../../../../store';
import SubmitButton from '../../../../utils/SubmitButton';
import AlertDispatcher from '../../../../utils/AlertDispatcher';

export default function ClientsDatatable({ token }) {
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
                        to={`/dashboard/client/${props.row.id}`}
                        className="badge bg-light rounded-circle p-2 me-2 text-secondary"
                        title="Edit Client"
                    >
                        <i className="fa fa-pencil"></i>
                    </Link>
                    <Link
                        to={`/dashboard/client/${props.row.id}/services`}
                        className="badge bg-light rounded-circle p-2 me-2 text-secondary"
                        title="Client Services"
                    >
                        <i className="fa fa-cogs"></i>
                    </Link>
                    <button
                        className="badge bg-light rounded-circle p-2 me-2 text-secondary border-0"
                        onClick={() => handleDeleteClick(props.row.id)}
                        title="Delete Client"
                    >
                        <i className="fa fa-trash-alt"></i>
                    </button>
                </Table.Cell>
            );
        } else if (props.column.name === 'client_name') {
            return (
                <Table.Cell {...props}>
                    {props.row.client_name}{' '}
                    <span
                        className={`badge rounded-pill text-white ${props.row.is_active === 'True' ? 'bg-success' : 'bg-danger'}`}
                    >
                        {props.row.is_active === 'True' ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                </Table.Cell>
            );
        }
        return <Table.Cell {...props} />;
    };

    if (isLoading) return <div>Loading data...</div>;

    return (
        <>
            {alert.message && (
                <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: '', message: '' })}
                />
            )}

            <div className="data-table">
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
                    <TableHeaderRow showSortingControls />
                    <TableFilterRow />
                    <PagingPanel pageSizes={pageSizes} />
                </Grid>
            </div>

            {/* Delete Modal */}
            {showModal && (
                <form onSubmit={confirmDelete} className="modal d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Delete Client</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete this client?</p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-dark"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <SubmitButton isLoading={deleting} btnClass="btn btn-sm btn-danger" btnName="Delete" />
                            </div>
                        </div>
                    </div>
                </form>
            )}

            {showModal && <div className="modal-backdrop fade show"></div>}
        </>
    );
}
