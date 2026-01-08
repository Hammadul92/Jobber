import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaEyeSlash, FaEye } from 'react-icons/fa';
import { useResetPasswordMutation } from '../store';
import SubmitButton from '../Components/ui/SubmitButton';

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
        <section className="min-h-screen w-full p-32 flex flex-col items-center justify-center">
            <div className="text-center mb-6">
                <h2 className="text-3xl sm:text-4xl font-heading font-bold text-secondary">Reset Your Password</h2>
                <p className="text-gray-600 mt-2">Create a new password to secure your account.</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2 w-full mx-auto">
                {/* Left: Password Rules */}
                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100">
                    <h5 className="text-xl font-semibold text-secondary mb-4">Password Requirements</h5>
                    <ul className="space-y-3 text-base">
                        <li className={`flex items-center ${passwordRules.length ? 'text-green-600' : 'text-gray-500'}`}>
                            {passwordRules.length ? <FaCheckCircle className="mr-2" /> : <FaTimesCircle className="mr-2" />}
                            At least 8 characters long
                        </li>
                        <li className={`flex items-center ${passwordRules.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                            {passwordRules.uppercase ? <FaCheckCircle className="mr-2" /> : <FaTimesCircle className="mr-2" />}
                            Contains at least one uppercase letter
                        </li>
                        <li className={`flex items-center ${passwordRules.number ? 'text-green-600' : 'text-gray-500'}`}>
                            {passwordRules.number ? <FaCheckCircle className="mr-2" /> : <FaTimesCircle className="mr-2" />}
                            Contains at least one number
                        </li>
                        <li className={`flex items-center ${passwordRules.special ? 'text-green-600' : 'text-gray-500'}`}>
                            {passwordRules.special ? <FaCheckCircle className="mr-2" /> : <FaTimesCircle className="mr-2" />}
                            Contains at least one special character
                        </li>
                    </ul>
                    <p className="text-sm text-gray-500 mt-4 text-center">
                        Your password must satisfy all of the above to be considered strong.
                    </p>
                </div>

                {/* Right: Reset Form */}
                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {alert && (
                            <div
                                className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                                    alert.type === 'success'
                                        ? 'border-green-200 bg-green-50 text-green-700'
                                        : 'border-red-200 bg-red-50 text-red-700'
                                }`}
                                role="alert"
                            >
                                {alert.message}
                            </div>
                        )}
                        {error && (
                            <div
                                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                                role="alert"
                            >
                                {error?.data?.detail || 'Password reset failed. Please try again.'}
                            </div>
                        )}

                        {/* New Password */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-semibold text-secondary">
                                New Password <sup className="text-red-500 text-xs">(*)</sup>
                            </label>
                            <div className="flex">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        checkPasswordRules(e.target.value);
                                    }}
                                    required
                                    className="w-full rounded-l-xl border border-gray-200 px-4 py-3 text-base focus:ring-2 focus:ring-accent focus:border-accent transition bg-white"
                                />
                                <button
                                    type="button"
                                    className="rounded-r-xl border border-gray-200 bg-slate-50 px-4 text-gray-600 hover:bg-slate-100 transition"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {!showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="text-sm font-semibold text-secondary">
                                Confirm New Password <sup className="text-red-500 text-xs">(*)</sup>
                            </label>
                            <div className="flex">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full rounded-l-xl border border-gray-200 px-4 py-3 text-base focus:ring-2 focus:ring-accent focus:border-accent transition bg-white"
                                />
                                <button
                                    type="button"
                                    className="rounded-r-xl border border-gray-200 bg-slate-50 px-4 text-gray-600 hover:bg-slate-100 transition"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    tabIndex={-1}
                                >
                                    {!showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <SubmitButton
                                isLoading={isLoading}
                                btnClass="w-full rounded-xl bg-accent text-white font-semibold py-3 shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/40 transition disabled:opacity-60 disabled:cursor-not-allowed"
                                btnName="Reset Password"
                                isDisabled={!isStrongPassword}
                            />
                        </div>

                        <p className="text-center text-sm text-gray-600">
                            Remember your password?{' '}
                            <Link to="/sign-in" className="text-accent font-semibold hover:underline transition">
                                Sign In
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </section>
    );
}
