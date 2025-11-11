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
import { useFetchInvoicesQuery, useDeleteInvoiceMutation } from '../../../../store';
import SubmitButton from '../../../../utils/SubmitButton';
import AlertDispatcher from '../../../../utils/AlertDispatcher';
import { formatDate } from '../../../../utils/formatDate';

export default function InvoiceDatatable({ token, role }) {
    const [rows, setRows] = useState([]);
    const [columns, setColumns] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
    const [alert, setAlert] = useState({ type: '', message: '' });

    const { data: invoiceData, isLoading, error } = useFetchInvoicesQuery(undefined, { skip: !token });
    const [deleteInvoice, { isLoading: deleting }] = useDeleteInvoiceMutation();

    const [sortingStateColumnExtensions] = useState([{ columnName: 'actions', sortingEnabled: false }]);
    const [defaultSorting] = useState([]);
    const [filteringStateColumnExtensions] = useState([{ columnName: 'actions', filteringEnabled: false }]);

    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [pageSizes] = useState([20, 30, 50]);

    useEffect(() => {
        if (invoiceData) {
            setRows(invoiceData.results);
            generateColumns(invoiceData.columns);
        }
    }, [invoiceData]);

    useEffect(() => {
        if (error) {
            setAlert({ type: 'danger', message: error?.data?.detail || 'Failed to load invoice data.' });
        }
    }, [error]);

    const generateColumns = (columns) => {
        const updatedColumns = [...columns, { name: 'actions', title: 'Actions' }];
        setColumns(updatedColumns);
    };

    const handleDeleteClick = (id) => {
        setSelectedInvoiceId(id);
        setShowModal(true);
    };

    const confirmDelete = async (e) => {
        e.preventDefault();
        if (!selectedInvoiceId) return;

        try {
            await deleteInvoice(selectedInvoiceId).unwrap();
            setAlert({ type: 'success', message: 'Invoice deleted successfully!' });
            setShowModal(false);
            setSelectedInvoiceId(null);
        } catch (err) {
            setAlert({ type: 'danger', message: err?.data?.detail || 'Failed to delete invoice.' });
            console.error('Failed to delete invoice:', err);
        }
    };

    const Cell = (props) => {
        if (props.column.name === 'actions') {
            return (
                <Table.Cell {...props}>
                    <Link
                        to={`/dashboard/invoice/${props.row.id}`}
                        className="badge bg-light rounded-circle p-2 me-2 text-secondary"
                        title="View Invoice"
                    >
                        <i className="fa fa-pencil"></i>
                    </Link>

                    {role === 'MANAGER' && (
                        <button
                            className="badge bg-light rounded-circle p-2 me-2 text-secondary border-0"
                            onClick={() => handleDeleteClick(props.row.id)}
                            title="Delete Invoice"
                        >
                            <i className="fa fa-trash-alt"></i>
                        </button>
                    )}
                </Table.Cell>
            );
        } else if (props.column.name === 'invoice_number') {
            const statusColor =
                props.row.status === 'PAID'
                    ? 'bg-success'
                    : props.row.status === 'SENT'
                      ? 'bg-primary'
                      : props.row.status === 'CANCELLED'
                        ? 'bg-danger'
                        : 'bg-secondary';
            return (
                <Table.Cell {...props}>
                    {props.row.invoice_number}{' '}
                    <span className={`badge bg-gradient rounded-pill ${statusColor}`}>{props.row.status}</span>
                </Table.Cell>
            );
        } else if (props.column.name === 'due_date') {
            const dueDate = new Date(props.row.due_date);
            const today = new Date();
            const isOverdue = dueDate < today && props.row.status !== 'PAID' && props.row.status !== 'CANCELLED';

            return (
                <Table.Cell {...props}>
                    {formatDate(props.row.due_date)}{' '}
                    {isOverdue && <span className="badge bg-danger bg-gradient rounded-pill ms-2">Overdue</span>}
                </Table.Cell>
            );
        } else if (props.column.name === 'created_at') {
            return <Table.Cell {...props}>{formatDate(props.row.created_at)}</Table.Cell>;
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

            {showModal && (
                <form onSubmit={confirmDelete} className="modal d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Delete Invoice</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete this invoice?</p>
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
