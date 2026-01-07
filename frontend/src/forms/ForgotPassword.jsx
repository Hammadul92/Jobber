import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRequestPasswordResetMutation } from '../../store';

import SubmitButton from '../ui/SubmitButton';
import Input from '../ui/Input';

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
        <div className="my-5 container">
            <h2 className="text-center mb-3 fw-bold">Forgot Password</h2>

            <form onSubmit={handleSubmit} className="row">
                <div className="col-md-4 offset-md-4">
                    {error && (
                        <div className="alert alert-danger text-center">
                            {error?.data?.detail || 'Something went wrong. Please try again.'}
                        </div>
                    )}

                    {isSuccess && (
                        <div className="alert alert-success text-center">
                            If an account exists for this email, a reset link has been sent.
                        </div>
                    )}

                    <Input
                        id="email"
                        label={'Email'}
                        value={email}
                        isRequired={true}
                        onChange={setEmail}
                        fieldClass={'form-control form-control-lg'}
                    />

                    <div className="text-center mb-3">
                        <SubmitButton
                            isLoading={isLoading}
                            btnClass="btn btn-lg btn-success w-100"
                            btnName="Send Reset Link"
                        />
                    </div>

                    <p className="text-center">
                        Remember your password?{' '}
                        <Link to="/sign-in" className="text-success text-decoration-none fw-semibold">
                            Sign In
                        </Link>
                    </p>
                </div>
            </form>
        </div>
    );
}
