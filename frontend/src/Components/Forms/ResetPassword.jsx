import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useResetPasswordMutation } from '../../store';
import SubmitButton from '../../utils/SubmitButton';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [alert, setAlert] = useState(null);

    const [passwordRules, setPasswordRules] = useState({
        length: false,
        uppercase: false,
        number: false,
        special: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [resetPassword, { isLoading, error }] = useResetPasswordMutation();

    const checkPasswordRules = (pwd) => {
        const rules = {
            length: pwd.length >= 8,
            uppercase: /[A-Z]/.test(pwd),
            number: /[0-9]/.test(pwd),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
        };
        setPasswordRules(rules);
    };

    const isStrongPassword = Object.values(passwordRules).every(Boolean);

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

        if (!isStrongPassword) {
            setAlert({ type: 'danger', message: 'Password does not meet all requirements!' });
            return;
        }

        try {
            await resetPassword({ token, password }).unwrap();
            setAlert({
                type: 'success',
                message: 'Password reset successfully! Redirecting to sign in...',
            });

            setTimeout(() => navigate('/sign-in'), 2000);
        } catch (err) {
            console.error('Password reset failed:', err);
        }
    };

    return (
        <div className="container my-5">
            <h2 className="text-center mb-3 fw-bold">Reset Your Password</h2>

            <div className="row justify-content-center">
                {/* Left: Password Rules */}
                <div className="col-md-5 mb-4">
                    <div className="h-100">
                        <h5 className="fw-bold mb-3">Password Requirements</h5>
                        <ul className="list-unstyled fs-6">
                            <li className={`mb-2 ${passwordRules.length ? 'text-success' : 'text-secondary'}`}>
                                <i
                                    className={`fa ${
                                        passwordRules.length ? 'fa-check-circle' : 'fa-times-circle'
                                    } me-2`}
                                ></i>
                                At least 8 characters long
                            </li>
                            <li className={`mb-2 ${passwordRules.uppercase ? 'text-success' : 'text-secondary'}`}>
                                <i
                                    className={`fa ${
                                        passwordRules.uppercase ? 'fa-check-circle' : 'fa-times-circle'
                                    } me-2`}
                                ></i>
                                Contains at least one uppercase letter
                            </li>
                            <li className={`mb-2 ${passwordRules.number ? 'text-success' : 'text-secondary'}`}>
                                <i
                                    className={`fa ${
                                        passwordRules.number ? 'fa-check-circle' : 'fa-times-circle'
                                    } me-2`}
                                ></i>
                                Contains at least one number
                            </li>
                            <li className={`mb-2 ${passwordRules.special ? 'text-success' : 'text-secondary'}`}>
                                <i
                                    className={`fa ${
                                        passwordRules.special ? 'fa-check-circle' : 'fa-times-circle'
                                    } me-2`}
                                ></i>
                                Contains at least one special character
                            </li>
                        </ul>
                        <p className="small text-muted mt-3 text-center">
                            Your password must satisfy all of the above to be considered strong.
                        </p>
                    </div>
                </div>

                {/* Right: Reset Form */}
                <div className="col-md-5">
                    <form onSubmit={handleSubmit}>
                        {alert && (
                            <div className={`alert alert-${alert.type}`} role="alert">
                                {alert.message}
                            </div>
                        )}
                        {error && (
                            <div className="alert alert-danger" role="alert">
                                {error?.data?.detail || 'Password reset failed. Please try again.'}
                            </div>
                        )}

                        {/* New Password */}
                        <div className="mb-3">
                            <label htmlFor="password" className="form-label fw-bold">
                                New Password <small className="text-danger">(Required)</small>
                            </label>
                            <div className="input-group">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        checkPasswordRules(e.target.value);
                                    }}
                                    required
                                    className="form-control form-control-lg"
                                />
                                <button
                                    type="button"
                                    className="btn btn-success btn-lg"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    <i className={`fa ${!showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="mb-3">
                            <label htmlFor="confirmPassword" className="form-label fw-bold">
                                Confirm New Password <small className="text-danger">(Required)</small>
                            </label>
                            <div className="input-group">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="form-control form-control-lg"
                                />
                                <button
                                    type="button"
                                    className="btn btn-success btn-lg"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    tabIndex={-1}
                                >
                                    <i className={`fa ${!showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>

                        <div className="text-center mb-3">
                            <SubmitButton
                                isLoading={isLoading}
                                btnClass="btn btn-success btn-lg w-100"
                                btnName="Reset Password"
                                isDisabled={!isStrongPassword}
                            />
                        </div>

                        <p className="text-center">
                            Remember your password?{' '}
                            <Link to="/sign-in" className="text-success text-decoration-none fw-semibold">
                                Sign In
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
