import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFetchInvoiceQuery, useUpdateInvoiceMutation, useMakePaymentMutation } from '../../../../store';
import SubmitButton from '../../../../utils/SubmitButton';
import AlertDispatcher from '../../../../utils/AlertDispatcher';
import { formatDate } from '../../../../utils/formatDate';

export default function Invoice({ token, role, business }) {
    const { id } = useParams();

    const { data: invoiceData, isLoading, error } = useFetchInvoiceQuery(id, { skip: !token });
    const [updateInvoice, { isLoading: updatingInvoice }] = useUpdateInvoiceMutation();
    const [makePayment, { isLoading: processingPayment }] = useMakePaymentMutation();

    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [status, setStatus] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [subtotal, setSubtotal] = useState('');
    const [taxRate, setTaxRate] = useState('');
    const [taxAmount, setTaxAmount] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [currency, setCurrency] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [clientName, setClientName] = useState('');
    const [serviceName, setServiceName] = useState('');
    const [paidAt, setPaidAt] = useState('');
    const [alert, setAlert] = useState({ type: '', message: '' });

    useEffect(() => {
        if (invoiceData) {
            setInvoiceNumber(invoiceData.invoice_number || '');
            setStatus(invoiceData.status || '');
            setDueDate(invoiceData.due_date || '');
            setSubtotal(invoiceData.subtotal || '');
            setTaxRate(invoiceData.tax_rate || '');
            setTaxAmount(invoiceData.tax_amount || '');
            setTotalAmount(invoiceData.total_amount || '');
            setNotes(invoiceData.notes || '');
            setCurrency(invoiceData.currency || '');
            setBusinessName(invoiceData.business_name || '');
            setClientName(invoiceData.client_name || '');
            setServiceName(invoiceData.service_name || '');
            setPaidAt(invoiceData.paid_at || '');
        }
    }, [invoiceData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateInvoice({
                id,
                status,
                due_date: dueDate,
                subtotal,
                tax_rate: taxRate,
                tax_amount: taxAmount,
                total_amount: totalAmount,
                notes,
            }).unwrap();
            setAlert({ type: 'success', message: 'Invoice updated successfully.' });
        } catch (err) {
            console.error('Failed to update invoice:', err);
            setAlert({
                type: 'danger',
                message: err?.data?.detail || 'Failed to update invoice. Please try again.',
            });
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await updateInvoice({ id, status: newStatus }).unwrap();
            setStatus(newStatus);
            setAlert({ type: 'success', message: `Invoice marked as ${newStatus}.` });
        } catch (err) {
            setAlert({
                type: 'danger',
                message: err?.data?.detail || 'Failed to update invoice status.',
            });
        }
    };

    const handlePayment = async () => {
        try {
            const res = await makePayment(invoiceData.id).unwrap();
            setAlert({ type: 'success', message: res?.message || 'Payment successful!' });
            setStatus('PAID');
            if (res?.paid_at) setPaidAt(res.paid_at);
        } catch (err) {
            setAlert({
                type: 'danger',
                message: err?.data?.detail || 'Payment failed. Please try again.',
            });
        }
    };

    const isOverdue = () => {
        if (!dueDate || status === 'PAID') return false;
        const today = new Date();
        const due = new Date(dueDate);
        return due < today;
    };

    if (isLoading) return <div>Loading invoice...</div>;

    if (error) {
        return (
            <AlertDispatcher
                type="danger"
                message={error?.data?.detail || 'Failed to load invoice.'}
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

            <nav aria-label="breadcrumb" className="mb-3">
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
                    <li className="breadcrumb-item">
                        <Link to={`/dashboard/invoices`} className="text-success">
                            Invoices
                        </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        {invoiceNumber}
                    </li>
                </ol>
            </nav>

            <div className="row">
                {/* Left panel */}
                <div className="col-12 col-lg-3 mb-3">
                    <div className="text-center shadow-sm p-3 rounded">
                        <h4 className="mb-1">
                            {invoiceNumber}{' '}
                            <span className={`badge bg-gradient rounded-pill p-2 bg-${statusColor(status)}`}>
                                {status}
                            </span>
                        </h4>
                        <div className="mt-2 text-muted">
                            <div>
                                <strong>Business:</strong> {businessName}
                            </div>
                            <div>
                                <strong>Client:</strong> {clientName}
                            </div>
                            <div>
                                <strong>Service:</strong> {serviceName}
                            </div>
                            <div>
                                <strong>Currency:</strong> {currency}
                            </div>
                        </div>

                        {role === 'MANAGER' && (
                            <div className="d-flex justify-content-center gap-2 mt-2">
                                <button
                                    className="btn btn-primary btn-sm bg-gradient"
                                    disabled={status === 'SENT'}
                                    onClick={() => handleStatusChange('SENT')}
                                >
                                    Send
                                </button>
                                <button
                                    className="btn btn-success btn-sm bg-gradient"
                                    disabled={status === 'PAID'}
                                    onClick={() => handleStatusChange('PAID')}
                                >
                                    Mark Paid
                                </button>
                                <button
                                    className="btn btn-danger btn-sm bg-gradient"
                                    disabled={status === 'CANCELLED'}
                                    onClick={() => handleStatusChange('CANCELLED')}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        {role === 'CLIENT' && status !== 'PAID' && (
                            <div className="mt-3">
                                {invoiceData?.has_payment_method ? (
                                    <button
                                        className="btn btn-success btn-sm bg-gradient"
                                        onClick={handlePayment}
                                        disabled={processingPayment}
                                    >
                                        {processingPayment ? 'Processing...' : 'Make Payment'}
                                    </button>
                                ) : (
                                    <i>
                                        No active payment method found. Please{' '}
                                        <Link to="/user-account/banking" className="text-success">
                                            add a payment method
                                        </Link>{' '}
                                        to make payment.
                                    </i>
                                )}
                            </div>
                        )}

                        {status === 'PAID' && paidAt && (
                            <div className="mt-3 text-muted">
                                <strong>Paid on:</strong> {formatDate(paidAt)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right panel */}
                <div className="col-12 col-lg-9">
                    <div className="shadow-sm p-3 rounded position-relative">
                        {isOverdue() && (
                            <span
                                className="badge bg-danger bg-gradient rounded-pill fs-6 position-absolute"
                                style={{ top: '10px', right: '10px' }}
                            >
                                Overdue
                            </span>
                        )}

                        {role === 'MANAGER' ? (
                            <form onSubmit={handleSubmit} className="row">
                                <div className="col-md-4">
                                    <div className="field-wrapper">
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            required
                                        />
                                        <label className="form-label">Due Date (*)</label>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="field-wrapper">
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            value={subtotal}
                                            onChange={(e) => setSubtotal(e.target.value)}
                                            placeholder="Subtotal"
                                            required
                                        />
                                        <label className="form-label">Subtotal (*)</label>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="field-wrapper">
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            value={taxRate}
                                            onChange={(e) => setTaxRate(e.target.value)}
                                            placeholder="Tax Rate (%)"
                                        />
                                        <label className="form-label">Tax Rate (%) (*)</label>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="field-wrapper">
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            value={taxAmount}
                                            readOnly
                                        />
                                        <label className="form-label">Tax Amount</label>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="field-wrapper">
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            value={totalAmount}
                                            readOnly
                                        />
                                        <label className="form-label">Total Amount</label>
                                    </div>
                                </div>
                                <div className="col-md-12">
                                    <div className="field-wrapper">
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Optional notes or invoice description"
                                        ></textarea>
                                        <label className="form-label">Notes</label>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-end mt-3">
                                    <SubmitButton
                                        isLoading={updatingInvoice}
                                        btnClass="btn btn-success"
                                        btnName="Save Changes"
                                    />
                                </div>
                            </form>
                        ) : (
                            <div className="text-muted">
                                <h4 className="mb-3">Invoice Details</h4>
                                <div>
                                    <strong>Due Date:</strong> {formatDate(dueDate)}
                                </div>
                                <div>
                                    <strong>Subtotal:</strong> {subtotal} {currency}
                                </div>
                                <div>
                                    <strong>Tax:</strong> ({taxRate}%) {taxAmount} {currency}
                                </div>
                                <div>
                                    <strong>Total:</strong> {totalAmount} {currency}
                                </div>
                                {notes && (
                                    <div>
                                        <strong>Notes:</strong> {notes}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

function statusColor(status) {
    switch (status) {
        case 'PAID':
            return 'success';
        case 'SENT':
            return 'primary';
        case 'CANCELLED':
            return 'danger';
        default:
            return 'secondary';
    }
}
