import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFetchInvoicesQuery, useDeleteInvoiceMutation } from '../../../../store';
import SubmitButton from '../../../ui/SubmitButton';
import AlertDispatcher from '../../../ui/AlertDispatcher';
import { formatDate } from '../../../../utils/formatDate';

export default function InvoiceDatatable({ token, role }) {
    const [rows, setRows] = useState([]);
    const [columns, setColumns] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
    const [alert, setAlert] = useState({ type: '', message: '' });

    const { data: invoiceData, isLoading, error } = useFetchInvoicesQuery(undefined, { skip: !token });
    const [deleteInvoice, { isLoading: deleting }] = useDeleteInvoiceMutation();

    useEffect(() => {
        if (invoiceData) {
            setRows(invoiceData.results);
            setColumns([...(invoiceData.columns || []), { name: 'actions', title: 'Actions' }]);
        }
    }, [invoiceData]);

    useEffect(() => {
        if (error) {
            setAlert({ type: 'danger', message: error?.data?.detail || 'Failed to load invoice data.' });
        }
    }, [error]);

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

    const statusBadge = (status) => {
        if (status === 'PAID') return 'bg-emerald-100 text-emerald-700';
        if (status === 'SENT') return 'bg-blue-100 text-blue-700';
        if (status === 'CANCELLED') return 'bg-rose-100 text-rose-700';
        return 'bg-gray-100 text-gray-700';
    };

    const isOverdue = (row) => {
        const dueDate = new Date(row.due_date);
        const today = new Date();
        return dueDate < today && row.status !== 'PAID' && row.status !== 'CANCELLED';
    };

    if (isLoading) return <div className="py-10 text-center text-sm text-gray-500">Loading data...</div>;

    return (
        <>
            {alert.message && (
                <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: '', message: '' })}
                />
            )}

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900">Invoices</h4>
                        <p className="text-xs text-gray-500">Review billing, due dates, and payment status.</p>
                    </div>
                </div>

                <div className="overflow-x-auto  rounded-b-2xl min-h-[65vh] max-h-[65vh] overflow-auto">
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                {columns.map((col) => (
                                    <th
                                        key={col.name}
                                        scope="col"
                                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                                    >
                                        {col.title}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {rows?.length ? (
                                rows.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50">
                                        {columns.map((col) => {
                                            if (col.name === 'actions') {
                                                return (
                                                    <td key={col.name} className="px-4 py-3 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Link
                                                                to={`/dashboard/invoice/${row.id}`}
                                                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-secondary transition hover:border-secondary hover:text-accent"
                                                                title="View Invoice"
                                                            >
                                                                View
                                                            </Link>

                                                            {role === 'MANAGER' && (
                                                                <button
                                                                    type="button"
                                                                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-rose-200 hover:text-rose-700"
                                                                    onClick={() => handleDeleteClick(row.id)}
                                                                    title="Delete Invoice"
                                                                >
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            if (col.name === 'invoice_number') {
                                                return (
                                                    <td key={col.name} className="px-4 py-3 text-gray-900">
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-semibold text-gray-900">{row[col.name]}</span>
                                                            {row.status !== 'SENT' && (
                                                                <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${statusBadge(row.status)}`}>
                                                                    {row.status}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            if (col.name === 'due_date') {
                                                return (
                                                    <td key={col.name} className="px-4 py-3 text-gray-700">
                                                        <div className="flex items-center gap-2">
                                                            <span>{formatDate(row[col.name])}</span>
                                                            {isOverdue(row) && (
                                                                <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                                                                    Overdue
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            if (col.name === 'created_at') {
                                                return (
                                                    <td key={col.name} className="px-4 py-3 text-gray-700">
                                                        {formatDate(row[col.name])}
                                                    </td>
                                                );
                                            }

                                            return (
                                                <td key={col.name} className="px-4 py-3 text-gray-700">
                                                    {row[col.name] ?? '—'}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className="px-4 py-6 text-center text-sm font-semibold text-gray-400">
                                        No invoices found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-gray-900/40" onClick={() => setShowModal(false)}></div>

                    <form
                        onSubmit={confirmDelete}
                        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="flex items-center justify-between">
                            <h5 className="text-lg font-semibold text-gray-900">Delete Invoice</h5>
                            <button
                                type="button"
                                className="text-gray-400 transition hover:text-gray-600"
                                onClick={() => setShowModal(false)}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="mt-3 text-sm text-gray-600">Are you sure you want to delete this invoice?</p>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <SubmitButton
                                isLoading={deleting}
                                btnClass="bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"
                                btnName="Delete"
                            />
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
