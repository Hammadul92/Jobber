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
import { useFetchServiceQuestionnairesQuery, useDeleteServiceQuestionnaireMutation } from '../../../../store';

import SubmitButton from '../../../../utils/SubmitButton';

export default function ServiceQuestionnairesDatatable({ token, setAlert }) {
    const [rows, setRows] = useState([]);
    const [columns, setColumns] = useState([]);

    const {
        data: questionnaireData,
        isLoading,
        error,
    } = useFetchServiceQuestionnairesQuery(undefined, { skip: !token });

    const [deleteServiceQuestionnaire, { isLoading: deleting }] = useDeleteServiceQuestionnaireMutation();

    const [sortingStateColumnExtensions] = useState([{ columnName: 'actions', sortingEnabled: false }]);
    const [filteringStateColumnExtensions] = useState([{ columnName: 'actions', filteringEnabled: false }]);
    const [defaultSorting] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [pageSizes] = useState([20, 30, 50]);

    const [showModal, setShowModal] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    useEffect(() => {
        if (questionnaireData) {
            const data = questionnaireData.results || questionnaireData;
            setRows(data.results || data);
            generateColumns(questionnaireData.columns);
        }
    }, [questionnaireData]);

    useEffect(() => {
        if (error) {
            setAlert({
                type: 'danger',
                message: error?.data?.detail || 'Failed to load service questionnaires.',
            });
        }
    }, [error]);

    const generateColumns = (colsFromBackend) => {
        if (!colsFromBackend) return;
        const updatedCols = [...colsFromBackend, { name: 'actions', title: 'Actions' }];
        setColumns(updatedCols);
    };

    const handleDeleteClick = (id) => {
        setSelectedId(id);
        setShowModal(true);
    };

    const confirmDelete = async (e) => {
        e.preventDefault();
        if (!selectedId) return;

        try {
            await deleteServiceQuestionnaire(selectedId).unwrap();
            setAlert({ type: 'success', message: 'Service questionnaire deleted successfully!' });
            setShowModal(false);
            setSelectedId(null);
        } catch (err) {
            setAlert({ type: 'danger', message: err?.data?.detail || 'Failed to delete service questionnaire.' });
            console.error('Failed to delete service questionnaire:', err);
        }
    };

    const Cell = (props) => {
        if (props.column.name === 'actions') {
            return (
                <Table.Cell {...props}>
                    <Link
                        to={`/dashboard/service-questionnaire/${props.row.id}`}
                        className="badge bg-light rounded-circle p-2 me-2 text-secondary"
                        title="Edit Service Questionnaire"
                    >
                        <i className="fa fa-pencil"></i>
                    </Link>
                    <Link
                        to={`/dashboard/service-questionnaire/${props.row.id}/form`}
                        className="badge bg-light rounded-circle p-2 me-2 text-secondary"
                        title="Preview Service Questionnaire Form"
                    >
                        <i className="far fa-file"></i>
                    </Link>
                    <button
                        className="badge bg-light rounded-circle p-2 text-secondary border-0"
                        onClick={() => handleDeleteClick(props.row.id)}
                        title="Delete Service Questionnaire"
                    >
                        <i className="fa fa-trash-alt"></i>
                    </button>
                </Table.Cell>
            );
        }

        if (props.column.name === 'service_name') {
            return (
                <Table.Cell {...props}>
                    {props.row.service_name}{' '}
                    {props.row.is_active ? (
                        <span className="badge bg-gradient bg-success rounded-pill">ACTIVE</span>
                    ) : (
                        <span className="badge bg-gradient bg-danger rounded-pill">INACTIVE</span>
                    )}
                </Table.Cell>
            );
        }

        return <Table.Cell {...props} />;
    };

    if (isLoading) return <div>Loading data...</div>;

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
                                <h5 className="modal-title">Delete Service Questionnaire</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete this service questionnaire?</p>
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
