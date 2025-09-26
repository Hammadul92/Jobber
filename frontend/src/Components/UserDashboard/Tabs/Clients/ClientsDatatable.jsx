import React, { useEffect, useMemo, useState } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table';

// Mock API call (simulates server-side processing)
async function fetchData({ pageIndex, pageSize, sortBy, filters }) {
    const allData = [
        { id: 1, name: 'John Doe', age: 28, email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', age: 34, email: 'jane@example.com' },
        { id: 3, name: 'Alice Brown', age: 22, email: 'alice@example.com' },
        { id: 4, name: 'Bob Johnson', age: 45, email: 'bob@example.com' },
        { id: 5, name: 'Charlie Davis', age: 30, email: 'charlie@example.com' },
        { id: 6, name: 'David Wilson', age: 29, email: 'david@example.com' },
    ];

    // Apply filtering
    let filteredData = allData;
    filters.forEach((f) => {
        if (f.value) {
            filteredData = filteredData.filter((row) =>
                String(row[f.id]).toLowerCase().includes(f.value.toLowerCase())
            );
        }
    });

    // Apply sorting
    if (sortBy.length > 0) {
        const { id, desc } = sortBy[0];
        filteredData.sort((a, b) => {
            if (a[id] < b[id]) return desc ? 1 : -1;
            if (a[id] > b[id]) return desc ? -1 : 1;
            return 0;
        });
    }

    // Apply pagination
    const start = pageIndex * pageSize;
    const paginatedData = filteredData.slice(start, start + pageSize);

    return {
        rows: paginatedData,
        total: filteredData.length,
    };
}

export default function DataTable() {
    const [data, setData] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const [sorting, setSorting] = useState([]);
    const [columnFilters, setColumnFilters] = useState([]);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 25,
    });

    const columns = useMemo(
        () => [
            {
                accessorKey: 'id',
                header: 'ID',
            },
            {
                accessorKey: 'name',
                header: ({ column }) => (
                    <button
                        className="btn btn-link p-0"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Name {column.getIsSorted() === 'asc' ? '↑' : column.getIsSorted() === 'desc' ? '↓' : ''}
                    </button>
                ),
            },
            {
                accessorKey: 'age',
                header: ({ column }) => (
                    <button
                        className="btn btn-link p-0"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Age {column.getIsSorted() === 'asc' ? '↑' : column.getIsSorted() === 'desc' ? '↓' : ''}
                    </button>
                ),
            },
            {
                accessorKey: 'email',
                header: 'Email',
            },
        ],
        []
    );

    const table = useReactTable({
        data,
        columns,
        pageCount,
        state: {
            sorting,
            columnFilters,
            pagination,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        manualSorting: true,
        manualPagination: true,
        manualFiltering: true,
    });

    // Fetch data whenever state changes
    useEffect(() => {
        setLoading(true);
        fetchData({
            pageIndex: pagination.pageIndex,
            pageSize: pagination.pageSize,
            sortBy: sorting,
            filters: columnFilters,
        }).then((res) => {
            setData(res.rows);
            setPageCount(Math.ceil(res.total / pagination.pageSize));
            setLoading(false);
        });
    }, [sorting, pagination.pageIndex, pagination.pageSize, columnFilters]);

    return (
        <div>
            {/* Column Search Inputs */}
            <div className="mb-3 d-flex gap-2">
                {table
                    .getAllColumns()
                    .map((column) =>
                        column.getCanFilter() ? (
                            <input
                                key={column.id}
                                type="text"
                                placeholder={`Search ${column.id}`}
                                value={column.getFilterValue() ?? ''}
                                onChange={(e) => column.setFilterValue(e.target.value)}
                                className="form-control w-auto"
                            />
                        ) : null
                    )}
            </div>

            {/* Table */}
            <table className="table table-hover border">
                <thead className="table-light">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th key={header.id}>
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={columns.length} className="text-center">
                                Loading...
                            </td>
                        </tr>
                    ) : (
                        table.getRowModel().rows.map((row) => (
                            <tr key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="d-flex align-items-center">
                <button
                    className="btn border-0"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    <i className="fa fa-angle-left"></i>
                </button>
                <span>
                    Page {table.getState().pagination.pageIndex + 1} of {pageCount}
                </span>
                <button className="btn border-0" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                    <i className="fa fa-angle-right"></i>
                </button>
            </div>
        </div>
    );
}
