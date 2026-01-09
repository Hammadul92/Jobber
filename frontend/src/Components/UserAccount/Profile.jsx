import { useState, useEffect } from 'react';
import { useUpdateUserMutation, useFetchUserQuery } from '../../store';
import SubmitButton from '../ui/SubmitButton';
import { formatDate } from '../../utils/formatDate';
import Input from '../ui/Input';

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

    const inputClass =
        'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30';

    return (
        <form className="space-y-6" onSubmit={submitHandler}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                    id="name"
                    label={'Full Name'}
                    value={name}
                    isRequired={true}
                    onChange={setUserName}
                    fieldClass={inputClass}
                />
                <Input
                    id="email"
                    label={'Email'}
                    value={email}
                    isRequired={true}
                    isDisabled={true}
                    onChange={setUserEmail}
                    fieldClass={inputClass}
                />
                <Input
                    type="tel"
                    id="phone"
                    label={'Phone'}
                    value={phone}
                    isRequired={true}
                    onChange={setUserPhone}
                    fieldClass={inputClass}
                />
                <Input
                    id="last_login"
                    label={'Last Login'}
                    value={formatDate(user?.last_login) || ''}
                    isDisabled={true}
                    onChange={null}
                    fieldClass={inputClass}
                />
            </div>

            <SubmitButton
                isLoading={isLoading}
                btnClass="primary"
                btnName="Save Changes"
            />
        </form>
    );
}
