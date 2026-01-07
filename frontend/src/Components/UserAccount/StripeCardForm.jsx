import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useState } from 'react';
import { useCreateSetupIntentMutation, useSavePaymentMethodMutation } from '../../store';
import SubmitButton from '../ui/SubmitButton';

export default function StripeCardForm({ onSuccess, setAlert }) {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);

    const [createSetupIntent] = useCreateSetupIntentMutation();
    const [savePaymentMethod] = useSavePaymentMethodMutation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements || loading) return;
        setLoading(true);

        try {
            const setupIntentData = await createSetupIntent().unwrap();

            const clientSecret = setupIntentData?.client_secret;
            if (!clientSecret) throw new Error('Failed to create setup intent');

            const result = await stripe.confirmCardSetup(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                },
            });

            if (result.error) {
                throw new Error(result.error.message);
            }
            const paymentMethodId = result.setupIntent.payment_method;
            await savePaymentMethod(paymentMethodId).unwrap();

            if (onSuccess) await onSuccess(paymentMethodId);
            setAlert({ type: 'success', message: 'Card added successfully!' });
        } catch (err) {
            console.error(err);
            setAlert({
                type: 'danger',
                message: err.message || 'Something went wrong while adding the card.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="border rounded p-3 mb-3">
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#32325d',
                                '::placeholder': { color: '#aab7c4' },
                            },
                            invalid: { color: '#fa755a' },
                        },
                    }}
                />
            </div>
            <div className="text-end">
                <SubmitButton btnClass="btn btn-success" isLoading={loading} btnName={'Save Card'} />
            </div>
        </form>
    );
}
