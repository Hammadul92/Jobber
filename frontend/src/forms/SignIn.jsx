import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSigninUserMutation, useFetchUserQuery, useVerifyEmailQuery } from '../store';
import SubmitButton from '../Components/ui/SubmitButton';
import Input from '../Components/ui/Input';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function SignIn() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const next = searchParams.get('next') || '/'; // default to home

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [signinUser, { isLoading: signinLoading, error: signinError }] =
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
        <section className="min-h-screen w-full p-32 flex flex-col items-center justify-center">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl sm:text-4xl font-heading font-bold text-secondary mb-3">Sign In</h2>
                <p className="text-gray-600">Access your workspace and keep your projects moving.</p>
            </div>

            {token && (
                <div className="max-w-xl mx-auto mt-6">
                    {verifying && (
                        <div className="rounded-xl border border-blue-200 bg-blue-50 text-blue-700 px-4 py-3 text-center text-sm font-medium">
                            Verifying your email...
                        </div>
                    )}
                    {!verifying && verifyData?.detail && (
                        <div className="rounded-xl border border-green-200 bg-green-50 text-green-700 px-4 py-3 text-center text-sm font-medium">
                            {verifyData.detail}
                        </div>
                    )}
                    {verifyError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-center text-sm font-medium">
                            {verifyErrorObj?.data?.detail || 'Email verification failed.'}
                        </div>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit} className="mt-10 w-7xl flex justify-center">
                <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100">
                    {signinError && (
                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-center text-sm font-medium">
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
                        fieldClass={'w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:outline-none focus:ring focus:ring-accent focus:border-accent transition bg-white'}
                    />

                    <div className="mt-4 space-y-2">
                        <label htmlFor="password">
                            Password <span className="text-accent font-bold">*</span>
                        </label>
                        <div className="flex">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full rounded-l-xl border border-gray-200 px-4 py-3 text-base focus:outline-none focus:ring focus:ring-accent focus:border-accent transition bg-white"
                            />
                            <button
                                type="button"
                                className="rounded-r-xl cursor-pointer border border-gray-200 bg-slate-50 px-4 text-gray-600 hover:bg-slate-100 transition"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {!showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <div className="text-center mt-6 mb-4">
                        <SubmitButton
                            isLoading={signinLoading}
                            btnClass="w-full rounded-xl bg-accent text-white font-semibold py-3 hover:shadow-lg hover:shadow-accent/30 cursor-pointer transition"
                            btnName="Sign In"
                        />
                    </div>

                    <p className="text-center text-sm text-gray-600">
                        <Link to="/forgot-password" className="text-accent font-semibold hover:underline transition">
                            Forgot Password?
                        </Link>
                    </p>

                    <p className="text-center text-sm text-gray-600 mt-2">
                        Don’t have an account?{' '}
                        <Link to="/register" className="text-accent font-semibold hover:underline transition">
                            Register
                        </Link>
                    </p>
                </div>
            </form>
        </section>
    );
}
