import { useState } from 'react';
import { FaCheckCircle, FaEye, FaEyeSlash, FaTimesCircle } from 'react-icons/fa';
import { useUpdateUserMutation } from '../../store';
import SubmitButton from '../ui/SubmitButton';

export default function Credentials({ setAlert }) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [passwordRules, setPasswordRules] = useState({
        length: false,
        uppercase: false,
        number: false,
        special: false,
    });

    const [updateUser, { isLoading, error }] = useUpdateUserMutation();

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

        if (newPassword !== confirmNewPassword) {
            setAlert({ type: 'danger', message: 'New passwords do not match!' });
            return;
        }

        if (!isStrongPassword) {
            setAlert({
                type: 'danger',
                message: 'Password does not meet all requirements!',
            });
            return;
        }

        try {
            await updateUser({ password: newPassword }).unwrap();

            setAlert({
                type: 'success',
                message: 'Password updated successfully!',
            });

            setNewPassword('');
            setConfirmNewPassword('');
            setPasswordRules({
                length: false,
                uppercase: false,
                number: false,
                special: false,
            });
        } catch (err) {
            console.error('Password update failed:', err);
            setAlert({
                type: 'danger',
                message: 'Failed to update password. Please try again.',
            });
        }
    };

    const inputClass =
        'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30';
    const toggleBtn =
        'cursor-pointer inline-flex items-center justify-center rounded-r-lg rounded-l-none bg-secondary px-3 py-2 text-white hover:bg-secondary/90';

    return (
        <div className="grid gap-8 md:grid-cols-2 md:items-start">
            <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
                <h5 className="text-lg font-semibold text-gray-900">Password Requirements</h5>
                <ul className="space-y-2 text-sm">
                    <li className={`flex items-center gap-2 ${passwordRules.length ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordRules.length ? <FaCheckCircle /> : <FaTimesCircle />}
                        <span>At least 8 characters long</span>
                    </li>
                    <li className={`flex items-center gap-2 ${passwordRules.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordRules.uppercase ? <FaCheckCircle /> : <FaTimesCircle />}
                        <span>Contains at least one uppercase letter</span>
                    </li>
                    <li className={`flex items-center gap-2 ${passwordRules.number ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordRules.number ? <FaCheckCircle /> : <FaTimesCircle />}
                        <span>Contains at least one number</span>
                    </li>
                    <li className={`flex items-center gap-2 ${passwordRules.special ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordRules.special ? <FaCheckCircle /> : <FaTimesCircle />}
                        <span>Contains at least one special character</span>
                    </li>
                </ul>
                <p className="text-center text-xs text-gray-500">
                    Your password must satisfy all of the above to be considered strong.
                </p>
            </div>

            <div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                            {error?.data?.message || 'Failed to update password.'}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="newPassword" className="text-sm font-semibold text-gray-800">
                            New Password <sup className="text-accent">*</sup>
                        </label>
                        <div className="flex">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    checkPasswordRules(e.target.value);
                                }}
                                required
                                disabled={isLoading}
                                className={`${inputClass} rounded-r-none`}
                            />
                            <button
                                type="button"
                                className={toggleBtn}
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {!showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="confirmNewPassword" className="text-sm font-semibold text-gray-800">
                            Confirm New Password <sup className="text-accent">*</sup>
                        </label>
                        <div className="flex">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmNewPassword"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                className={`${inputClass} rounded-r-none`}
                            />
                            <button
                                type="button"
                                className={toggleBtn}
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex={-1}
                            >
                                {!showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <SubmitButton
                        isLoading={isLoading}
                        btnClass="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed"
                        btnName="Save Changes"
                        isDisabled={!isStrongPassword}
                    />
                </form>
            </div>
        </div>
    );
}
