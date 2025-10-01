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

export default function App() {
    const [rows, setRows] = useState([]);
    const [columns, setColumns] = useState([]);

    const { data: clientData, isLoading, error } = useFetchClientsQuery();
    const [deleteClient, { isLoading: deleting }] = useDeleteClientMutation();

    const [sortingStateColumnExtensions] = useState([{ columnName: 'actions', sortingEnabled: false }]);
    const [defaultSorting] = useState([{ columnName: 'id', direction: 'desc' }]);
    const [filteringStateColumnExtensions] = useState([{ columnName: 'actions', filteringEnabled: false }]);

    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [pageSizes] = useState([20, 30, 50]);

    const [showModal, setShowModal] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState(null);

    useEffect(() => {
        if (clientData) {
            setRows(clientData.results);
            generateColumns(clientData.columns);
        }
    }, [clientData]);

    const generateColumns = (columns) => {
        const updatedColumns = [...columns, { name: 'actions', title: 'Actions' }];
        setColumns(updatedColumns);
    };

    const handleDeleteClick = (id) => {
        setSelectedClientId(id);
        setShowModal(true);
    };

    const confirmDelete = async () => {
        if (!selectedClientId) return;

        try {
            await deleteClient(selectedClientId).unwrap();
            setShowModal(false);
            setSelectedClientId(null);
        } catch (err) {
            console.error('Failed to delete client:', err);
        }
    };

    const Cell = (props) => {
        if (props.column.name === 'actions') {
            return (
                <Table.Cell {...props}>
                    <Link to={`/dashboard/client/${props.row.id}`} className="btn p-0 me-2 text-secondary">
                        Edit
                    </Link>
                    <button className="btn p-0 text-danger" onClick={() => handleDeleteClick(props.row.id)}>
                        {deleting && selectedClientId === props.row.id ? 'Deleting...' : 'Delete'}
                    </button>
                </Table.Cell>
            );
        }
        return <Table.Cell {...props} />;
    };

    if (isLoading) {
        return <div>Loading data...</div>;
    }

    if (error) {
        return (
            <div className="alert alert-danger" role="alert">
                {error?.data?.detail || 'Failed to load client data. Please try again later.'}
            </div>
        );
    }

    return (
        <>
            <div>
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

            {/* Delete Confirmation Modal */}
            {showModal && (
                <div className="modal d-block" tabIndex="-1" role="dialog">
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
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={confirmDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Backdrop */}
            {showModal && <div className="modal-backdrop fade show"></div>}
        </>
    );
}
