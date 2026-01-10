import { useState, useEffect } from 'react';
import { FaCreditCard, FaPen, FaTrashAlt } from 'react-icons/fa';
import { FaBuildingColumns } from 'react-icons/fa6';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripeCardForm from './StripeCardForm';
import BankAccountForm from './BankAccountForm';
import {
    useFetchBusinessesQuery,
    useFetchBankingInformationListQuery,
    useDeleteBankingInformationMutation,
    useCheckBankAccountMutation,
    useUpdateBankingInformationMutation,
} from '../../store';
import SubmitButton from '../ui/SubmitButton';

const stripePromise = loadStripe(
    'pk_test_51SLr7cRuypPIYSuTPWUFePiiEIVEbhvXQVRYQD75FQgO9Xoc3GwzezuEGBwV7Dgxy2l5r2MY3bXgc3Ou4DkbmNeJ0085c8HpC8'
);

export default function BankingInformation({ token, setAlert }) {
    const { data: businesses = [], isLoading: businessLoading } = useFetchBusinessesQuery(undefined, {
        skip: !token,
    });

    const { data: bankingInfo = [], isLoading: bankingInfoLoading } = useFetchBankingInformationListQuery(undefined, {
        skip: !token,
    });

    const activeBank = bankingInfo.find((i) => i.payment_method_type === 'BANK_ACCOUNT');
    const activeCard = bankingInfo.find((i) => i.payment_method_type === 'CARD');

    const [checkBankAccount, { isLoading: syncingBank }] = useCheckBankAccountMutation();
    const [updateBankingInformation, { isLoading: updatingAutoPay }] = useUpdateBankingInformationMutation();

    useEffect(() => {
        if (activeBank && !activeBank.account_number_last4) {
            checkBankAccount().catch((err) =>
                setAlert({
                    type: 'danger',
                    message: err?.data?.detail || 'Bank account sync failed.',
                })
            );
        }
    }, [activeBank, checkBankAccount]);

    const [deleteBankingInformation, { isLoading: deleting }] = useDeleteBankingInformationMutation();

    const [showBankForm, setShowBankForm] = useState(false);
    const [showCardForm, setShowCardForm] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedPaymentId, setSelectedPaymentId] = useState(null);

    const formatExpiry = (month, year) => {
        if (!month || !year) return '';
        const date = new Date(2000, month - 1);
        const monthName = date.toLocaleString('default', { month: 'short' });
        return `${monthName} ${year}`;
    };

    if (businessLoading || bankingInfoLoading || syncingBank) {
        return <div className="py-5 text-center text-gray-500">Loading...</div>;
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
            setAlert({ type: 'success', message: 'Payment method deleted successfully.' });
        } catch (err) {
            setAlert({
                type: 'danger',
                message: err?.data?.detail || 'Failed to delete payment method. Please try again.',
            });
        }
    };

    const handleAutoPaymentToggle = async (checked) => {
        if (!activeCard) return;
        try {
            await updateBankingInformation({
                id: activeCard.id,
                auto_payments: checked,
            }).unwrap();

            setAlert({
                type: 'success',
                message: checked ? 'Auto payment enabled successfully.' : 'Auto payment disabled successfully.',
            });
        } catch (err) {
            setAlert({
                type: 'danger',
                message: err?.data?.detail || 'Failed to update auto payment setting.',
            });
        }
    };

    const cardBase = 'rounded-xl border border-gray-200 bg-white shadow-sm';
    const cardHeader = 'flex items-center gap-2 rounded-t-xl bg-secondary px-4 py-3 text-white';
    const cardBody = 'p-4 space-y-4';
    const actionBtn =
        'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-accent hover:text-accent';
    
    return (
        <>
            <div className={`grid gap-6 ${hasBusiness ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                {hasBusiness && (
                    <div className={cardBase}>
                        <div className={cardHeader}>
                            <FaBuildingColumns />
                            <span className="font-semibold">Bank Account (for Payouts)</span>
                        </div>
                        <div className={cardBody}>
                            {!activeBank || showBankForm ? (
                                <>
                                    <p className="text-sm text-gray-600">
                                        {activeBank
                                            ? 'Update your current payout bank account.'
                                            : 'Add a payout bank account to receive funds directly.'}
                                    </p>

                                    <BankAccountForm onSuccess={() => setShowBankForm(false)} setAlert={setAlert} />

                                    {activeBank && (
                                        <div className="text-right">
                                            <button
                                                type="button"
                                                className="text-sm font-semibold text-gray-500 underline-offset-4 transition hover:text-accent"
                                                onClick={() => setShowBankForm(false)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="text-sm text-gray-800">
                                        <strong>{activeBank.bank_name}</strong> •••• {activeBank.account_number_last4}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className={actionBtn} onClick={() => setShowBankForm(true)}>
                                            <FaPen />
                                            Replace
                                        </button>
                                        <button className={actionBtn} onClick={() => handleDeleteClick(activeBank.id)}>
                                            <FaTrashAlt />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                You receive payouts directly to your connected bank account after Stripe fees are deducted.
                                <br />
                                <small>
                                    Example: For a $100.00 payout, Stripe’s standard processing fee of{' '}
                                    <strong>2.9% + $0.30</strong> would result in a net payout of approximately{' '}
                                    <strong>$96.80</strong>.
                                </small>
                            </div>
                        </div>
                    </div>
                )}

                <div className={cardBase}>
                    <div className={cardHeader}>
                        <FaCreditCard />
                        <span className="font-semibold">Credit / Debit Cards</span>
                    </div>
                    <div className={cardBody}>
                        {!activeCard || showCardForm ? (
                            <>
                                <p className="text-sm text-gray-600">
                                    {activeCard ? 'Replace your current card.' : 'Add a card for payments.'}
                                </p>
                                <Elements stripe={stripePromise}>
                                    <StripeCardForm onSuccess={() => setShowCardForm(false)} setAlert={setAlert} />
                                </Elements>
                                {activeCard && (
                                    <div className="text-right">
                                        <button
                                            type="button"
                                            className="text-sm font-semibold text-gray-500 underline-offset-4 transition hover:text-accent"
                                            onClick={() => setShowCardForm(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-800">
                                    <span>
                                        <strong>{activeCard.card_brand?.toUpperCase()}</strong> •••• •••• •••• {activeCard.card_last4}
                                    </span>
                                    <span className="text-gray-500">
                                        Expires {formatExpiry(activeCard.card_exp_month, activeCard.card_exp_year)}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button className={actionBtn} onClick={() => setShowCardForm(true)}>
                                            <FaPen />
                                            Replace
                                        </button>
                                        <button className={actionBtn} onClick={() => handleDeleteClick(activeCard.id)}>
                                            <FaTrashAlt />
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        className="h-4 w-4 accent-accent"
                                        type="checkbox"
                                        id="autoPaymentSwitch"
                                        checked={!!activeCard.auto_payments}
                                        disabled={updatingAutoPay}
                                        onChange={(e) => handleAutoPaymentToggle(e.target.checked)}
                                    />
                                    <label className="text-sm text-gray-700" htmlFor="autoPaymentSwitch">
                                        {!activeCard.auto_payments ? 'Enable' : 'Disable'} Auto Payment
                                    </label>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {showModal && (
                <form
                    onSubmit={confirmDelete}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
                        <div className="border-b border-gray-200 px-5 py-4">
                            <h5 className="text-lg font-semibold text-gray-900">Delete Payment Method</h5>
                        </div>
                        <div className="px-5 py-4 text-sm text-gray-700">
                            Are you sure you want to delete this payment method?
                        </div>
                        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-5 py-4">
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-accent hover:text-accent"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <SubmitButton
                                isLoading={deleting}
                                btnClass="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700 disabled:opacity-60"
                                btnName="Delete"
                            />
                        </div>
                    </div>
                </form>
            )}
        </>
    );
}
