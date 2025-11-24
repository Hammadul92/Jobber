import { useState, useEffect } from 'react';
import { useUpdateUserMutation, useFetchUserQuery } from '../../store';
import SubmitButton from '../../utils/SubmitButton';
import { formatDate } from '../../utils/formatDate';
import Input from '../../utils/Input';

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
            <div className="row">
                <div className="col-md-6">
                    <Input
                        id="name"
                        label={'Full Name'}
                        value={name}
                        isRequired={true}
                        onChange={setUserName}
                        fieldClass={'form-control'}
                    />
                </div>
                <div className="col-md-6">
                    <Input
                        id="email"
                        label={'Email'}
                        value={email}
                        isRequired={true}
                        isDisabled={true}
                        onChange={setUserEmail}
                        fieldClass={'form-control'}
                    />
                </div>
                <div className="col-md-6">
                    <Input
                        type="tel"
                        id="phone"
                        label={'Phone'}
                        value={phone}
                        isRequired={true}
                        onChange={setUserPhone}
                        fieldClass={'form-control'}
                    />
                </div>
                <div className="col-md-6">
                    <Input
                        id="last_login"
                        label={'Last Login'}
                        value={formatDate(user?.last_login) || ''}
                        isDisabled={true}
                        onChange={null}
                        fieldClass={'form-control'}
                    />
                </div>
            </div>

            <SubmitButton isLoading={isLoading} btnClass="btn btn-sm btn-success" btnName="Save Changes" />
        </form>
    );
}
