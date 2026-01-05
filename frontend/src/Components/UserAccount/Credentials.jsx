import { useState } from 'react';
import { useUpdateUserMutation } from '../../store';
import SubmitButton from '../../utils/SubmitButton';

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

    return (
        <div className="row justify-content-center">
            <div className="col-md-5 mb-4">
                <div className="h-100">
                    <h5 className="fw-bold mb-3">Password Requirements</h5>
                    <ul className="list-unstyled fs-6">
                        <li className={`mb-2 ${passwordRules.length ? 'text-success' : 'text-secondary'}`}>
                            <i
                                className={`fa ${passwordRules.length ? 'fa-check-circle' : 'fa-times-circle'} me-2`}
                            ></i>
                            At least 8 characters long
                        </li>
                        <li className={`mb-2 ${passwordRules.uppercase ? 'text-success' : 'text-secondary'}`}>
                            <i
                                className={`fa ${passwordRules.uppercase ? 'fa-check-circle' : 'fa-times-circle'} me-2`}
                            ></i>
                            Contains at least one uppercase letter
                        </li>
                        <li className={`mb-2 ${passwordRules.number ? 'text-success' : 'text-secondary'}`}>
                            <i
                                className={`fa ${passwordRules.number ? 'fa-check-circle' : 'fa-times-circle'} me-2`}
                            ></i>
                            Contains at least one number
                        </li>
                        <li className={`mb-2 ${passwordRules.special ? 'text-success' : 'text-secondary'}`}>
                            <i
                                className={`fa ${passwordRules.special ? 'fa-check-circle' : 'fa-times-circle'} me-2`}
                            ></i>
                            Contains at least one special character
                        </li>
                    </ul>
                    <p className="small text-muted mt-3 text-center">
                        Your password must satisfy all of the above to be considered strong.
                    </p>
                </div>
            </div>

            {/* Password Change Form */}
            <div className="col-md-5">
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error?.data?.message || 'Failed to update password.'}
                        </div>
                    )}

                    {/* New Password */}
                    <div className="mb-3">
                        <label htmlFor="newPassword" className="form-label fw-bold">
                            New Password <sup className="text-danger small">(*)</sup>
                        </label>
                        <div className="input-group">
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
                                className="form-control"
                            />
                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                <i className={`fa ${!showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="mb-3">
                        <label htmlFor="confirmNewPassword" className="form-label fw-bold">
                            Confirm New Password <sup className="text-danger small">(*)</sup>
                        </label>
                        <div className="input-group">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmNewPassword"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                className="form-control"
                            />
                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex={-1}
                            >
                                <i className={`fa ${!showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>

                    <div>
                        <SubmitButton
                            isLoading={isLoading}
                            btnClass="btn btn-success"
                            btnName="Save Changes"
                            isDisabled={!isStrongPassword}
                        />
                    </div>
                </form>
            </div>
        </div>
    );
}
