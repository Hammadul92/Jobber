import { useState, useEffect } from "react";
import { FaPen, FaTrashAlt } from "react-icons/fa";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import StripeCardForm from "./StripeCardForm";
import BankAccountForm from "./BankAccountForm";
import {
  useFetchBusinessesQuery,
  useFetchBankingInformationListQuery,
  useDeleteBankingInformationMutation,
  useCheckBankAccountMutation,
} from "../../store";
import SubmitButton from "../../Components/ui/SubmitButton";
import LoadingScreen from "../../Components/ui/LoadingScreen";
import {
  LuShieldCheck,
  LuCreditCard,
  LuPlus,
  LuInfo,
  LuBuilding2,
  LuArrowUpRight,
  LuLandmark,
  LuUserRound,
  LuBriefcaseBusiness,
  LuGlobe,
  LuBadgeDollarSign,
  LuUnplug,
} from "react-icons/lu";
import { NavLink } from "react-router-dom";

const stripePromise = loadStripe(
  "pk_test_51SLr7cRuypPIYSuTPWUFePiiEIVEbhvXQVRYQD75FQgO9Xoc3GwzezuEGBwV7Dgxy2l5r2MY3bXgc3Ou4DkbmNeJ0085c8HpC8",
);

export default function BankingInformation({ token, setAlert = () => { } }) {
  const [showBankForm, setShowBankForm] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);

  const { data: businesses = [], isLoading: businessLoading } =
    useFetchBusinessesQuery(undefined, {
      skip: !token,
    });

  const {
    data: bankingInfo = [],
    isLoading: bankingInfoLoading,
    refetch: refetchBankingInfo,
  } = useFetchBankingInformationListQuery(undefined, {
    skip: !token,
  });

  const activeBank = bankingInfo.find(
    (i) => i.payment_method_type === "BANK_ACCOUNT",
  );
  const activeCard = bankingInfo.find((i) => i.payment_method_type === "CARD");
  const isBankConnected = Boolean(activeBank?.account_number_last4);

  const [checkBankAccount, { isLoading: syncingBank }] =
    useCheckBankAccountMutation();

  useEffect(() => {
    if (activeBank && !activeBank.account_number_last4) {
      checkBankAccount().catch((err) =>
        setAlert({
          type: "danger",
          message: err?.data?.detail || "Bank account sync failed.",
        }),
      );
    }
  }, [activeBank, checkBankAccount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!showCardForm && token) {
      refetchBankingInfo();
    }
  }, [showCardForm, token, refetchBankingInfo]);

  const [deleteBankingInformation, { isLoading: deleting }] =
    useDeleteBankingInformationMutation();

  const formatExpiry = (month, year) => {
    if (!month || !year) return "";
    const date = new Date(2000, month - 1);
    const monthName = date.toLocaleString("default", { month: "short" });
    return `${monthName} ${year}`;
  };

  const formatAccountHolderType = (value) => {
    if (!value) return "Business";
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  if (businessLoading || bankingInfoLoading || syncingBank) {
    return <LoadingScreen />;
  }

  const hasBusiness = Array.isArray(businesses) && businesses.length > 0;

  const handleDeleteClick = (id) => {
    setSelectedPaymentId(id);
    setShowModal(true);
  };

  const confirmDelete = async (e) => {
    e.preventDefault();
    if (!selectedPaymentId) return;

    try {
      await deleteBankingInformation(selectedPaymentId).unwrap();
      setShowModal(false);
      setSelectedPaymentId(null);
      setAlert({
        type: "success",
        message: "Payment method deleted successfully.",
      });
    } catch (err) {
      setAlert({
        type: "danger",
        message:
          err?.data?.detail ||
          "Failed to delete payment method. Please try again.",
      });
    }
  };

  const actionBtn =
    "inline-flex items-center gap-2 rounded-lg bg-secondary px-2 py-1.5 text-sm font-medium text-white shadow-sm transition hover:shadow-lg transition";

  return (
    <>
      <div className="space-y-10">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-1">
              Banking & Payments
            </h2>
            <p className="text-gray-500">
              Manage your payout methods and platform payment cards.
            </p>
          </div>
          <div className="hidden md:flex items-center justify-between gap-2 bg-white rounded-2xl shadow-md p-4">
            <div className="rounded-md bg-green-100 p-1">
              <LuShieldCheck className="text-green-600 text-3xl" />
            </div>
            <div>
              <p className="tracking-wide font-semibold text-xs text-gray-400">
                ACCOUNT SECURITY
              </p>
              <p className="text-green-600 font-semibold text-sm">
                Verified Secure
              </p>
            </div>
          </div>
        </div>

        {hasBusiness && (
          <div className="rounded-2xl bg-white shadow-md ">
            {/* Header */}
            <div className="flex flex-wrap md:flex-nowrap items-start justify-between p-4 md:p-10">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-gray-50 rounded-lg">
                  <LuBuilding2 className="text-gray-400 text-2xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl">
                    Bank Account (Payouts)
                  </h3>
                  <p className="text-gray-400">
                    Recieve funds directly to your connected bank account.
                  </p>
                </div>
              </div>
              <div
                className={`border ${!isBankConnected ? "border-gray-200 bg-gray-100" : "border-green-300 bg-green-100"} px-3 pb-0.5 ml-10 md:ml-0 mt-2 md:mt-0 lg:pt-1 lg:pb-1.5 rounded-full`}
              >
                <div
                  className={`w-2 h-2 rounded-full inline-flex mr-2 ${!isBankConnected ? "bg-gray-400" : "bg-green-500"}`}
                />
                <p className="text-xs font-bold uppercase inline-flex text-gray-400">
                  {!isBankConnected ? "Not Connected" : "Active"}
                </p>
              </div>
            </div>
            {/* Body */}
            <div className="border-t border-gray-200 p-4 md:px-10 md:py-8">
              {!isBankConnected || showBankForm ? (
                <BankAccountForm
                  onSuccess={() => setShowBankForm(false)}
                  setAlert={setAlert}
                />
              ) : (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 md:p-5">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col items-start gap-4 md:flex-row">
                          <LuShieldCheck className="text-5xl text-green-600" />
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 md:text-2xl">
                              Stripe Connected
                            </h4>
                            <p className="mt-1.5 text-sm text-gray-600 md:text-base">
                              Your Stripe account is successfully connected.
                            </p>

                            <div className="mt-0 flex flex-wrap items-center gap-3 text-sm">
                              <p className="text-sm text-gray-600 md:text-base">
                                Connected as:{" "}
                                <span className="font-semibold text-gray-900">
                                  {businesses?.[0]?.email || "Stripe account"}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="inline-flex max-w-full items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 text-gray-800">
                          <div className="rounded-xl bg-slate-50 p-2 text-slate-700">
                            <LuLandmark className="text-xl" />
                          </div>
                          <p className="text-base font-semibold uppercase tracking-wide text-slate-700 md:text-lg">
                            {activeBank.bank_name} •••• {activeBank.account_number_last4}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                        <button
                          className="inline-flex items-center gap-2 rounded-2xl bg-secondary px-4 py-2.5 font-medium text-white shadow-sm transition hover:shadow-lg md:px-5"
                          onClick={() => setShowBankForm(true)}
                        >
                          <FaPen />
                          Replace
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 font-medium text-gray-700 shadow-sm transition hover:border-red-200 hover:text-red-600 md:px-5"
                          onClick={() => handleDeleteClick(activeBank.id)}
                        >
                          <LuUnplug />
                          Disconnect
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-emerald-200 pt-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="flex items-center gap-3 rounded-2xl bg-white/65 px-4 py-3.5">
                          <div className="rounded-full bg-green-50 p-2.5 text-green-600">
                            <LuUserRound className="text-xl" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                              Account Holder
                            </p>
                            <p className="truncate text-lg font-semibold text-gray-900">
                              {activeBank.account_holder_name ||
                                businesses?.[0]?.name ||
                                "Not available"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-2xl bg-white/65 px-4 py-3.5">
                          <div className="rounded-full bg-green-50 p-2.5 text-green-600">
                            <LuBriefcaseBusiness className="text-xl" />
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                              Account Type
                            </p>
                            <p className="text-lg font-semibold text-gray-900">
                              {formatAccountHolderType(
                                activeBank.account_holder_type,
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-2xl bg-white/65 px-4 py-3.5">
                          <div className="rounded-full bg-green-50 p-2.5 text-green-600">
                            <LuGlobe className="text-xl" />
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                              Country
                            </p>
                            <p className="text-lg font-semibold text-gray-900">
                              {activeBank.country || businesses?.[0]?.country || "-"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-2xl bg-white/65 px-4 py-3.5">
                          <div className="rounded-full bg-green-50 p-2.5 text-green-600">
                            <LuBadgeDollarSign className="text-xl" />
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                              Currency
                            </p>
                            <p className="text-lg font-semibold uppercase text-gray-900">
                              {activeBank.currency || "CAD"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 md:p-8 text-amber-800 font-light flex items-start gap-3 mt-8">
                <div className="bg-amber-100 px-2 md:p-2 rounded-lg mt-1">
                  <LuInfo className="text-amber-600 text-6xl md:text-2xl" />
                </div>
                <div>
                  <p className="md:text-xl">
                    You receive payouts directly to your connected bank account
                    after Stripe fees of{" "}
                    <span className="font-semibold">2.9%</span> +{" "}
                    <span className="font-semibold">$0.30</span> are deducted.
                  </p>
                  <p className="md:text-lg mt-1">
                    For a $100.00 transaction, you'll receive{" "}
                    <span className="font-semibold">$96.80</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History Link */}
        {hasBusiness && (
          <NavLink to="/user/business/payouts" className="block">
            <div className="flex items-center justify-between gap-2 p-4 md:p-10 rounded-2xl shadow-md bg-white hover:shadow-lg transition">
              <div className="flex items-center gap-3">
                <div className="bg-[#EEF2FF] p-1 md:p-2 rounded-lg">
                  <LuArrowUpRight className="text-[#4F39F6] text-3xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    View Transaction History
                  </h3>
                  <p className="text-sm text-gray-400">
                    Track your recent payouts and fees.
                  </p>
                </div>
              </div>
              <div className="border border-gray-200 p-2 rounded-full">
                <LuArrowUpRight className="text-gray-400 text-xl" />
              </div>
            </div>
          </NavLink>
        )}

        <div className="rounded-2xl bg-white shadow-md ">
          {/* Header */}
          <div className="flex items-start justify-between p-4 md:p-10">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 bg-gray-50 rounded-lg">
                <LuCreditCard className="text-gray-400 text-2xl" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">Credit/Debit Card</h3>
                <p className="text-gray-400">
                  Add a card for platform payments
                </p>
              </div>
            </div>
            <div>
              <button
                type="button"
                onClick={() => setShowCardForm(true)}
                className="hidden md:flex items-center gap-2 font-semibold border border-gray-300 rounded-2xl px-3 py-2 text-gray-600 hover:shadow transition"
              >
                <LuPlus className="text-lg" />
                Add Card
              </button>
            </div>
          </div>
          {/* Body */}
          <div className="border-t border-gray-200 px-4 py-8 md:px-10 lg:py-16 flex flex-col items-center">
            {!activeCard ? (
              <>
                <div className="bg-gray-50 p-5 rounded-full">
                  <LuCreditCard className="text-5xl text-gray-300" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold my-2 text-center">
                  No payment method added yet
                </h3>
                <p className="max-w-xs w-84 text-gray-400 md:text-lg text-center">
                  Add a credit or debit card to pay for your platform
                  subscription and transaction fees.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCardForm(true)}
                  className="mt-6 md:mt-10 flex items-center gap-2 rounded-xl bg-accent px-6 py-3 md:text-lg font-semibold text-white shadow hover:shadow-md shadow-accent transition"
                >
                  Add Payment Method
                </button>
              </>
            ) : (
              <div className="w-full flex flex-wrap items-center justify-between gap-3 text-sm bg-background p-3 rounded-xl text-gray-800">
                <span>
                  <strong>{activeCard.card_brand?.toUpperCase()}</strong> ••••
                  •••• •••• {activeCard.card_last4}
                </span>
                <span className="text-gray-500">
                  Expires{" "}
                  {formatExpiry(
                    activeCard.card_exp_month,
                    activeCard.card_exp_year,
                  )}
                </span>
                <div className="flex items-center gap-2 text-sm md:text-base">
                  <button
                    className={actionBtn}
                    onClick={() => setShowCardForm(true)}
                  >
                    <FaPen />
                    Replace
                  </button>
                  <button
                    className={actionBtn}
                    onClick={() => handleDeleteClick(activeCard.id)}
                  >
                    <FaTrashAlt />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 p-3 pt-10 flex items-center justify-between border-t border-gray-300 text-gray-400">
          <div className="flex items-start md:items-center gap-8">
            <p>
              &copy; {new Date().getFullYear()}{" "}
              {businesses[0]?.name || "Business Name"}. All rights reserved.
            </p>
            <div className="space-x-3 md:space-x-8 font-bold">
              <NavLink to="/terms-of-service" className="hover:text-accent">
                Terms
              </NavLink>
              <NavLink to="/privacy-policy" className="hover:text-accent">
                Privacy
              </NavLink>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="inline-flex h-3 w-3 rounded-full bg-green-600" />
            <p className="text-gray-400 font-semibold">SYSTEMS OPERATIONAL</p>
          </div>
        </div>
      </div>

      {showCardForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShowCardForm(false)}
        >
          <div
            className="w-2xl max-w-2xl rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h5 className="text-lg font-semibold text-gray-900">
                {activeCard ? "Replace Card" : "Add Card"}
              </h5>
              <button
                type="button"
                className="text-sm font-semibold text-gray-500 underline-offset-4 transition hover:text-accent"
                onClick={() => setShowCardForm(false)}
              >
                Cancel
              </button>
            </div>
            <div className="px-6 py-5">
              <Elements stripe={stripePromise}>
                <StripeCardForm
                  onSuccess={() => setShowCardForm(false)}
                  setAlert={setAlert}
                />
              </Elements>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <form
          onSubmit={confirmDelete}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-w-lg w-2/7 rounded-xl bg-white shadow-xl space-y-5">
            <div className="border-b border-gray-50 px-5 py-4">
              <h5 className="text-xl font-medium text-gray-900">
                Delete Payment Method
              </h5>
            </div>
            <div className="px-5 py-4 text-sm text-gray-700">
              Are you sure you want to delete this payment method?
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-50 px-5 py-4">
              <button
                type="button"
                className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <SubmitButton
                isLoading={deleting}
                btnClass="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100"
                btnName="Delete"
              />
            </div>
          </div>
        </form>
      )}
    </>
  );
}
