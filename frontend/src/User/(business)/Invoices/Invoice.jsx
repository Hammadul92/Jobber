import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  useFetchInvoiceQuery,
  useUpdateInvoiceMutation,
  useMakePaymentMutation,
  useSendInvoiceMutation,
} from "../../../store";
import SubmitButton from "../../../Components/ui/SubmitButton";
import Input from "../../../Components/ui/Input";
import Textarea from "../../../Components/ui/Textarea";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import LoadingScreen from "../../../Components/ui/LoadingScreen";
import RecordLink from "../../../Components/ui/RecordLink";
import { formatDate } from "../../../utils/formatDate";
import { setTopbar, resetTopbar } from "../../../store/topbarSlice";
import { formatAddress } from "../../../utils/formatAddress";
import LineItemsTable from "../../../Components/ui/LineItemsTable";
import ConfirmCustomerNotification from "../../../Components/ui/ConfirmCustomerNotification";
import TransactionCompleteNotice from "../../../Components/ui/TransactionCompleteNotice";
import { isInvoicePastDue, paymentTermsLabel } from "../../../utils/paymentTerms";

const STATUS_STYLES = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-rose-100 text-rose-700",
};

const ACTION_BTN_BASE =
  "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed! disabled:opacity-60";

const ACTION_BTN_STYLES = {
  send: `${ACTION_BTN_BASE} border border-secondary bg-secondary text-white hover:bg-secondary/95`,
  paid: `${ACTION_BTN_BASE} border border-accent bg-accent text-white hover:bg-[#ff7a1f]`,
  cancel: `${ACTION_BTN_BASE} border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100`,
};

const CURRENCY_SYMBOLS = {
  CAD: "$",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

function formatMoney(value, currency = "CAD") {
  const amount = Number.parseFloat(value || 0);
  const formattedAmount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
  const symbol = CURRENCY_SYMBOLS[currency];
  const currencyLabel = currency || "CAD";

  return symbol
    ? `${symbol}${formattedAmount} ${currencyLabel}`
    : `${formattedAmount} ${currencyLabel}`.trim();
}

export default function Invoice({ token, role }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    data: invoiceData,
    isLoading,
    error,
  } = useFetchInvoiceQuery(id, { skip: !token, refetchOnMountOrArgChange: true });
  const [updateInvoice, { isLoading: updatingInvoice }] =
    useUpdateInvoiceMutation();
  const [makePayment, { isLoading: processingPayment }] =
    useMakePaymentMutation();
  const [sendInvoice, { isLoading: sendingInvoice }] = useSendInvoiceMutation();

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [status, setStatus] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [clientName, setClientName] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [confirmAction, setConfirmAction] = useState(null);
  const [completionMessage, setCompletionMessage] = useState("");

  const isLocked = status === "PAID" || invoiceData?.has_paid_payout;
  const canManage = invoiceData?.can_manage ?? role === "MANAGER";

  useEffect(() => {
    if (invoiceData) {
      setInvoiceNumber(invoiceData.invoice_number || "");
      setStatus(invoiceData.status || "");
      setDueDate(invoiceData.due_date || "");
      setPaymentTerms(invoiceData.payment_terms || "");
      setSubtotal(invoiceData.subtotal || "");
      setTaxRate(invoiceData.tax_rate || "");
      setTaxAmount(invoiceData.tax_amount || "");
      setTotalAmount(invoiceData.total_amount || "");
      setNotes(invoiceData.notes || "");
      setCurrency(invoiceData.currency || "");
      setBusinessName(invoiceData.business_name || "");
      setClientName(invoiceData.client_name || "");
      setServiceName(invoiceData.service_name || "");
      setPaidAt(invoiceData.paid_at || "");
    }
  }, [invoiceData]);

  useEffect(() => {
    dispatch(
      setTopbar({
        title:
          serviceName && clientName
            ? `${serviceName} invoice for ${clientName}`
            : invoiceNumber || "Invoice",
        description:
          "Review billing details, status, due date, and payment activity.",
        action: null,
      }),
    );

    return () => {
      dispatch(resetTopbar());
    };
  }, [dispatch, invoiceNumber, serviceName, clientName]);

  useEffect(() => {
    const sub = parseFloat(subtotal) || 0;
    const rate = parseFloat(taxRate) || 0;
    const tax = (sub * rate) / 100;
    setTaxAmount(tax.toFixed(2));
    setTotalAmount((sub + tax).toFixed(2));
  }, [subtotal, taxRate]);

  const saveInvoice = async (payload) => {
    try {
      await updateInvoice(payload).unwrap();
      setAlert({ type: "success", message: "Invoice updated successfully." });
    } catch (err) {
      setAlert({
        type: "danger",
        message:
          err?.data?.detail || "Failed to update invoice. Please try again.",
      });
    } finally {
      setConfirmAction(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { id, status, subtotal, tax_rate: taxRate, tax_amount: taxAmount, total_amount: totalAmount, notes };
    if (!paymentTerms || status === "DRAFT") payload.due_date = dueDate || null;
    if (invoiceData.status !== "SENT" && status === "SENT") {
      setConfirmAction({ type: "save", payload });
    } else {
      saveInvoice(payload);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateInvoice({ id, status: newStatus }).unwrap();
      setStatus(newStatus);
      setAlert({ type: "success", message: `Invoice marked as ${newStatus}.` });
    } catch (err) {
      setAlert({
        type: "danger",
        message: err?.data?.detail || "Failed to update invoice status.",
      });
    }
  };

  const handlePayment = async () => {
    if (processingPayment || status !== "SENT" || isLocked) return;
    try {
      const res = await makePayment(invoiceData.id).unwrap();
      setCompletionMessage("Payment complete. The business owner has been notified by email.");
      setStatus("PAID");
      if (res?.paid_at) setPaidAt(res.paid_at);
    } catch (err) {
      setAlert({
        type: "danger",
        message:
          err?.data?.detail || err?.data?.error ||
          "Payment failed. Please try again.",
      });
    }
  };

  const handleSendInvoice = async () => {
    if (sendingInvoice) return;
    try {
      const response = await sendInvoice(id).unwrap();
      setAlert({type: "success", message: response.detail});
    } catch (err) {
      setAlert({
        type: "danger",
        message: err?.data?.detail || "Invoice email could not be sent. Please try again.",
      });
    } finally {
      setConfirmAction(null);
    }
  };

  const isOverdue = () => {
    return isInvoicePastDue({ ...invoiceData, due_date: dueDate, status });
  };

  if (isLoading || (!invoiceData && !error)) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div role="alert" className="space-y-3 py-6">
        <h2 className="text-xl font-semibold">Invoice unavailable</h2>
        <p>
          {error?.status === 404
            ? "This invoice is unavailable for this account."
            : error?.data?.detail || "Failed to load invoice. Please try again."}
        </p>
        <Link to="/user/business/invoices" className="text-secondary underline">
          View your invoices
        </Link>
      </div>
    );
  }

  const badgeClass = STATUS_STYLES[status] || STATUS_STYLES.DRAFT;
  const disableSend = status === "CANCELLED" || isLocked || sendingInvoice;
  const disableMarkPaid = status === "PAID" || isLocked;
  const disableCancel = status === "CANCELLED" || isLocked;

  return (
    <>
      {alert.message && (
        <AlertDispatcher
          type={alert.type}
          message={alert.message}
          autoDismiss={0}
          onClose={() => setAlert({ type: "", message: "" })}
        />
      )}
      <ConfirmCustomerNotification
        open={role === "MANAGER" && Boolean(confirmAction)}
        detail={`Send invoice ${invoiceNumber || ""} to ${clientName || "the customer"}.`}
        onYes={() => {
          if (confirmAction?.type === "save") saveInvoice(confirmAction.payload);
          else if (confirmAction?.type === "send") handleSendInvoice();
        }}
        onNo={() => setConfirmAction(null)}
        isLoading={sendingInvoice || updatingInvoice}
      />
      <TransactionCompleteNotice
        message={completionMessage}
        onClose={() => setCompletionMessage("")}
      />

      {invoiceData?.has_paid_payout && canManage && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Payout has already been processed for this invoice.{" "}
          <Link
            to={`/user/business/payout/${invoiceData.payout_id}`}
            className="underline decoration-emerald-500"
          >
            View Payout
          </Link>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-3xl font-medium tracking-tight text-slate-900">
            {invoiceNumber || "Invoice"}
          </h3>
          <span
            className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold ${badgeClass}`}
          >
            {status || "DRAFT"}
          </span>
          {isOverdue() && (
            <span className="inline-flex items-center rounded-lg bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              OVERDUE
            </span>
          )}
        </div>

        {role === "MANAGER" && canManage && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={ACTION_BTN_STYLES.send}
              disabled={disableSend}
              onClick={() => setConfirmAction({ type: "send" })}
            >
              {sendingInvoice ? "Sending..." : status === "SENT" ? "Resend" : "Send"}
            </button>
            <button
              type="button"
              className={ACTION_BTN_STYLES.paid}
              disabled={disableMarkPaid}
              onClick={() => handleStatusChange("PAID")}
            >
              Mark Paid
            </button>
            <button
              type="button"
              className={ACTION_BTN_STYLES.cancel}
              disabled={disableCancel}
              onClick={() => handleStatusChange("CANCELLED")}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Bill To</p>
          <p className="mt-2 font-semibold text-slate-900">{invoiceData.client_company_name || clientName}</p>
          {invoiceData.client_company_name && <p className="text-sm text-slate-600">{clientName}</p>}
          <p className="mt-2 text-sm text-slate-700">Billing Address: {formatAddress(invoiceData, "billing")}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Service Location</p>
          <p className="mt-2 font-semibold text-slate-900">{serviceName}</p>
          <p className="mt-2 text-sm text-slate-700">Service Address: {formatAddress(invoiceData, "service")}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        {canManage && (
          <div className="space-y-4 lg:col-span-4">
            <div className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                Billing Summary
              </p>

              <div className="mt-5 space-y-4 text-slate-700">
                <SummaryRow label="Business" value={businessName} />
                <SummaryRow
                  label="Client"
                  value={
                    <RecordLink
                      to={invoiceData?.client ? `/user/business/client/${invoiceData.client}` : null}
                      className="text-slate-900"
                    >
                      {clientName}
                    </RecordLink>
                  }
                />
                <SummaryRow
                  label="Service"
                  value={
                    <RecordLink
                      to={invoiceData?.service ? `/user/business/service/${invoiceData.service}` : null}
                      className="text-slate-900"
                    >
                      {serviceName}
                    </RecordLink>
                  }
                />
                <SummaryRow label="Currency" value={currency} />
                <SummaryRow
                  label="Created"
                  value={
                    invoiceData?.created_at
                      ? formatDate(invoiceData.created_at)
                      : "-"
                  }
                />
                <SummaryRow
                  label="Due Date"
                  value={dueDate ? formatDate(dueDate) : "Set when sent"}
                />
                {paymentTerms && <SummaryRow label="Payment Terms" value={paymentTermsLabel(paymentTerms)} />}
              </div>

              {status === "PAID" && paidAt && (
                <div className="mt-5 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                  Paid on {formatDate(paidAt)}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                Amount Details
              </p>

              <div className="mt-5 space-y-3">
                <AmountRow
                  label="Subtotal"
                  value={formatMoney(subtotal, currency)}
                />
                <AmountRow label="Tax Rate" value={`${taxRate || 0}%`} />
                <AmountRow
                  label="Tax Amount"
                  value={formatMoney(taxAmount, currency)}
                />
                <AmountRow
                  label="Total Amount"
                  value={formatMoney(totalAmount, currency)}
                />
              </div>
            </div>
          </div>
        )}

        <div className={`min-w-0 ${canManage ? "lg:col-span-8" : "lg:col-span-12"}`}>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {canManage ? (
              <form onSubmit={handleSubmit}>
                <div className="mb-6"><LineItemsTable items={invoiceData?.line_items || []} currency={currency} subtotal={subtotal} taxRate={taxRate} taxAmount={taxAmount} total={totalAmount} /></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    type="date"
                    fieldClass="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-800 focus:border-[#ff6a00] focus:outline-none focus:ring-2 focus:ring-[#ff6a00]/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                    value={dueDate}
                    onChange={setDueDate}
                    isRequired={!paymentTerms}
                    isDisabled={isLocked || Boolean(paymentTerms && status !== "DRAFT")}
                    label="Due Date"
                    id="invoice-due-date"
                  />

                  <Input
                    type="number"
                    fieldClass="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-800 focus:border-[#ff6a00] focus:outline-none focus:ring-2 focus:ring-[#ff6a00]/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                    value={subtotal}
                    onChange={setSubtotal}
                    isRequired={true}
                    isDisabled={isLocked || invoiceData?.line_items_locked}
                    label="Subtotal"
                    id="invoice-subtotal"
                  />

                  <Input
                    type="number"
                    fieldClass="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-800 focus:border-[#ff6a00] focus:outline-none focus:ring-2 focus:ring-[#ff6a00]/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                    value={taxRate}
                    onChange={setTaxRate}
                    isRequired={true}
                    isDisabled={isLocked}
                    label="Tax Rate (%)"
                    id="invoice-tax-rate"
                  />

                  <Input
                    type="number"
                    fieldClass="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-800 focus:border-[#ff6a00] focus:outline-none focus:ring-2 focus:ring-[#ff6a00]/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                    value={taxAmount}
                    onChange={() => {}}
                    isDisabled={true}
                    label="Tax Amount"
                    id="invoice-tax-amount"
                  />

                  <Input
                    type="number"
                    fieldClass="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-800 focus:border-[#ff6a00] focus:outline-none focus:ring-2 focus:ring-[#ff6a00]/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                    value={totalAmount}
                    onChange={() => {}}
                    isDisabled={true}
                    label="Total Amount"
                    id="invoice-total-amount"
                  />
                </div>

                <div className="mt-5">
                  <Textarea
                    id="invoice-notes"
                    label="Notes"
                    value={notes}
                    onChange={setNotes}
                    isRequired={false}
                    isDisabled={isLocked}
                    fieldClass="h-40 w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-slate-700"
                    rows={6}
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                    onClick={() => navigate("/user/business/invoices")}
                  >
                    Cancel
                  </button>
                  <SubmitButton
                    isLoading={updatingInvoice}
                    btnClass="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#ff7a1f]"
                    btnName="Save Changes"
                    isDisabled={isLocked}
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
                dueDate={dueDate}
                paymentTerms={paymentTerms}
                refundedAmount={invoiceData?.refunded_amount}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-base font-semibold text-slate-900">
        {value || "-"}
      </span>
    </div>
  );
}

function AmountRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 text-slate-700">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-base font-semibold text-slate-900">{value}</span>
    </div>
  );
}

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
  dueDate,
  paymentTerms,
  refundedAmount,
}) {
  const hasRefund = Number.parseFloat(refundedAmount || 0) > 0;
  const calculatedTax = (
    (parseFloat(subtotal || 0) * parseFloat(taxRate || 0)) /
    100
  );
  const formattedTotal = formatMoney(totalAmount, currency);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-6 py-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
            Invoice
          </p>
          <h4 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            {invoiceNumber}
          </h4>
          <p className="mt-2 text-sm text-slate-500 md:text-base">
            Issued by {businessName} for {clientName}
          </p>
        </div>

        <div className="min-w-[220px] rounded-2xl bg-secondary px-5 py-4 text-right text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/70">
            Total Due
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {formattedTotal}
          </p>
          {hasRefund && (
            <p className="mt-1 text-sm text-white/80">
              Refunded {formatMoney(refundedAmount, currency)}
            </p>
          )}
        </div>
      </div>

      <div className={`grid gap-4 px-6 py-6 ${paymentTerms ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Service
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {serviceName}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Due Date
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {dueDate ? formatDate(dueDate) : "Set when sent"}
          </p>
        </div>
        {paymentTerms && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Payment Terms</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{paymentTermsLabel(paymentTerms)}</p>
          </div>
        )}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Status
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                STATUS_STYLES[status] || STATUS_STYLES.DRAFT
              }`}
            >
              {status}
            </span>
            {isOverdue() && (
              <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                Overdue
              </span>
            )}
            {status === "PAID" && paidAt && (
              <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                Paid {formatDate(paidAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <LineItemsTable items={invoiceData?.line_items || []} currency={currency} subtotal={subtotal} taxRate={taxRate} taxAmount={calculatedTax} total={totalAmount} />
      </div>

      <div className="border-t border-slate-100 px-6 py-6">
        {notes && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <h6 className="text-sm font-semibold text-slate-900">Notes</h6>
            <p className="mt-2 text-sm leading-6 text-slate-600">{notes}</p>
          </div>
        )}

        {status === "SENT" && !invoiceData?.has_paid_payout && (
          <div className={`${notes ? "mt-5" : ""} flex justify-end`}>
            {invoiceData?.has_payment_method ? (
              <button
                className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accentLight disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handlePayment}
                disabled={processingPayment}
              >
                {processingPayment
                  ? "Processing..."
                  : `Pay ${formattedTotal}`}
              </button>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                No active payment method found. Please{" "}
                <Link
                  to="/user/banking"
                  className="font-semibold text-secondary hover:text-accent"
                >
                  add a payment method
                </Link>{" "}
                to make payment.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
