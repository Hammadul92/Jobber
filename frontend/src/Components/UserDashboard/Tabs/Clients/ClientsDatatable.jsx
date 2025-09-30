import { useState, useEffect } from 'react';

import { Grid, Table, TableHeaderRow } from '@devexpress/dx-react-grid-bootstrap4';

import { useFetchClientsQuery } from '../../../../store';

export default function App() {
    const [rows, setRows] = useState([]);
    const [columns, setColumns] = useState([]);
    const { data: clientData, isLoading, error } = useFetchClientsQuery();

    useEffect(() => {
        if (clientData) {
            setRows(clientData.results);
            setColumns(clientData.columns);
        }
    }, [clientData]);

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
        <Grid rows={rows} columns={columns}>
            <Table />
            <TableHeaderRow />
        </Grid>
    );
}
