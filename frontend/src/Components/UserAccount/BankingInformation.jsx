import { useState, useEffect } from 'react';
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
        return <div className="text-center py-5 text-muted">Loading...</div>;
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

    return (
        <>
            <div className="row">
                {hasBusiness && (
                    <div className="col-md-6">
                        <div className="card border-0">
                            <div className="card-header bg-success bg-gradient text-white">
                                <i className="fa fa-building-columns me-2"></i>
                                Bank Account (for Payouts)
                            </div>
                            <div className="card-body">
                                {!activeBank || showBankForm ? (
                                    <>
                                        <p className="text-muted mb-0">
                                            {activeBank
                                                ? 'Update your current payout bank account.'
                                                : 'Add a payout bank account to receive funds directly.'}
                                        </p>

                                        <BankAccountForm onSuccess={() => setShowBankForm(false)} setAlert={setAlert} />

                                        {activeBank && (
                                            <div className="text-end">
                                                <button
                                                    type="button"
                                                    className="btn btn-link text-muted mt-2"
                                                    onClick={() => setShowBankForm(false)}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="d-flex justify-content-between align-items-center flex-wrap">
                                        <div>
                                            <strong>{activeBank.bank_name}</strong> ••••{' '}
                                            {activeBank.account_number_last4}
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button
                                                className="btn btn-sm btn-light"
                                                onClick={() => setShowBankForm(true)}
                                            >
                                                <i className="fa fa-pencil"></i> Replace
                                            </button>
                                            <button
                                                className="btn btn-sm btn-light"
                                                onClick={() => handleDeleteClick(activeBank.id)}
                                            >
                                                <i className="fa fa-trash-alt"></i> Delete
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="alert alert-warning mt-3">
                                    You receive payouts directly to your connected bank account after Stripe fees are
                                    deducted.
                                    <br />
                                    <small>
                                        Example: For a $100.00 payout, Stripe’s standard processing fee of{' '}
                                        <strong>2.9% + $0.30</strong> would result in a net payout of approximately{' '}
                                        <strong>$96.80</strong>.
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className={`col-md-${hasBusiness ? '6' : '12'}`}>
                    <div className="card border-0">
                        <div className="card-header bg-success bg-gradient text-white">
                            <i className="fa fa-credit-card me-2"></i>
                            Credit / Debit Cards
                        </div>
                        <div className="card-body">
                            {!activeCard || showCardForm ? (
                                <>
                                    <p className="text-muted">
                                        {activeCard ? 'Replace your current card.' : 'Add a card for payments.'}
                                    </p>
                                    <Elements stripe={stripePromise}>
                                        <StripeCardForm onSuccess={() => setShowCardForm(false)} setAlert={setAlert} />
                                    </Elements>
                                    {activeCard && (
                                        <div className="text-end">
                                            <button
                                                type="button"
                                                className="btn btn-link text-muted mt-2"
                                                onClick={() => setShowCardForm(false)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="d-flex justify-content-between align-items-center flex-wrap">
                                        <span>
                                            <strong>{activeCard.card_brand?.toUpperCase()}</strong> •••• •••• ••••{' '}
                                            {activeCard.card_last4}
                                        </span>
                                        <small className="text-muted ms-2">
                                            Expires {formatExpiry(activeCard.card_exp_month, activeCard.card_exp_year)}
                                        </small>
                                        <div className="d-flex gap-2">
                                            <button
                                                className="btn btn-sm btn-light"
                                                onClick={() => setShowCardForm(true)}
                                            >
                                                <i className="fa fa-pencil"></i> Replace
                                            </button>
                                            <button
                                                className="btn btn-sm btn-light"
                                                onClick={() => handleDeleteClick(activeCard.id)}
                                            >
                                                <i className="fa fa-trash-alt"></i> Delete
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-check form-switch mt-3">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="autoPaymentSwitch"
                                            checked={!!activeCard.auto_payments}
                                            disabled={updatingAutoPay}
                                            onChange={(e) => handleAutoPaymentToggle(e.target.checked)}
                                        />
                                        <label className="form-check-label" htmlFor="autoPaymentSwitch">
                                            {!activeCard.auto_payments ? 'Enable' : 'Disable'} Auto Payment
                                        </label>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            {showModal && (
                <form onSubmit={confirmDelete} className="modal d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Delete Payment Method</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete this payment method?</p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-dark"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <SubmitButton isLoading={deleting} btnClass="btn btn-sm btn-danger" btnName="Delete" />
                            </div>
                        </div>
                    </div>
                </form>
            )}
            {showModal && <div className="modal-backdrop fade show"></div>}
        </>
    );
}
