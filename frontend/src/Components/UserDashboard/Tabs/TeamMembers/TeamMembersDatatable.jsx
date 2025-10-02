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
import { useFetchTeamMembersQuery, useDeleteTeamMemberMutation } from '../../../../store';

export default function TeamMembersDatatable({ token }) {
    const [rows, setRows] = useState([]);
    const [columns, setColumns] = useState([]);

    const {
        data: teamMemberData,
        isLoading,
        error,
    } = useFetchTeamMembersQuery(undefined, {
        skip: !token,
    });

    const [deleteTeamMember, { isLoading: deleting }] = useDeleteTeamMemberMutation();

    const [sortingStateColumnExtensions] = useState([{ columnName: 'actions', sortingEnabled: false }]);
    const [defaultSorting] = useState([]);
    const [filteringStateColumnExtensions] = useState([{ columnName: 'actions', filteringEnabled: false }]);

    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [pageSizes] = useState([20, 30, 50]);

    const [showModal, setShowModal] = useState(false);
    const [selectedTeamMemberId, setSelectedTeamMemberId] = useState(null);

    useEffect(() => {
        if (teamMemberData) {
            setRows(teamMemberData.results);
            generateColumns(teamMemberData.columns);
        }
    }, [teamMemberData]);

    const generateColumns = (columns) => {
        const updatedColumns = [...columns, { name: 'actions', title: 'Actions' }];
        setColumns(updatedColumns);
    };

    const handleDeleteClick = (id) => {
        setSelectedTeamMemberId(id);
        setShowModal(true);
    };

    const confirmDelete = async () => {
        if (!selectedTeamMemberId) return;

        try {
            await deleteTeamMember(selectedTeamMemberId).unwrap();
            setShowModal(false);
            setSelectedTeamMemberId(null);
        } catch (err) {
            console.error('Failed to delete team member:', err);
        }
    };

    const Cell = (props) => {
        if (props.column.name === 'actions') {
            return (
                <Table.Cell {...props}>
                    <Link
                        to={`/dashboard/team-member/${props.row.id}`}
                        className="badge bg-light rounded-circle p-2 me-2 text-secondary"
                    >
                        <i className="fa fa-pencil"></i>
                    </Link>
                    <button
                        className="badge bg-light rounded-circle p-2 text-secondary border-0"
                        onClick={() => handleDeleteClick(props.row.id)}
                        disabled={props.row.role === 'MANAGER'}
                    >
                        <i className="fa fa-trash-alt"></i>
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
                {error?.data?.detail || 'Failed to load team member data. Please try again later.'}
            </div>
        );
    }

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

            {/* Delete Confirmation Modal */}
            {showModal && (
                <div className="modal d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Delete Team Member</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete this team member?</p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-dark"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-danger"
                                    onClick={confirmDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                                aria-hidden="true"
                                            ></span>
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showModal && <div className="modal-backdrop fade show"></div>}
        </>
    );
}
