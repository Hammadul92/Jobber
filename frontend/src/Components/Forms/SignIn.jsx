import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { addUser, useSigninUserMutation, useFetchUserQuery } from '../../store';

export default function SignIn() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [signinUser, { isLoading: signinLoading, error: signinError }] = useSigninUserMutation();

  const token = useSelector((state) => state.user?.token);

  const { data: userData, isSuccess: userSuccess } = useFetchUserQuery(undefined, {
    skip: !token,
  });

  // Effect: update user in Redux once user data is fetched
  useEffect(() => {
    if (userSuccess && userData) {
      dispatch(addUser({ token, ...userData }));
      navigate('/');
    }
  }, [userSuccess, userData, token, dispatch, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const result = await signinUser({ email, password }).unwrap();
      // Save token in Redux → this will re-trigger useFetchUserQuery
      dispatch(addUser({ token: result.token }));
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="my-5 container">
      <h2 className="text-center mb-4">Sign In</h2>

      <form onSubmit={handleSubmit} className="row">
        <div className="col-md-4 offset-md-4">
          {/* API Errors */}
          {signinError && (
            <div className="alert alert-danger text-center">{signinError?.data?.detail || 'Invalid credentials'}</div>
          )}

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
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-control form-control-lg"
              placeholder="Password"
            />
          </div>

          {/* Submit Button */}
          <div className="text-center mb-3">
            <button type="submit" className="btn btn-lg btn-success w-100" disabled={signinLoading}>
              {signinLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>

          {/* Forgot Password */}
          <div className="text-center mb-3">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          {/* Register Link */}
          <p className="text-center">
            Don’t have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
