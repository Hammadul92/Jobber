import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRequestPasswordResetMutation } from '../../store';

import SubmitButton from '../../utils/SubmitButton';

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
            <h2 className="text-center mb-4">Forgot Password</h2>

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

                    <div className="mb-3">
                        <label htmlFor="email" className="mb-2">
                            Enter Your Email (*)
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="form-control form-control-lg"
                            placeholder="Email"
                        />
                    </div>

                    <div className="text-center mb-3">
                        <SubmitButton
                            isLoading={isLoading}
                            btnClass="btn btn-lg btn-success w-100"
                            btnName="Send Reset Link"
                        />
                    </div>

                    <p className="text-center">
                        Remember your password? <Link to="/sign-in">Sign In</Link>
                    </p>
                </div>
            </form>
        </div>
    );
}
