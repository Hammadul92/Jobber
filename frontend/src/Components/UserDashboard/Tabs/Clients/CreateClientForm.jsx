import { useState } from 'react';
import { useCreateUserMutation, useCreateClientMutation, useCheckUserExistsMutation } from '../../../../store';
import SubmitButton from '../../../../utils/SubmitButton';
import PhoneInputField from '../../../../utils/PhoneInput';
import AlertDispatcher from '../../../../utils/AlertDispatcher';

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

export default function CreateClientForm({ showModal, setShowModal }) {
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

            setAlert({ type: 'success', message: 'Client added successfully.' });
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
            setAlert({ type: 'danger', message });
            console.error('Create client error:', err);
        }
    };

    return (
        <>
            {showModal && (
                <div className="modal d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Add New Client</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <p className="p-2 bg-light rounded">
                                        Login credentials will be automatically generated, and a confirmation link will
                                        be sent to the client’s email. The client can set their own password later via
                                        the "Forgot Password" option.
                                    </p>

                                    {alert.message && (
                                        <AlertDispatcher
                                            type={alert.type}
                                            message={alert.message}
                                            onClose={() => setAlert({ type: '', message: '' })}
                                        />
                                    )}

                                    <div className="row">
                                        <div className="mb-3 col-md-6">
                                            <label className="form-label">Name (*)</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3 col-md-6">
                                            <label className="form-label">Email (*)</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3 col-md-6">
                                            <label className="form-label">Phone (*)</label>
                                            <PhoneInputField value={phone} setValue={setPhone} />
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-dark"
                                        onClick={() => setShowModal(false)}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <SubmitButton
                                        isLoading={isSubmitting}
                                        btnClass="btn btn-sm btn-success"
                                        btnName="Add Client"
                                    />
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {showModal && <div className="modal-backdrop fade show"></div>}
        </>
    );
}
