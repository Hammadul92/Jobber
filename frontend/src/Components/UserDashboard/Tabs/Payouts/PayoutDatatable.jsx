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
import { useFetchPayoutsQuery, useDeletePayoutMutation } from '../../../../store';
import SubmitButton from '../../../ui/SubmitButton';
import AlertDispatcher from '../../../ui/AlertDispatcher';
import { formatDate } from '../../../../utils/formatDate';

export default function PayoutDatatable({ token, role }) {
    const [rows, setRows] = useState([]);
    const [columns, setColumns] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedPayoutId, setSelectedPayoutId] = useState(null);
    const [alert, setAlert] = useState({ type: '', message: '' });

    const { data: payoutData, isLoading, error } = useFetchPayoutsQuery(undefined, { skip: !token });
    const [deletePayout, { isLoading: deleting }] = useDeletePayoutMutation();

    const [sortingStateColumnExtensions] = useState([{ columnName: 'actions', sortingEnabled: false }]);
    const [defaultSorting] = useState([]);
    const [filteringStateColumnExtensions] = useState([{ columnName: 'actions', filteringEnabled: false }]);

    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [pageSizes] = useState([20, 30, 50]);

    useEffect(() => {
        if (payoutData) {
            setRows(payoutData.results);
            generateColumns(payoutData.columns);
        }
    }, [payoutData]);

    useEffect(() => {
        if (error) {
            setAlert({ type: 'danger', message: error?.data?.detail || 'Failed to load payout data.' });
        }
    }, [error]);

    const generateColumns = (columns) => {
        const updatedColumns = [...columns, { name: 'actions', title: 'Actions' }];
        setColumns(updatedColumns);
    };

    const handleDeleteClick = (id) => {
        setSelectedPayoutId(id);
        setShowModal(true);
    };

    const confirmDelete = async (e) => {
        e.preventDefault();
        if (!selectedPayoutId) return;

        try {
            await deletePayout(selectedPayoutId).unwrap();
            setAlert({ type: 'success', message: 'Payout deleted successfully!' });
            setShowModal(false);
            setSelectedPayoutId(null);
        } catch (err) {
            setAlert({ type: 'danger', message: err?.data?.detail || 'Failed to delete payout.' });
        }
    };

    const Cell = (props) => {
        if (props.column.name === 'actions') {
            return (
                <Table.Cell {...props}>
                    <Link
                        to={`/dashboard/payout/${props.row.id}`}
                        className="btn btn-sm btn-light me-2"
                        title="View Payout"
                    >
                        <i className="fa fa-eye"></i> View
                    </Link>

                    {role === 'MANAGER' && (
                        <button
                            className="btn btn-sm btn-light"
                            onClick={() => handleDeleteClick(props.row.id)}
                            title="Delete Payout"
                        >
                            <i className="fa fa-trash-alt"></i> Delete
                        </button>
                    )}
                </Table.Cell>
            );
        } else if (props.column.name === 'processed_at') {
            return <Table.Cell {...props}>{formatDate(props.row.processed_at)}</Table.Cell>;
        } else if (props.column.name === 'invoice_number') {
            const color =
                props.row.status === 'PAID'
                    ? 'bg-success'
                    : props.row.status === 'PENDING'
                      ? 'bg-primary'
                      : 'bg-danger';

            return (
                <Table.Cell {...props}>
                    {props.row.invoice_number}{' '}
                    <span className={`badge bg-gradient rounded-pill ${color}`}>{props.row.status}</span>
                </Table.Cell>
            );
        }

        return <Table.Cell {...props} />;
    };

    if (isLoading) return <div>Loading payouts...</div>;

    return (
        <>
            {alert.message && (
                <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: '', message: '' })}
                />
            )}

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

            {showModal && (
                <form onSubmit={confirmDelete} className="modal d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Delete Payout</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete this payout?</p>
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
