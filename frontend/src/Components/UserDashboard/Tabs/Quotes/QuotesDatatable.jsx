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
import { useFetchQuotesQuery, useDeleteQuoteMutation } from '../../../../store';
import SubmitButton from '../../../../utils/SubmitButton';

export default function QuotesDatatable({ token, role }) {
    const [rows, setRows] = useState([]);
    const [columns, setColumns] = useState([]);

    const {
        data: quoteData,
        isLoading,
        error,
    } = useFetchQuotesQuery(undefined, {
        skip: !token,
    });
    const [deleteQuote, { isLoading: deleting }] = useDeleteQuoteMutation();

    const [sortingStateColumnExtensions] = useState([{ columnName: 'actions', sortingEnabled: false }]);
    const [filteringStateColumnExtensions] = useState([{ columnName: 'actions', filteringEnabled: false }]);
    const [defaultSorting] = useState([]);

    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [pageSizes] = useState([20, 30, 50]);

    const [showModal, setShowModal] = useState(false);
    const [selectedQuoteId, setSelectedQuoteId] = useState(null);

    useEffect(() => {
        if (quoteData) {
            setRows(quoteData.results);
            generateColumns(quoteData.columns);
        }
    }, [quoteData]);

    const generateColumns = (columns) => {
        const updatedColumns = [...columns, { name: 'actions', title: 'Actions' }];
        setColumns(updatedColumns);
    };

    const handleDeleteClick = (id) => {
        setSelectedQuoteId(id);
        setShowModal(true);
    };

    const confirmDelete = async (e) => {
        e.preventDefault();
        if (!selectedQuoteId) return;
        try {
            await deleteQuote(selectedQuoteId).unwrap();
            setShowModal(false);
            setSelectedQuoteId(null);
        } catch (err) {
            console.error('Failed to delete quote:', err);
        }
    };

    const Cell = (props) => {
        if (props.column.name === 'actions') {
            return (
                <Table.Cell {...props}>
                    {role === 'MANAGER' ? (
                        <Link
                            to={`/dashboard/quote/${props.row.id}`}
                            className="badge bg-light rounded-circle p-2 me-2 text-secondary"
                            title="Edit Quote"
                        >
                            <i className="fa fa-pencil"></i>
                        </Link>
                    ) : null}
                    {props.row.status !== 'DRAFT' ? (
                        <Link
                            to={`/dashboard/quote/sign/${props.row.id}`}
                            className="badge bg-light rounded-circle p-2 me-2 text-secondary"
                            title="Quote"
                        >
                            <i className="fas fa-file-signature" />
                        </Link>
                    ) : null}
                    {role === 'MANAGER' ? (
                        <button
                            className="badge bg-light rounded-circle p-2 me-2 text-secondary border-0"
                            onClick={() => handleDeleteClick(props.row.id)}
                            title="Delete Quote"
                        >
                            <i className="fa fa-trash-alt"></i>
                        </button>
                    ) : null}
                </Table.Cell>
            );
        }

        if (props.column.name === 'quote_number') {
            let badgeClass = 'bg-primary';
            if (props.row.status === 'SIGNED') badgeClass = 'bg-success';
            else if (['EXPIRED', 'DECLINED'].includes(props.row.status)) badgeClass = 'bg-danger';
            else if (props.row.status === 'DRAFT') badgeClass = 'bg-secondary';

            return (
                <Table.Cell {...props}>
                    {props.row.quote_number}{' '}
                    <span className={`badge rounded-pill ms-2 ${badgeClass}`}>{props.row.status}</span>
                </Table.Cell>
            );
        }

        return <Table.Cell {...props} />;
    };

    if (isLoading) return <div>Loading quotes...</div>;

    if (error)
        return (
            <div className="alert alert-danger" role="alert">
                {error?.data?.detail || 'Failed to load quotes. Please try again later.'}
            </div>
        );

    return (
        <>
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
                                <h5 className="modal-title">Delete Quote</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete this quote?</p>
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
