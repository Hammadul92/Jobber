import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFetchPayoutQuery, useRefundPayoutMutation } from '../../../../store';
import SubmitButton from '../../../../utils/SubmitButton';
import AlertDispatcher from '../../../../utils/AlertDispatcher';
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

    if (isLoading) return <div>Loading payout...</div>;

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

            {/* Breadcrumbs */}
            <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to={`/`} className="text-success">
                            Contractorz
                        </Link>
                    </li>
                    <li className="breadcrumb-item">
                        <Link to="/dashboard/home" className="text-success">
                            {business?.name ||
                                (role === 'CLIENT'
                                    ? 'Client Portal'
                                    : role === 'EMPLOYEE'
                                      ? 'Employee Portal'
                                      : 'Dashboard')}
                        </Link>
                    </li>
                    <li className="breadcrumb-item" aria-current="page">
                        <Link to={`/dashboard/payouts`} className="text-success">
                            Payouts
                        </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        Payout for {payoutData?.invoice_number}
                    </li>
                </ol>
            </nav>

            <div className="row mt-4">
                {/* LEFT CARD */}
                <div className="col-12 col-lg-3 mb-3">
                    <div className="shadow-sm border p-3 rounded text-center">
                        <h4 className="mb-1 fw-bold">Payout for {payoutData?.invoice_number}</h4>
                        <span
                            className={`badge rounded-pill p-2 bg-gradient bg-${payoutData?.status === 'PAID' ? 'success' : 'danger'}`}
                        >
                            {payoutData?.status}
                        </span>

                        <div className="d-flex flex-column small text-muted mt-3">
                            <div>
                                Amount: {payoutData?.amount} {payoutData?.currency}
                            </div>
                            <div>Created: {formatDate(payoutData?.created_at)}</div>
                            <div>Updated: {formatDate(payoutData?.updated_at)}</div>
                            {payoutData?.failure_reason && (
                                <div className="text-danger mt-2">Failure: {payoutData?.failure_reason}</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE — REFUND FORM */}
                <div className="col-12 col-lg-9">
                    <form className="shadow-sm border p-3 rounded" onSubmit={handleRefund}>
                        <p className="fw-bold mb-3">Refund Payout</p>

                        <div className="field-wrapper">
                            <input
                                type="number"
                                className="form-control"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter refund amount"
                            />
                            <label className="form-label">Amount</label>
                        </div>

                        <div className="field-wrapper">
                            <textarea
                                className="form-control"
                                rows="3"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Reason for refund"
                            ></textarea>
                            <label className="form-label">Reason</label>
                        </div>

                        {/* Manager permission check */}
                        <div className="d-flex justify-content-end mt-3">
                            <SubmitButton
                                isLoading={refunding}
                                btnClass="btn btn-success"
                                btnName="Submit Refund"
                                disabled={role !== 'MANAGER'}
                            />
                        </div>

                        {role !== 'MANAGER' && (
                            <p className="small text-muted mt-2">Only managers can request refunds.</p>
                        )}
                    </form>
                </div>
            </div>
        </>
    );
}
