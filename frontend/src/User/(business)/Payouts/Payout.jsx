import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useFetchPayoutQuery, useRefundPayoutMutation } from "../../../store";
import SubmitButton from "../../../Components/ui/SubmitButton";
import Input from "../../../Components/ui/Input";
import Textarea from "../../../Components/ui/Textarea";
import AlertDispatcher from "../../../Components/ui/AlertDispatcher";
import LoadingScreen from "../../../Components/ui/LoadingScreen";
import { formatDate } from "../../../utils/formatDate";
import { setTopbar, resetTopbar } from "../../../store/topbarSlice";

const STATUS_STYLES = {
  PAID: "bg-emerald-100 text-emerald-700",
  REFUNDED: "bg-amber-100 text-amber-700",
  FAILED: "bg-rose-100 text-rose-700",
  PENDING: "bg-slate-100 text-slate-600",
};

export default function Payout({ token, role }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    data: payoutData,
    isLoading,
    error,
  } = useFetchPayoutQuery(id, {
    skip: !token,
  });

  const [refundPayout, { isLoading: refunding }] = useRefundPayoutMutation();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [alert, setAlert] = useState({ type: "", message: "" });

  useEffect(() => {
    const serviceName = payoutData?.service_name;
    const clientName = payoutData?.client_name;

    dispatch(
      setTopbar({
        title:
          serviceName && clientName
            ? `${serviceName} payout for ${clientName}`
            : payoutData?.invoice_number || "Payout",
        description: "Review payout status, timing, amount, and refund activity.",
        action: null,
      }),
    );

    return () => {
      dispatch(resetTopbar());
    };
  }, [dispatch, payoutData]);

  const handleRefund = async (e) => {
    e.preventDefault();
    try {
      await refundPayout({ id, amount, reason }).unwrap();
      setAlert({
        type: "success",
        message: "Refund request submitted successfully.",
      });
      setAmount("");
      setReason("");
    } catch (err) {
      setAlert({
        type: "danger",
        message:
          err?.data?.detail || err?.data?.error || "Failed to refund payout. Please try again.",
      });
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <AlertDispatcher
        type="danger"
        message={error?.data?.detail || "Failed to load payout."}
        onClose={() => setAlert({ type: "", message: "" })}
      />
    );
  }

  const badgeClass = STATUS_STYLES[payoutData?.status] || STATUS_STYLES.PENDING;
  const grossAmount = Number.parseFloat(payoutData?.amount || 0);
  const stripeFee = grossAmount > 0 ? grossAmount * 0.029 + 0.3 : 0;
  const netPayout = Math.max(grossAmount - stripeFee, 0);
  const payoutCurrency = payoutData?.currency || "";
  const canRefund = role === "MANAGER" && payoutData?.status === "PAID" && !payoutData?.is_refunded;

  return (
    <>
      {alert.message && (
        <AlertDispatcher
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: "", message: "" })}
        />
      )}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-3xl font-medium tracking-tight text-slate-900">
            {payoutData?.invoice_number || "Payout"}
          </h3>
          <span
            className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold ${badgeClass}`}
          >
            {payoutData?.status}
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
              Payout Summary
            </p>

            <div className="mt-5 space-y-4 text-slate-700">
              <SummaryRow label="Client" value={payoutData?.client_name} />
              <SummaryRow label="Service" value={payoutData?.service_name} />
              <SummaryRow
                label="Processed"
                value={
                  payoutData?.processed_at
                    ? formatDate(payoutData.processed_at)
                    : "Not processed yet"
                }
              />
              <SummaryRow
                label="Created"
                value={
                  payoutData?.created_at ? formatDate(payoutData.created_at) : "-"
                }
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
              Amount Details
            </p>

            <div className="mt-5 space-y-3">
              <SummaryRow
                label="Gross Amount"
                value={`${grossAmount.toFixed(2)} ${payoutCurrency}`}
              />
              <SummaryRow
                label="Stripe Fee"
                value={`${stripeFee.toFixed(2)} ${payoutCurrency}`}
              />
              {payoutData?.refunded_amount && (
                <SummaryRow
                  label="Refunded"
                  value={`${payoutData.refunded_amount} ${payoutCurrency}`}
                />
              )}
              <div className="mt-4 rounded-2xl bg-secondary px-4 py-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/70">
                  Payout Total
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {netPayout.toFixed(2)} {payoutCurrency}
                </p>
                <p className="mt-1 text-xs text-white/70">
                  Net after Stripe fees
                </p>
              </div>
            </div>
          </div>

          {payoutData?.failure_reason && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              Failure reason: {payoutData.failure_reason}
            </div>
          )}
        </div>

        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Refund Request
                </p>
                <h4 className="mt-2 text-2xl font-semibold text-slate-900">
                  Refund payout for {payoutData?.invoice_number}
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  Submit a full or partial refund request for this payout record.
                </p>
              </div>
            </div>

            <form onSubmit={handleRefund} className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  type="number"
                  value={amount}
                  onChange={setAmount}
                  placeholder="Enter refund amount"
                  label="Amount"
                  id="refund-amount"
                  fieldClass="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-800 focus:border-[#ff6a00] focus:outline-none focus:ring-2 focus:ring-[#ff6a00]/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                  isDisabled={!canRefund}
                />

                <Input
                  type="text"
                  value={payoutData?.status || ""}
                  onChange={() => {}}
                  label="Current Status"
                  id="payout-status"
                  fieldClass="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-800 focus:border-[#ff6a00] focus:outline-none focus:ring-2 focus:ring-[#ff6a00]/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                  isDisabled={true}
                />
              </div>

              <div className="mt-5">
                <Textarea
                  id="payout-reason"
                  label="Reason"
                  value={reason}
                  onChange={setReason}
                  isRequired={false}
                  isDisabled={!canRefund}
                  fieldClass="h-40 w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-slate-700"
                  rows={6}
                  placeholder="Reason for refund"
                />
              </div>

              {!canRefund && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {role !== "MANAGER"
                    ? "Only managers can request refunds."
                    : payoutData?.is_refunded
                      ? "This payout has already been refunded."
                      : "Only paid payouts can be refunded."}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                  onClick={() => navigate("/user/business/payouts")}
                >
                  Cancel
                </button>
                <SubmitButton
                  isLoading={refunding}
                  btnClass="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#ff7a1f]"
                  btnName="Submit Refund"
                  disabled={!canRefund}
                />
              </div>
            </form>
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
