import { useState } from 'react';
import { useUpdateUserMutation } from '../../store';
import { LuShieldCheck, LuCircleX, LuCircleCheck, LuEye, LuEyeOff, LuLock } from 'react-icons/lu';

export default function Credentials({ setAlert }) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Placeholder for last password change date
    const lastPasswordChangeDate = 'Unknown';

    const [passwordRules, setPasswordRules] = useState({
        length: false,
        uppercase: false,
        number: false,
        special: false,
    });

    const [updateUser, { isLoading, error }] = useUpdateUserMutation();

    const checkPasswordRules = (pwd) => {
        const rules = {
            length: pwd.length >= 8,
            uppercase: /[A-Z]/.test(pwd),
            number: /[0-9]/.test(pwd),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
        };
        setPasswordRules(rules);
    };

    const isStrongPassword = Object.values(passwordRules).every(Boolean);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmNewPassword) {
            setAlert({ type: 'danger', message: 'New passwords do not match!' });
            return;
        }

        if (!isStrongPassword) {
            setAlert({
                type: 'danger',
                message: 'Password does not meet all requirements!',
            });
            return;
        }

        try {
            await updateUser({ password: newPassword }).unwrap();

            setAlert({
                type: 'success',
                message: 'Password updated successfully!',
            });

            setNewPassword('');
            setConfirmNewPassword('');
            setPasswordRules({
                length: false,
                uppercase: false,
                number: false,
                special: false,
            });
        } catch (err) {
            console.error('Password update failed:', err);
            setAlert({
                type: 'danger',
                message: 'Failed to update password. Please try again.',
            });
        }
    };

    // const inputClass =
    //     'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30';
    // const toggleBtn =
    //     'cursor-pointer inline-flex items-center justify-center rounded-r-lg rounded-l-none bg-secondary px-3 py-2 text-white hover:bg-secondary/90';

    return (
        <div className="space-y-5 md:space-y-10">
            {/* Title and Badge */}
            <div className='flex items-start justify-between'>
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-1">Security & Credentials</h2>
                    <p className="text-gray-500">Manage your password settings and account security preferences.</p>
                </div>
                <div className='bg-white rounded-2xl shadow-md p-4 hidden md:flex items-center justify-between gap-2'>
                    <div className='rounded-md bg-[#EEF2FF] p-1'>
                        <LuShieldCheck className='text-[#4F39F6] text-3xl' />
                    </div>
                    <div>
                        <p className='tracking-wide font-semibold text-xs text-gray-400'>PROTECTION STATUS</p>
                        <p className='text-[#4F39F6] font-semibold text-sm'>Enhanced Security</p>
                    </div>
                </div>
            </div>

            <div className="space-y-3 rounded-2xl bg-white p-4 md:p-10 shadow">
                <div>
                    <h5 className="text-2xl font-semibold text-gray-900">Password Requirements</h5>
                    <p className='text-gray-400 mb-5 md:mb-10 mt-1.5 md:text-lg'>Your password must meet the following criteria to ensure maximum security.</p>
                </div>
                <ul className="space-y-3 text-lg">
                    <li className={`flex items-center gap-2 ${passwordRules.length ? 'text-green-600' : 'text-gray-400'}`}>
                        {passwordRules.length ? <LuCircleCheck className='text-xl' /> : <LuCircleX className='text-xl' />}
                        <span>At least 8 characters long</span>
                    </li>
                    <li className={`flex items-center gap-2 ${passwordRules.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                        {passwordRules.uppercase ? <LuCircleCheck className='text-xl' /> : <LuCircleX className='text-xl' />}
                        <span>Contains at least one uppercase letter</span>
                    </li>
                    <li className={`flex items-center gap-2 ${passwordRules.number ? 'text-green-600' : 'text-gray-400'}`}>
                        {passwordRules.number ? <LuCircleCheck className='text-xl' /> : <LuCircleX className='text-xl' />}
                        <span>Contains at least one number</span>
                    </li>
                    <li className={`flex items-center gap-2 ${passwordRules.special ? 'text-green-600' : 'text-gray-400'}`}>
                        {passwordRules.special ? <LuCircleCheck className='text-xl' /> : <LuCircleX className='text-xl' />}
                        <span>Contains at least one special character</span>
                    </li>
                </ul>
                <p className="text-center text-lg text-gray-400 bg-gray-100 p-6 rounded-xl mt-6 italic">
                    Your password must satisfy all of the above to be considered strong.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 md:space-y-10 rounded-2xl bg-white p-4 md:p-10 shadow">
                <div>
                    <h5 className="text-2xl font-semibold text-gray-900">Update Password</h5>
                    <p className='text-gray-400 md:mb-10 mt-1.5 text-lg'>
                        Ensure your account remains secure by using a unique password.
                    </p>
                </div>

                <div className="mb-3 md:mb-6">
                    <label htmlFor={"newPassword"} className="mb-1 block font-semibold text-gray-400 uppercase">
                        {"New Password"} <span className="text-accent">*</span>
                    </label>
                    <div className='relative'>
                        <LuLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id={"newPassword"}
                            className={`w-full rounded-2xl bg-gray-50 border border-gray-300 px-10 py-3 text-lg text-gray-600 focus:outline-none focus:border-gray-800 placeholder:text-gray-300 
                                    ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                checkPasswordRules(e.target.value);
                            }}
                            required={true}
                            autoComplete="off"
                        />
                        {!showPassword ? (
                            <LuEyeOff
                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400"
                                size={20}
                                onClick={() => setShowPassword(true)}
                            />
                        ) : (
                            <LuEye
                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400"
                                size={20}
                                onClick={() => setShowPassword(false)}
                            />
                        )}
                    </div>
                    {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
                </div>

                <div className="mb-6">
                    <label htmlFor={"confirmPassword"} className="mb-1 block font-semibold text-gray-400 uppercase">
                        {"Confirm New Password"} <span className="text-accent">*</span>
                    </label>
                    <div className='relative'>
                        <LuShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id={"confirmPassword"}
                            className={`w-full rounded-2xl bg-gray-50 border border-gray-300 px-10 py-3 text-lg text-gray-600 focus:outline-none focus:border-gray-800 placeholder:text-gray-300 
                                ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                            value={confirmNewPassword}
                            onChange={(e) => {
                                setConfirmNewPassword(e.target.value);
                            }}
                            required={true}
                            autoComplete="off"
                        />
                        {!showConfirmPassword ? (
                            <LuEyeOff
                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400"
                                size={20}
                                onClick={() => setShowConfirmPassword(true)}
                            />
                        ) : (
                            <LuEye
                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400"
                                size={20}
                                onClick={() => setShowConfirmPassword(false)}
                            />
                        )}
                    </div>
                    {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end items-center gap-3">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setNewPassword('');
                            setConfirmNewPassword('');
                            setPasswordRules({
                                length: false,
                                uppercase: false,
                                number: false,
                                special: false,
                            });
                        }}
                        className="rounded-2xl px-4 md:px-6 py-3 md:text-lg font-semibold text-white bg-gray-500 hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || !isStrongPassword || newPassword !== confirmNewPassword || !newPassword}
                        className={`rounded-2xl px-4 md:px-6 py-3 md:text-lg font-semibold transition ${isLoading || !isStrongPassword || newPassword !== confirmNewPassword ? 'bg-gray-400 cursor-not-allowed! text-white' : 'bg-accent hover:shadow-md hover:shadow-accent text-white'}`}
                    >
                        {isLoading ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
            </form>

            {/* <div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                            {error?.data?.message || 'Failed to update password.'}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="newPassword" className="text-sm font-semibold text-gray-800">
                            New Password <sup className="text-accent">*</sup>
                        </label>
                        <div className="flex">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    checkPasswordRules(e.target.value);
                                }}
                                required
                                disabled={isLoading}
                                className={`${inputClass} rounded-r-none`}
                            />
                            <button
                                type="button"
                                className={toggleBtn}
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {!showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="confirmNewPassword" className="text-sm font-semibold text-gray-800">
                            Confirm New Password <sup className="text-accent">*</sup>
                        </label>
                        <div className="flex">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmNewPassword"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                className={`${inputClass} rounded-r-none`}
                            />
                            <button
                                type="button"
                                className={toggleBtn}
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex={-1}
                            >
                                {!showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <SubmitButton
                        isLoading={isLoading}
                        btnClass="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed"
                        btnName="Save Changes"
                        isDisabled={!isStrongPassword}
                    />
                </form>
            </div> */}

            {/* Footer */}
            <div className="mt-10 p-3 pt-10 flex flex-col md:flex-row items-start justify-between gap-2 md:gap-0 border-t border-gray-300 text-gray-400">
                <div className='md:space-y-1 font-bold'>
                    <p className='text-semibold tracking-wider text-sm md:text-base'>LAST PASSWORD CHANGED</p>
                    <p className='md:text-lg text-gray-600'>{lastPasswordChangeDate}</p>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                    <LuShieldCheck className='text-gray-400 md:text-lg' />
                    <p className='text-gray-400 font-semibold text-sm md:text-base'>END-TO-END ENCRYPTION ENABLED</p>
                </div>
            </div>
        </div>
    );
}
