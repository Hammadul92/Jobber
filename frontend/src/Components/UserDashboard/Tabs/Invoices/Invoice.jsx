import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFetchInvoiceQuery, useUpdateInvoiceMutation, useMakePaymentMutation } from '../../../../store';
import SubmitButton from '../../../ui/SubmitButton';
import Input from '../../../ui/Input';
import AlertDispatcher from '../../../ui/AlertDispatcher';
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

    const isLocked = status === 'PAID' || invoiceData?.has_paid_payout;

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

    useEffect(() => {
        const sub = parseFloat(subtotal) || 0;
        const rate = parseFloat(taxRate) || 0;
        const tax = (sub * rate) / 100;
        setTaxAmount(tax.toFixed(2));
        setTotalAmount((sub + tax).toFixed(2));
    }, [subtotal, taxRate]);

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
        if (!dueDate || status === 'PAID' || status === 'CANCELLED') return false;
        return new Date(dueDate) < new Date();
    };

    if (isLoading) return <div className="py-10 text-center text-sm text-gray-500">Loading invoice...</div>;

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
                        <Link to={`/dashboard/invoices`} className="font-semibold text-secondary hover:text-accent">
                            Invoices
                        </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li className="font-semibold text-gray-800">{invoiceNumber}</li>
                </ol>
            </nav>

            {invoiceData?.has_paid_payout && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                    Payout has already been processed for this invoice.{' '}
                    <Link to={`/dashboard/payout/${invoiceData.payout_id}`} className="underline decoration-emerald-500">
                        View Payout
                    </Link>
                </div>
            )}

            <div className="grid gap-5 lg:grid-cols-12">
                {role === 'MANAGER' && (
                    <div className="lg:col-span-4">
                        <div className="relative rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <span
                                className={`absolute right-4 top-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                    status === 'PAID'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : status === 'SENT'
                                            ? 'bg-blue-100 text-blue-700'
                                            : status === 'CANCELLED'
                                                ? 'bg-rose-100 text-rose-700'
                                                : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                                {status}
                            </span>

                            <h4 className="mb-1 text-lg font-semibold text-gray-900">{invoiceNumber}</h4>
                            <p className="text-sm text-gray-500">Billing summary</p>

                            <div className="mt-4 space-y-2 text-sm text-gray-700">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Business</span>
                                    <span className="font-semibold text-gray-900">{businessName}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Client</span>
                                    <span className="font-semibold text-gray-900">{clientName}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Service</span>
                                    <span className="font-semibold text-gray-900">{serviceName}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Currency</span>
                                    <span className="font-semibold text-gray-900">{currency}</span>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
                                    disabled={status === 'SENT' || isLocked}
                                    onClick={() => handleStatusChange('SENT')}
                                >
                                    Send
                                </button>
                                <button
                                    type="button"
                                    className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                                    disabled={status === 'PAID' || isLocked}
                                    onClick={() => handleStatusChange('PAID')}
                                >
                                    Mark Paid
                                </button>
                                <button
                                    type="button"
                                    className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
                                    disabled={status === 'CANCELLED' || isLocked}
                                    onClick={() => handleStatusChange('CANCELLED')}
                                >
                                    Cancel
                                </button>
                            </div>

                            {status === 'PAID' && paidAt && (
                                <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                                    Paid on: {formatDate(paidAt)}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className={role === 'MANAGER' ? 'lg:col-span-8' : 'lg:col-span-12'}>
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        {role === 'MANAGER' ? (
                            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                                <Input
                                    type="date"
                                    fieldClass="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                                    value={dueDate}
                                    onChange={setDueDate}
                                    isRequired={true}
                                    isDisabled={isLocked}
                                    label="Due Date"
                                    id="invoice-due-date"
                                />

                                <Input
                                    type="number"
                                    fieldClass="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                                    value={subtotal}
                                    onChange={setSubtotal}
                                    isRequired={true}
                                    isDisabled={isLocked}
                                    label="Subtotal"
                                    id="invoice-subtotal"
                                />

                                <Input
                                    type="number"
                                    fieldClass="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                                    value={taxRate}
                                    onChange={setTaxRate}
                                    isRequired={true}
                                    isDisabled={isLocked}
                                    label="Tax Rate (%)"
                                    id="invoice-tax-rate"
                                />

                                <Input
                                    type="number"
                                    fieldClass="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                                    value={taxAmount}
                                    onChange={() => {}}
                                    isDisabled={true}
                                    label="Tax Amount"
                                    id="invoice-tax-amount"
                                />

                                <Input
                                    type="number"
                                    fieldClass="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                                    value={totalAmount}
                                    onChange={() => {}}
                                    isDisabled={true}
                                    label="Total Amount"
                                    id="invoice-total-amount"
                                />

                                <div className="md:col-span-2">
                                    <label className="mb-1 block text-sm font-semibold text-gray-700">Notes</label>
                                    <textarea
                                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                                        rows="3"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        disabled={isLocked}
                                    />
                                </div>

                                <div className="md:col-span-2 mt-2 flex justify-end">
                                    <SubmitButton
                                        isLoading={updatingInvoice}
                                        btnClass="bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accentLight"
                                        btnName="Save Changes"
                                        disabled={isLocked}
                                    />
                                </div>
                            </form>
                        ) : (
                            <CustomerView
                                invoiceData={invoiceData}
                                totalAmount={totalAmount}
                                currency={currency}
                                isOverdue={isOverdue}
                                paidAt={paidAt}
                                handlePayment={handlePayment}
                                processingPayment={processingPayment}
                                status={status}
                                businessName={businessName}
                                clientName={clientName}
                                invoiceNumber={invoiceNumber}
                                notes={notes}
                                taxRate={taxRate}
                                subtotal={subtotal}
                                serviceName={serviceName}
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

// Extracted Customer View for cleaner code
function CustomerView({
    invoiceData,
    totalAmount,
    currency,
    isOverdue,
    paidAt,
    handlePayment,
    processingPayment,
    status,
    businessName,
    clientName,
    invoiceNumber,
    notes,
    taxRate,
    subtotal,
    serviceName,
}) {
    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                    <h3 className="text-xl font-semibold text-gray-900">Invoice</h3>
                    <p className="text-sm text-gray-500">#{invoiceNumber}</p>
                </div>
                <div className="text-right">
                    <h5 className="text-lg font-semibold text-gray-900">{businessName}</h5>
                    <p className="text-sm text-gray-500">{formatDate(invoiceData?.created_at)}</p>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Bill From</p>
                    <p className="text-sm font-semibold text-gray-900">{businessName}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Bill To</p>
                    <p className="text-sm font-semibold text-gray-900">{clientName}</p>
                </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Service</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Subtotal</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Tax ({taxRate}%)</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-t border-gray-100">
                            <td className="px-4 py-3 text-gray-800">{serviceName}</td>
                            <td className="px-4 py-3 text-right text-gray-800">
                                {subtotal} {currency}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-800">
                                {((parseFloat(subtotal) * parseFloat(taxRate)) / 100).toFixed(2)} {currency}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-900 font-semibold">
                                {totalAmount} {currency}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="font-semibold text-gray-800">Due Date:</span>
                    <span>{formatDate(invoiceData?.due_date)}</span>
                    {isOverdue() && (
                        <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                            Overdue
                        </span>
                    )}
                    {status === 'PAID' && paidAt && (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            Paid {formatDate(paidAt)}
                        </span>
                    )}
                </div>
            </div>

            {notes && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <h6 className="text-sm font-semibold text-gray-900">Notes</h6>
                    <p className="text-sm text-gray-600">{notes}</p>
                </div>
            )}

            {status !== 'PAID' && (
                <div className="text-right">
                    {invoiceData?.has_payment_method ? (
                        <button
                            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentLight disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={handlePayment}
                            disabled={processingPayment}
                        >
                            {processingPayment ? 'Processing...' : `Pay ${totalAmount} ${currency}`}
                        </button>
                    ) : (
                        <div className="text-sm text-gray-500">
                            <i>
                                No active payment method found. Please{' '}
                                <Link to="/user-account/banking" className="font-semibold text-secondary hover:text-accent">
                                    add a payment method
                                </Link>{' '}
                                to make payment.
                            </i>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
