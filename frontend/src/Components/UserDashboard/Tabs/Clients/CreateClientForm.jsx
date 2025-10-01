import { useState } from 'react';
import { useCreateClientMutation } from '../../../../store';

export default function CreateClientModal({ showModal, setShowModal }) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    const [createClient, { isLoading, error, isSuccess }] = useCreateClientMutation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createClient({ name, phone, email }).unwrap();
            setName('');
            setPhone('');
            setEmail('');
            setShowModal(false);
        } catch (err) {
            console.error('Failed to create client:', err);
        }
    };

    return (
        <>
            {showModal && (
                <div className="modal d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-lg" role="document">
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
                                    {error && (
                                        <div className="alert alert-danger mb-3" role="alert">
                                            {error?.data?.detail || 'Failed to add client. Please try again.'}
                                        </div>
                                    )}
                                    {isSuccess && (
                                        <div className="alert alert-success mb-3" role="alert">
                                            Client added successfully!
                                        </div>
                                    )}
                                    <div className="row">
                                        <div className="mb-3 col-md-4">
                                            <label className="form-label">Name (*)</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3 col-md-4">
                                            <label className="form-label">Email (*)</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3 col-md-4">
                                            <label className="form-label">Phone (*)</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-success" disabled={isLoading}>
                                        {isLoading ? 'Adding...' : 'Add Client'}
                                    </button>
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
