import { useState } from 'react';
import { useUpdateUserMutation } from '../../../../store';

import SubmitButton from '../../../../utils/SubmitButton';

export default function Credentials() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState('');
    const [alert, setAlert] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [updateUser, { isLoading, error }] = useUpdateUserMutation();

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

        if (newPassword !== confirmNewPassword) {
            setAlert({ type: 'danger', message: 'New passwords do not match!' });
            return;
        }

        if (passwordStrength !== 'Strong Password') {
            setAlert({ type: 'danger', message: 'Password is not strong enough!' });
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
            setPasswordStrength('');
        } catch (err) {
            console.error('Password update failed:', err);
            setAlert({ type: 'danger', message: 'Failed to update password. Please try again.' });
        }
    };

    return (
        <form className="tab-pane active" onSubmit={handleSubmit}>
            <div className="row">
                <div className="col-md-4">
                    {alert && (
                        <div className={`alert alert-${alert.type}`} role="alert">
                            {alert.message}
                        </div>
                    )}
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error?.data?.message || 'Failed to update password.'}
                        </div>
                    )}

                    <div className="mb-3">
                        <label className="form-label">New Password</label>
                        <div className="input-group">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="form-control"
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    checkPasswordStrength(e.target.value);
                                }}
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                className="btn btn-outline-success"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                <i className={`fa ${!showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                        {newPassword && (
                            <small
                                className={`d-block mt-1 fw-bold ${
                                    passwordStrength === 'Strong Password' ? 'text-success' : 'text-danger'
                                }`}
                            >
                                {passwordStrength}
                            </small>
                        )}
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Confirm New Password</label>
                        <div className="input-group">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                className="form-control"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                className="btn btn-outline-success"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex={-1}
                            >
                                <i className={`fa ${!showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>

                    <SubmitButton
                        isLoading={isLoading}
                        isDisabled={passwordStrength !== 'Strong Password'}
                        btnClass="btn btn-success"
                        btnName="Save Changes"
                    />
                </div>
            </div>
        </form>
    );
}
