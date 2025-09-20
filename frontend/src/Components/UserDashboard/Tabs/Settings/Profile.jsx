import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addUser, useUpdateUserMutation, useFetchUserQuery } from '../../../../store';

export default function Profile() {
    const dispatch = useDispatch();
    const { data: user, isFetching, refetch } = useFetchUserQuery();

    const [name, setUserName] = useState('');
    const [email, setUserEmail] = useState('');
    const [alert, setAlert] = useState(null);

    const [updateUser, { isLoading, error }] = useUpdateUserMutation();

    useEffect(() => {
        if (user) {
            setUserName(user.name || '');
            setUserEmail(user.email || '');
            dispatch(addUser(user));
        }
    }, [user]);

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            await updateUser({ name, email }).unwrap();

            setAlert({
                type: 'success',
                message: 'Profile updated successfully.',
            });

            // Force refresh user data after update
            refetch();
        } catch (err) {
            console.error('Profile update failed:', err);
            setAlert({
                type: 'danger',
                message: 'Profile update failed. Please try again.',
            });
        }
    };

    if (isFetching) {
        return <div>Loading profile...</div>;
    }

    return (
        <form className="tab-pane active" onSubmit={submitHandler}>
            <div className="row">
                <div className="col-md-6">
                    {/* Success/Error Alert */}
                    {alert && (
                        <div className={`alert alert-${alert.type}`} role="alert">
                            {alert.message}
                        </div>
                    )}
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error?.data?.message || 'Profile update failed. Please try again.'}
                        </div>
                    )}

                    {/* Full Name */}
                    <div className="mb-3">
                        <label className="form-label">Full Name (*)</label>
                        <input
                            type="text"
                            className="form-control"
                            value={name}
                            onChange={(e) => setUserName(e.target.value)}
                            required
                        />
                    </div>

                    {/* Email */}
                    <div className="mb-3 w-md-50">
                        <label className="form-label">Email (*)</label>
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setUserEmail(e.target.value)}
                            required
                        />
                    </div>

                    {/* Last Login (read-only) */}
                    <div className="mb-3 w-md-50">
                        <label className="form-label">Last Login</label>
                        <input type="text" className="form-control" value={user?.last_login || ''} readOnly />
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <button className="btn btn-success" disabled={isLoading}>
                {isLoading ? 'Saving Profile...' : 'Save Profile'}
            </button>
        </form>
    );
}
