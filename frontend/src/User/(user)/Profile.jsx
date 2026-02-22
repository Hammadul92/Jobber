import { useState, useEffect } from 'react';
import { useUpdateUserMutation, useFetchUserQuery } from '../../store';
import SubmitButton from '../../Components/ui/SubmitButton';
import { formatDate } from '../../utils/formatDate';
import Input from '../../Components/ui/Input';
import { LuCamera } from "react-icons/lu";

export default function Profile({ token, setAlert }) {
    const { data: user, isFetching, refetch } = useFetchUserQuery(undefined, { skip: !token });

    const [name, setUserName] = useState('');
    const [email, setUserEmail] = useState('');
    const [phone, setUserPhone] = useState('');
    const [photo, setPhoto] = useState(null);
    photo;
    const [photoPreview, setPhotoPreview] = useState(null);
    // Handle image upload
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file && (file.type === 'image/jpeg' || file.type === 'image/png') && file.size <= 5 * 1024 * 1024) {
            setPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
        } else {
            setAlert({ type: 'danger', message: 'Invalid file. Please upload JPG or PNG under 5MB.' });
        }
    };

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
        'w-full rounded-xl border border-gray-300 bg-white px-5! p-4! focus:outline-none';

    return (
        <div>
            <div>
                <h2 className="text-4xl font-bold mb-1">Welcome, {user?.name || 'User'}!</h2>
                <p className="text-gray-500 mb-6">Manage your profile and account settings.</p>
            </div>
            <form className="space-y-6 bg-white shadow-md rounded-2xl p-10" onSubmit={submitHandler}>
                <div className="relative w-36 h-36">
                    <img
                        src={photoPreview || user?.photoUrl || '/public/images/user.png'}
                        alt="Profile"
                        className="w-36 h-36 rounded-full object-cover border border-gray-200 shadow-md bg-white"
                    />
                    <label htmlFor="photo-upload" className="absolute bottom-0 right-0 cursor-pointer bg-white rounded-full p-2 shadow-md border border-gray-200">
                        <LuCamera className="text-black" size={24} />
                        <input
                            id="photo-upload"
                            type="file"
                            accept="image/jpeg,image/png"
                            className="hidden"
                            onChange={handlePhotoChange}
                        />
                    </label>
                </div>
                <div>
                    <span className="block text-orange-500 font-semibold text-lg mb-1">Change Photo</span>
                    <span className="block text-gray-400 text-sm mb-2">JPG OR PNG. MAX 5MB</span>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                        label={'Email Address'}
                        value={email}
                        isRequired={true}
                        isDisabled={true}
                        onChange={setUserEmail}
                        fieldClass={inputClass}
                    />
                    <Input
                        type="tel"
                        id="phone"
                        label={'Phone Number'}
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
                <div className="flex justify-between items-center mt-8">
                    <span className="text-gray-400 text-sm">Update your personal information to keep your profile current.</span>
                    <SubmitButton
                        isLoading={isLoading}
                        btnClass="primary"
                        btnName="Save Changes"
                    />
                </div>
            </form>
        </div>
    );
}
