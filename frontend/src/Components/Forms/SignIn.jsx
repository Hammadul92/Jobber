import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSigninUserMutation, useFetchUserQuery, useVerifyEmailQuery } from '../../store';

export default function SignIn() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [signinUser, { isLoading: signinLoading, error: signinError }] =
        useSigninUserMutation();

    const { data: userData, isSuccess: userFetched } = useFetchUserQuery(undefined, {
        skip: !localStorage.getItem('token'),
    });

    // ✅ Call verification only if token exists
    const {
        data: verifyData,
        isLoading: verifying,
        isError: verifyError,
        error: verifyErrorObj,
    } = useVerifyEmailQuery(token, { skip: !token });

    useEffect(() => {
        if (userFetched && userData) {
            navigate('/');
        }
    }, [userFetched, userData, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await signinUser({ email, password }).unwrap();
        } catch (err) {
            console.error('Login failed:', err);
        }
    };

    return (
        <div className="my-5 container">
            <h2 className="text-center mb-4">Sign In</h2>

            {/* ✅ Show backend-provided response messages */}
            {token && (
                <div className="mb-4 col-md-4 offset-md-4">
                    {verifying && (
                        <div className="alert alert-info text-center">
                            Verifying your email...
                        </div>
                    )}
                    {!verifying && verifyData?.detail && (
                        <div className="alert alert-success text-center">
                            {verifyData.detail}
                        </div>
                    )}
                    {verifyError && (
                        <div className="alert alert-danger text-center">
                            {verifyErrorObj?.data?.detail || 'Email verification failed.'}
                        </div>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit} className="row">
                <div className="col-md-4 offset-md-4">
                    {signinError && (
                        <div className="alert alert-danger text-center">
                            {signinError?.data?.detail || 'Invalid credentials'}
                        </div>
                    )}

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
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="password" className="mb-2">
                            Password (*)
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="form-control form-control-lg"
                            placeholder="Password"
                        />
                    </div>

                    <div className="text-center mb-3">
                        <button type="submit" className="btn btn-lg btn-success w-100" disabled={signinLoading}>
                            {signinLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </div>

                    <div className="text-center mb-3">
                        <Link to="/forgot-password">Forgot Password?</Link>
                    </div>

                    <p className="text-center">
                        Don’t have an account? <Link to="/register">Register</Link>
                    </p>
                </div>
            </form>
        </div>
    );
}
