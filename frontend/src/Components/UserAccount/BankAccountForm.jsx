import { useAddBankAccountMutation } from '../../store';
import SubmitButton from '../ui/SubmitButton';

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
        <form className="mt-2" onSubmit={handleConnect}>
            <SubmitButton btnClass="btn btn-success" btnName="Connect Stripe for Payouts" isLoading={isLoading} />
        </form>
    );
}
