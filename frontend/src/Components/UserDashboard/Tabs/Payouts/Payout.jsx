import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFetchPayoutQuery, useRefundPayoutMutation } from '../../../../store';
import SubmitButton from '../../../ui/SubmitButton';
import Input from '../../../ui/Input';
import AlertDispatcher from '../../../ui/AlertDispatcher';
import { formatDate } from '../../../../utils/formatDate';

export default function Payout({ token, role, business }) {
    const { id } = useParams();

    const {
        data: payoutData,
        isLoading,
        error,
    } = useFetchPayoutQuery(id, {
        skip: !token,
    });

    const [refundPayout, { isLoading: refunding }] = useRefundPayoutMutation();
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [alert, setAlert] = useState({ type: '', message: '' });

    const handleRefund = async (e) => {
        e.preventDefault();
        try {
            await refundPayout({ id, amount, reason }).unwrap();
            setAlert({ type: 'success', message: 'Refund request submitted successfully.' });
            setAmount('');
            setReason('');
        } catch (err) {
            setAlert({
                type: 'danger',
                message: err?.data?.detail || 'Failed to refund payout. Please try again.',
            });
        }
    };

    if (isLoading) return <div className="py-10 text-center text-sm text-gray-500">Loading payout...</div>;

    if (error) {
        return (
            <AlertDispatcher
                type="danger"
                message={error?.data?.detail || 'Failed to load payout.'}
                onClose={() => setAlert({ type: '', message: '' })}
            />
        );
    }

    return (
        <>
            {alert.message && (
                <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: '', message: '' })}
                />
            )}

            <nav aria-label="breadcrumb" className="mb-4">
                <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <li>
                        <Link to={`/`} className="font-semibold text-secondary hover:text-accent">
                            Contractorz
                        </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li>
                        <Link to="/dashboard/home" className="font-semibold text-secondary hover:text-accent">
                            {business?.name ||
                                (role === 'CLIENT'
                                    ? 'Client Portal'
                                    : role === 'EMPLOYEE'
                                        ? 'Employee Portal'
                                        : 'Dashboard')}
                        </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li>
                        <Link to={`/dashboard/payouts`} className="font-semibold text-secondary hover:text-accent">
                            Payouts
                        </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li className="font-semibold text-gray-800">Payout for {payoutData?.invoice_number}</li>
                </ol>
            </nav>

            <div className="grid gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4">
                    <div className="relative rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <span
                            className={`absolute right-4 top-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                payoutData?.status === 'PAID'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-rose-100 text-rose-700'
                            }`}
                        >
                            {payoutData?.status}
                        </span>

                        <h4 className="mb-1 text-lg font-semibold text-gray-900">{payoutData?.invoice_number}</h4>
                        <p className="text-sm text-gray-500">Processed payout details</p>

                        <div className="mt-4 space-y-2 text-sm text-gray-700">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Amount</span>
                                <span className="font-semibold text-gray-900">
                                    {payoutData?.amount} {payoutData?.currency}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Created</span>
                                <span className="font-semibold text-gray-800">{formatDate(payoutData?.created_at)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Updated</span>
                                <span className="font-semibold text-gray-800">{formatDate(payoutData?.updated_at)}</span>
                            </div>
                            {payoutData?.failure_reason && (
                                <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                                    Failure: {payoutData?.failure_reason}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8">
                    <form className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" onSubmit={handleRefund}>
                        <Input
                            type="number"
                            value={amount}
                            onChange={setAmount}
                            placeholder="Enter refund amount"
                            label="Amount"
                            id="refund-amount"
                        />

                        <div className="mt-3">
                            <label className="mb-1 block text-sm font-semibold text-gray-700">Reason</label>
                            <textarea
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                                rows="3"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Reason for refund"
                            ></textarea>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <SubmitButton
                                isLoading={refunding}
                                btnClass="bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accentLight"
                                btnName="Submit Refund"
                                disabled={role !== 'MANAGER'}
                            />
                        </div>

                        {role !== 'MANAGER' && (
                            <p className="mt-2 text-xs text-gray-500">Only managers can request refunds.</p>
                        )}
                    </form>
                </div>
            </div>
        </>
    );
}
