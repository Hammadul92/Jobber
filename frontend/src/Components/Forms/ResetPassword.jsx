import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useResetPasswordMutation } from '../../store';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState('');
    const [alert, setAlert] = useState(null);

    const [resetPassword, { isLoading, error }] = useResetPasswordMutation();

    const checkPasswordStrength = (pwd) => {
        let strength = '';
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (pwd.length < 6) {
            strength = 'Too short';
        } else if (!/[A-Z]/.test(pwd)) {
            strength = 'Must include uppercase letter';
        } else if (!/[0-9]/.test(pwd)) {
            strength = 'Must include a number';
        } else if (!/[!@#$%^&*]/.test(pwd)) {
            strength = 'Must include special character';
        } else if (strongRegex.test(pwd)) {
            strength = 'Strong Password';
        }
        setPasswordStrength(strength);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            setAlert({ type: 'danger', message: 'Invalid or missing reset token!' });
            return;
        }

        if (password !== confirmPassword) {
            setAlert({ type: 'danger', message: 'Passwords do not match!' });
            return;
        }

        if (passwordStrength !== 'Strong Password') {
            setAlert({ type: 'danger', message: 'Password is not strong enough!' });
            return;
        }

        try {
            await resetPassword({ token, password }).unwrap();
            setAlert({
                type: 'success',
                message: 'Password reset successfully! Redirecting to login...',
            });

            setTimeout(() => navigate('/sign-in'), 2000);
        } catch (err) {
            console.error('Password reset failed:', err);
        }
    };

    return (
        <div className="my-5 container">
            <h2 className="text-center mb-4">Reset Password</h2>

            <form onSubmit={handleSubmit} className="row">
                <div className="col-md-4 offset-md-4">
                    {alert && (
                        <div className={`alert alert-${alert.type}`} role="alert">
                            {alert.message}
                        </div>
                    )}
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error?.data?.detail || 'Password reset failed. Try again.'}
                        </div>
                    )}

                    {/* Password field */}
                    <div className="mb-3">
                        <label htmlFor="password" className="mb-2">
                            New Password (*)
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                checkPasswordStrength(e.target.value);
                            }}
                            required
                            className="form-control form-control-lg"
                            placeholder="New Password"
                            disabled={isLoading}
                        />
                        {password && (
                            <small
                                className={`d-block mt-1 fw-bold ${
                                    passwordStrength === 'Strong Password' ? 'text-success' : 'text-danger'
                                }`}
                            >
                                {passwordStrength}
                            </small>
                        )}
                    </div>

                    {/* Confirm Password field */}
                    <div className="mb-3">
                        <label htmlFor="confirmPassword" className="mb-2">
                            Confirm New Password (*)
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="form-control form-control-lg"
                            placeholder="Confirm New Password"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="text-center mb-3">
                        <button
                            type="submit"
                            disabled={passwordStrength !== 'Strong Password' || isLoading}
                            className="btn btn-lg btn-success w-100"
                        >
                            {isLoading ? 'Resetting Password...' : 'Reset Password'}
                        </button>
                    </div>

                    {/* Back to Login */}
                    <p className="text-center">
                        Remembered your password? <Link to="/sign-in">Sign In</Link>
                    </p>
                </div>
            </form>
        </div>
    );
}
