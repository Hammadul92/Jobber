import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaEyeSlash, FaEye } from 'react-icons/fa';
import { useCreateUserMutation } from '../store';

import SubmitButton from '../Components/ui/SubmitButton';
import Input from '../Components/ui/Input';

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
        <section className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-heading font-bold text-secondary text-center mb-3">
                    Create Your Account
                </h2>
                <p className="text-center text-gray-600 mb-10">
                    Join our community and start managing your work with a secure, modern workspace.
                </p>

                <div className="grid gap-8 lg:grid-cols-2">
                    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100">
                        <h5 className="text-xl font-semibold text-secondary mb-4">Password Requirements</h5>
                        <ul className="space-y-3 text-base">
                            <li className={`flex items-center ${passwordRules.length ? 'text-green-600' : 'text-gray-500'}`}>
                                {passwordRules.length ? (
                                    <FaCheckCircle className="mr-2" />
                                ) : (
                                    <FaTimesCircle className="mr-2" />
                                )}
                                At least 8 characters long
                            </li>
                            <li className={`flex items-center ${passwordRules.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                                {passwordRules.uppercase ? (
                                    <FaCheckCircle className="mr-2" />
                                ) : (
                                    <FaTimesCircle className="mr-2" />
                                )}
                                Contains at least one uppercase letter
                            </li>
                            <li className={`flex items-center ${passwordRules.number ? 'text-green-600' : 'text-gray-500'}`}>
                                {passwordRules.number ? (
                                    <FaCheckCircle className="mr-2" />
                                ) : (
                                    <FaTimesCircle className="mr-2" />
                                )}
                                Contains at least one number
                            </li>
                            <li className={`flex items-center ${passwordRules.special ? 'text-green-600' : 'text-gray-500'}`}>
                                {passwordRules.special ? (
                                    <FaCheckCircle className="mr-2" />
                                ) : (
                                    <FaTimesCircle className="mr-2" />
                                )}
                                Contains at least one special character
                            </li>
                        </ul>
                        <p className="text-sm text-gray-500 mt-4 text-center">
                            Your password must satisfy all of the above to be considered strong.
                        </p>
                        <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="rounded-xl bg-slate-50 border border-gray-100 p-4">
                                <p className="font-semibold text-secondary mb-1">Need a tip?</p>
                                <p>Add a phrase you remember plus a symbol, e.g., Coffee@Dawn24.</p>
                            </div>
                            <div className="rounded-xl bg-slate-50 border border-gray-100 p-4">
                                <p className="font-semibold text-secondary mb-1">We respect privacy</p>
                                <p>We never share your credentials and store them securely.</p>
                            </div>
                        </div>
                    </div>

                    {/* Registration Form */}
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
                                fieldClass={'w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:ring-2 focus:ring-accent focus:border-accent transition bg-white'}
                            />

                            {/* Email */}
                            <Input
                                type="email"
                                id="email"
                                label={'Email'}
                                value={email}
                                isRequired={true}
                                onChange={setEmail}
                                fieldClass={'w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:ring-2 focus:ring-accent focus:border-accent transition bg-white'}
                            />

                            {/* Phone */}
                            <Input
                                id="phone"
                                type="tel"
                                label={'Phone'}
                                value={phone}
                                isRequired={true}
                                onChange={setPhone}
                                fieldClass={'w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:ring-2 focus:ring-accent focus:border-accent transition bg-white'}
                            />

                            {/* Password */}
                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-semibold text-secondary">
                                    Password <sup className="text-red-500 text-xs">(*)</sup>
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
                                    Confirm Password <sup className="text-red-500 text-xs">(*)</sup>
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

                            {/* Checkboxes */}
                            <div className="flex items-start gap-3">
                                <input
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                                    type="checkbox"
                                    id="agreeTerms"
                                    checked={agreeTerms}
                                    onChange={(e) => setAgreeTerms(e.target.checked)}
                                    required
                                />
                                <label className="text-sm text-gray-700" htmlFor="agreeTerms">
                                    I agree to the{' '}
                                    <Link to="/terms" className="text-accent font-semibold hover:underline">
                                        Terms & Conditions
                                    </Link>
                                    .
                                </label>
                            </div>

                            <div className="flex items-start gap-3">
                                <input
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                                    type="checkbox"
                                    id="agreeOffers"
                                    checked={agreeOffers}
                                    onChange={(e) => setAgreeOffers(e.target.checked)}
                                />
                                <label className="text-sm text-gray-700" htmlFor="agreeOffers">
                                    I agree to receive regular emails with offers and updates.
                                </label>
                            </div>

                            {/* Submit */}
                            <div className="pt-2">
                                <SubmitButton
                                    isLoading={isLoading}
                                    btnClass="w-full rounded-xl bg-accent text-white font-semibold py-3 shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/40 transition disabled:opacity-60 disabled:cursor-not-allowed"
                                    btnName="Register"
                                    isDisabled={!isStrongPassword}
                                />
                            </div>

                            {/* Sign In link */}
                            <p className="text-center text-sm text-gray-600">
                                Already have an account?{' '}
                                <Link to="/sign-in" className="text-accent font-semibold hover:underline">
                                    Sign In
                                </Link>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}
