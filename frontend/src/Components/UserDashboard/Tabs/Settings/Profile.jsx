import { useState, useEffect } from 'react';
import { useUpdateUserMutation, useFetchUserQuery } from '../../../../store';
import SubmitButton from '../../../../utils/SubmitButton';
import PhoneInputField from '../../../../utils/PhoneInput';

export default function Profile({ token, setAlert }) {
    const { data: user, isFetching, refetch } = useFetchUserQuery(undefined, { skip: !token });

    const [name, setUserName] = useState('');
    const [email, setUserEmail] = useState('');
    const [phone, setUserPhone] = useState('');

    const [updateUser, { isLoading }] = useUpdateUserMutation();

    useEffect(() => {
        if (user) {
            setUserName(user.name || '');
            setUserEmail(user.email || '');
            setUserPhone(user.phone || '');
        }
    }, [user]);

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            await updateUser({ name, email, phone }).unwrap();
            refetch();

            setAlert({ type: 'success', message: 'Profile updated successfully.' });
        } catch (err) {
            console.error('Profile update failed:', err);
            setAlert({
                type: 'danger',
                message: err?.data?.message || 'Profile update failed. Please try again.',
            });
        }
    };

    if (isFetching) return <div>Loading profile...</div>;

    return (
        <form className="tab-pane active" onSubmit={submitHandler}>
            <div className="row mb-4">
                <div className="col-md-4">
                    <div className="field-wrapper">
                        <input
                            type="text"
                            className="form-control"
                            value={name}
                            onChange={(e) => setUserName(e.target.value)}
                            required
                        />
                        <label className="form-label">Full Name (*)</label>
                    </div>

                    <div className="field-wrapper">
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setUserEmail(e.target.value)}
                            required
                        />
                        <label className="form-label">Email (*)</label>
                    </div>

                    <div className="field-wrapper">
                        <PhoneInputField value={phone} setValue={setUserPhone} />
                        <label className="form-label">Phone (*)</label>
                    </div>

                    <div className="field-wrapper">
                        <input type="text" className="form-control" value={user?.last_login || ''} readOnly />
                        <label className="form-label">Last Login</label>
                    </div>
                </div>
            </div>

            <SubmitButton isLoading={isLoading} btnClass="btn btn-success" btnName="Save Changes" />
        </form>
    );
}
