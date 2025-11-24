import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSigninUserMutation, useFetchUserQuery, useVerifyEmailQuery } from '../../store';
import SubmitButton from '../../utils/SubmitButton';
import Input from '../../utils/Input';

export default function SignIn() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const next = searchParams.get('next') || '/'; // default to home

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [signinUser, { isLoading: signinLoading, error: signinError, isSuccess: signinSuccess }] =
        useSigninUserMutation();

    const { data: userData, isSuccess: userFetched } = useFetchUserQuery(undefined, {
        skip: !localStorage.getItem('token'),
    });

    const {
        data: verifyData,
        isLoading: verifying,
        isError: verifyError,
        error: verifyErrorObj,
    } = useVerifyEmailQuery(token, { skip: !token });

    // ✅ Redirect after login success
    useEffect(() => {
        if (userFetched && userData) {
            navigate(next, { replace: true });
        }
    }, [userFetched, userData, navigate, next]);

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
            <h2 className="text-center mb-3 fw-bold">Sign In</h2>

            {token && (
                <div className="mb-4 col-md-4 offset-md-4">
                    {verifying && <div className="alert alert-info text-center">Verifying your email...</div>}
                    {!verifying && verifyData?.detail && (
                        <div className="alert alert-success text-center">{verifyData.detail}</div>
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

                    <div className="mb-3">
                        <label htmlFor="password" className="form-label fw-bold">
                            Password <small className="text-danger">(Required)</small>
                        </label>
                        <div className="input-group">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="form-control form-control-lg"
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

                    <div className="text-center mb-3">
                        <SubmitButton
                            isLoading={signinLoading}
                            btnClass="btn btn-lg btn-success w-100"
                            btnName="Sign In"
                        />
                    </div>

                    <p className="text-center">
                        <Link to="/forgot-password" className="text-success fw-semibold text-decoration-none">
                            Forgot Password?
                        </Link>
                    </p>

                    <p className="text-center">
                        Don’t have an account?{' '}
                        <Link to="/register" className="text-success fw-semibold text-decoration-none">
                            Register
                        </Link>
                    </p>
                </div>
            </form>
        </div>
    );
}
