import { useState } from 'react';
import { FaLock } from 'react-icons/fa';
import { CgClose } from 'react-icons/cg';
import { useCreateUserMutation, useCreateClientMutation, useCheckUserExistsMutation } from '../../../../store';
import SubmitButton from '../../../ui/SubmitButton';
import AlertDispatcher from '../../../ui/AlertDispatcher';
import Input from '../../../ui/Input';

function generateStrongPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=<>?';
    let password = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
        password += charset[array[i] % charset.length];
    }
    return password;
}

export default function CreateClientForm({ showModal, setShowModal, setAlert: setParentAlert }) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    const [alert, setAlert] = useState({ type: '', message: '' });

    const [createUser, { isLoading: creatingUser }] = useCreateUserMutation();
    const [createClient, { isLoading: creatingClient }] = useCreateClientMutation();
    const [checkUserExists, { isLoading: checkingUser }] = useCheckUserExistsMutation();

    const isSubmitting = creatingUser || creatingClient || checkingUser;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlert({ type: '', message: '' });

        if (!name || !email || !phone) {
            setAlert({ type: 'danger', message: 'Please fill all required fields.' });
            return;
        }

        try {
            const checkResponse = await checkUserExists({ email }).unwrap();
            let userId = checkResponse?.id;

            if (!userId) {
                const password = generateStrongPassword();
                const userPayload = { name, email, phone, password, role: 'CLIENT' };
                const newUser = await createUser(userPayload).unwrap();
                userId = newUser.id;
            }

            await createClient({ user: userId }).unwrap();

            const success = { type: 'success', message: 'Client added successfully.' };
            setAlert(success);
            if (setParentAlert) setParentAlert(success);
            setName('');
            setPhone('');
            setEmail('');
            setShowModal(false);
        } catch (err) {
            const message =
                err?.data?.detail ||
                (err?.data && typeof err.data === 'object'
                    ? Object.entries(err.data)
                        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                        .join(' | ')
                    : err?.message) ||
                'Failed to create client. Please try again.';
            const danger = { type: 'danger', message };
            setAlert(danger);
            if (setParentAlert) setParentAlert(danger);
            console.error('Create client error:', err);
        }
    };

    return (
        <>
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowModal(false)}>
                    <div 
                    className="max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
                    onClick={(event) => event.stopPropagation()}
                    >
                        <div className="p-6 flex items-start bg-secondary text-white rounded-t-lg justify-between gap-3">
                            <div>
                                <h5 className="text-xl font-semibold font-heading leading-tight">Add Client Account</h5>
                                <p className="text-sm text-white/80">Secure login is generated automatically and emailed.</p>
                            </div>
                            <button
                                type="button"
                                className="text-gray-200 transition hover:text-gray-400"
                                onClick={() => setShowModal(false)}
                                aria-label="Close"
                            >
                                <CgClose className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
                            <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                <div className="flex items-start gap-2">
                                    <FaLock className="mt-0.5 h-4 w-4" />
                                    <p className="leading-5">
                                        We generate a strong password and send the invite email. Clients can reset anytime from the portal.
                                    </p>
                                </div>
                            </div>

                            {alert.message && (
                                <AlertDispatcher
                                    type={alert.type}
                                    message={alert.message}
                                    onClose={() => setAlert({ type: '', message: '' })}
                                />
                            )}

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Input
                                    id="name"
                                    value={name}
                                    label="Full Name"
                                    isRequired={true}
                                    onChange={setName}
                                    fieldClass="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                                />
                                <Input
                                    type="email"
                                    id="email"
                                    value={email}
                                    label="Email"
                                    isRequired={true}
                                    onChange={setEmail}
                                    fieldClass="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                                />
                                <Input
                                    type="tel"
                                    id="phone"
                                    value={phone}
                                    label="Phone"
                                    isRequired={true}
                                    onChange={setPhone}
                                    fieldClass="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-1">
                                <button
                                    type="button"
                                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                                    onClick={() => setShowModal(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <SubmitButton
                                    isLoading={isSubmitting}
                                    btnClass="primary px-4! py-2! rounded-lg! text-sm! font-semibold!"
                                    btnName="Create Client"
                                />
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
