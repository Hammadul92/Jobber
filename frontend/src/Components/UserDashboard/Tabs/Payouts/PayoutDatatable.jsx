import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

    useEffect(() => {
        if (payoutData) {
            setRows(payoutData.results);
            setColumns([...(payoutData.columns || []), { name: 'actions', title: 'Actions' }]);
        }
    }, [payoutData]);

    useEffect(() => {
        if (error) {
            setAlert({ type: 'danger', message: error?.data?.detail || 'Failed to load payout data.' });
        }
    }, [error]);

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

    const statusBadge = (status) => {
        if (status === 'PAID') return 'bg-emerald-100 text-emerald-700';
        if (status === 'PENDING') return 'bg-amber-100 text-amber-700';
        return 'bg-rose-100 text-rose-700';
    };

    if (isLoading) return <div className="py-10 text-center text-sm text-gray-500">Loading payouts...</div>;

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
                        <h4 className="text-lg font-semibold text-gray-900">Payouts</h4>
                        <p className="text-xs text-gray-500">View processed payouts and their status.</p>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-b-2xl min-h-[67vh] max-h-[65vh] overflow-auto">
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
                                                                to={`/dashboard/payout/${row.id}`}
                                                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-secondary transition hover:border-secondary hover:text-accent"
                                                                title="View Payout"
                                                            >
                                                                View
                                                            </Link>

                                                            {role === 'MANAGER' && (
                                                                <button
                                                                    type="button"
                                                                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-rose-200 hover:text-rose-700"
                                                                    onClick={() => handleDeleteClick(row.id)}
                                                                    title="Delete Payout"
                                                                >
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            if (col.name === 'processed_at') {
                                                return (
                                                    <td key={col.name} className="px-4 py-3 text-gray-700">
                                                        {formatDate(row[col.name])}
                                                    </td>
                                                );
                                            }

                                            if (col.name === 'invoice_number') {
                                                return (
                                                    <td key={col.name} className="px-4 py-3 text-gray-900">
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-semibold text-gray-900">{row[col.name]}</span>
                                                            <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${statusBadge(row.status)}`}>
                                                                {row.status}
                                                            </span>
                                                        </div>
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
                                        No payouts found.
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
                            <h5 className="text-lg font-semibold text-gray-900">Delete Payout</h5>
                            <button
                                type="button"
                                className="text-gray-400 transition hover:text-gray-600"
                                onClick={() => setShowModal(false)}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="mt-3 text-sm text-gray-600">Are you sure you want to delete this payout?</p>

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
