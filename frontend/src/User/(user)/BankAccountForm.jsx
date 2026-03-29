import { useAddBankAccountMutation } from '../../store';
import SubmitButton from '../../Components/ui/SubmitButton';

export default function StripeOnboardingButton({ setAlert }) {
    const [addBankAccount, { isLoading }] = useAddBankAccountMutation();

    const handleConnect = async (e) => {
        e.preventDefault();

        try {
            const response = await addBankAccount().unwrap();
            const url = response?.onboarding_url;

            if (url) {
                window.location.href = url;
            } else {
                setAlert({ type: 'danger', message: 'Unable to create onboarding link.' });
            }
        } catch (err) {
            setAlert({
                type: 'danger',
                message: err?.data?.detail || 'Failed to connect Stripe account.',
            });
        }
    };

    return (
        <form className="mt-2 flex items-center justify-center" onSubmit={handleConnect}>
            <SubmitButton
                btnClass="flex items-center gap-2 rounded-xl bg-secondary px-6 py-3 text-lg font-semibold text-white shadow hover:shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
                btnName="Connect Stripe for Payouts"
                isLoading={isLoading}
            />
        </form>
    );
}
