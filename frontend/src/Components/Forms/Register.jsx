import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCreateUserMutation } from '../../store';

import SubmitButton from '../../utils/SubmitButton';
import Input from '../../utils/Input';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [alert, setAlert] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [agreeTerms, setAgreeTerms] = useState(false);
    const [agreeOffers, setAgreeOffers] = useState(false);

    const [passwordRules, setPasswordRules] = useState({
        length: false,
        uppercase: false,
        number: false,
        special: false,
    });

    const [createUser, { isLoading, error }] = useCreateUserMutation();

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

        if (!agreeTerms) {
            setAlert({ type: 'danger', message: 'You must agree to the Terms & Conditions to register.' });
            return;
        }

        if (password !== confirmPassword) {
            setAlert({ type: 'danger', message: 'Passwords do not match!' });
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
            await createUser({ name, email, phone, password, agreeOffers }).unwrap();

            setAlert({
                type: 'success',
                message: 'Account created! Please check your email to confirm.',
            });

            setName('');
            setEmail('');
            setPhone('');
            setPassword('');
            setConfirmPassword('');
            setAgreeTerms(false);
            setAgreeOffers(false);
            setPasswordRules({
                length: false,
                uppercase: false,
                number: false,
                special: false,
            });
        } catch (err) {
            console.error('Registration failed:', err);
        }
    };

    return (
        <div className="container my-5">
            <h2 className="text-center mb-3 fw-bold">Create Your Account</h2>

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

                {/* Registration Form */}
                <div className="col-md-5">
                    <form onSubmit={handleSubmit}>
                        {alert && (
                            <div className={`alert alert-${alert.type}`} role="alert">
                                {alert.message}
                            </div>
                        )}
                        {error && (
                            <div className="alert alert-danger" role="alert">
                                {error?.data?.message || 'Registration failed. Please try again.'}
                            </div>
                        )}

                        {/* Name */}
                        <Input
                            id="name"
                            label={'Full Name'}
                            value={name}
                            isRequired={true}
                            onChange={setName}
                            fieldClass={'form-control form-control-lg'}
                        />

                        {/* Email */}
                        <Input
                            type="email"
                            id="email"
                            label={'Email'}
                            value={email}
                            isRequired={true}
                            onChange={setEmail}
                            fieldClass={'form-control form-control-lg'}
                        />

                        {/* Phone */}
                        <Input
                            id="phone"
                            type="tel"
                            label={'Phone'}
                            value={phone}
                            isRequired={true}
                            onChange={setPhone}
                            fieldClass={'form-control form-control-lg'}
                        />

                        {/* Password */}
                        <div className="mb-3">
                            <label htmlFor="password" className="form-label fw-bold">
                                Password <sup className="text-danger small">(*)</sup>
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
                                Confirm Password <sup className="text-danger small">(*)</sup>
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

                        {/* Checkboxes */}
                        <div className="form-check mb-2">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="agreeTerms"
                                checked={agreeTerms}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                                required
                            />
                            <label className="form-check-label" htmlFor="agreeTerms">
                                I agree to the{' '}
                                <Link to="/terms" className="text-success text-decoration-none fw-semibold">
                                    Terms & Conditions
                                </Link>
                                .
                            </label>
                        </div>

                        <div className="form-check mb-3">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="agreeOffers"
                                checked={agreeOffers}
                                onChange={(e) => setAgreeOffers(e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="agreeOffers">
                                I agree to receive regular emails with offers and updates.
                            </label>
                        </div>

                        {/* Submit */}
                        <div className="text-center mb-3">
                            <SubmitButton
                                isLoading={isLoading}
                                btnClass="btn btn-success btn-lg w-100"
                                btnName="Register"
                                isDisabled={!isStrongPassword}
                            />
                        </div>

                        {/* Sign In link */}
                        <p className="text-center">
                            Already have an account?{' '}
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
