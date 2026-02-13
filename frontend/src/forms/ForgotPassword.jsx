import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRequestPasswordResetMutation } from '../store';

import SubmitButton from '../Components/ui/SubmitButton';
import Input from '../Components/ui/Input';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [requestPasswordReset, { isLoading, isSuccess, error }] = useRequestPasswordResetMutation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await requestPasswordReset({ email }).unwrap();
        } catch (err) {
            console.error('Request failed:', err);
        }
    };

    return (
        <section className="min-h-screen w-full px-6 py-40 md:px-16 lg:px-32 md:py-24 flex flex-col items-center justify-center">
            <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-3xl sm:text-4xl font-heading font-bold text-secondary mb-3">Forgot Password</h2>
                <p className="text-gray-600">Enter your email and we&apos;ll send you a link to reset your password.</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-10 w-full flex justify-center">
                <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
                    {error && (
                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-center text-sm font-medium">
                            {error?.data?.detail || 'Something went wrong. Please try again.'}
                        </div>
                    )}

                    {isSuccess && (
                        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 text-green-700 px-4 py-3 text-center text-sm font-medium">
                            If an account exists for this email, a reset link has been sent.
                        </div>
                    )}

                    <Input
                        id="email"
                        label={'Email'}
                        value={email}
                        isRequired={true}
                        onChange={setEmail}
                        fieldClass={'w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:outline-none focus:ring focus:ring-accent focus:border-accent transition bg-white'}
                    />

                    <div className="text-center mt-6 mb-4">
                        <SubmitButton
                            isLoading={isLoading}
                            btnClass="cursor-pointer w-full rounded-xl bg-accent text-white font-semibold py-3 hover:bg-accentLight transition"
                            btnName="Send Reset Link"
                        />
                    </div>

                    <p className="text-center text-sm text-gray-600">
                        Remember your password?{' '}
                        <Link to="/sign-in" className="text-accent font-semibold hover:underline transition">
                            Sign In
                        </Link>
                    </p>
                </div>
            </form>
        </section>
    );
}
