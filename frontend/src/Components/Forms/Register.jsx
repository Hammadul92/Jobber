import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCreateUserMutation } from '../../store';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState('');
    const [alert, setAlert] = useState(null);

    const [createUser, { isLoading, error }] = useCreateUserMutation();

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

        if (password !== confirmPassword) {
            setAlert({ type: 'danger', message: 'Passwords do not match!' });
            return;
        }

        if (passwordStrength !== 'Strong Password') {
            setAlert({
                type: 'danger',
                message: 'Password is not strong enough!',
            });
            return;
        }

        try {
            await createUser({ name, email, password }).unwrap();

            setAlert({
                type: 'success',
                message: 'Account created! Please check your email to confirm.',
            });

            // clear form
            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setPasswordStrength('');
        } catch (err) {
            console.error('Registration failed:', err);
        }
    };

    return (
        <div className="my-5 container">
            <h2 className="text-center mb-4">Register</h2>

            <form onSubmit={handleSubmit} className="row">
                <div className="col-md-4 offset-md-4">
                    {/* Bootstrap Alert */}
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

                    {/* Name Field */}
                    <div className="mb-3">
                        <label htmlFor="name" className="mb-2">
                            Name (*)
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="form-control form-control-lg"
                            placeholder="Full Name"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Email Field */}
                    <div className="mb-3">
                        <label htmlFor="email" className="mb-2">
                            Email (*)
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="form-control form-control-lg"
                            placeholder="Email"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Password Field */}
                    <div className="mb-3">
                        <label htmlFor="password" className="mb-2">
                            Password (*)
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
                            placeholder="Password"
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

                    {/* Confirm Password Field */}
                    <div className="mb-3">
                        <label htmlFor="confirmPassword" className="mb-2">
                            Confirm Password (*)
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="form-control form-control-lg"
                            placeholder="Confirm Password"
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
                            {isLoading ? 'Registering...' : 'Register'}
                        </button>
                    </div>

                    {/* Login Link */}
                    <p className="text-center">
                        Already have an account? <Link to="/sign-in">Sign In</Link>
                    </p>
                </div>
            </form>
        </div>
    );
}
