import { useState } from 'react';
import { useCreateClientMutation } from '../../../../store';

export default function CreateClientForm() {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    const [createClient, { isLoading, error, isSuccess }] = useCreateClientMutation();

    const handleSubmit = async (e) => {
        e.preventDefault(); // fixed typo

        try {
            await createClient({ name, phone, email }).unwrap();

            // Reset form on success
            setName('');
            setPhone('');
            setEmail('');
        } catch (err) {
            console.error('Failed to create client:', err);
        }
    };

    return (
        <form className="shadow-sm p-3 bg-body rounded" onSubmit={handleSubmit}>
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
                    <div className="row">
                        <label className="col-sm-3 col-form-label text-lg">Name (*)</label>
                        <div className="col-sm-9">
                            <input
                                type="text"
                                className="form-control form-control-lg"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="mb-3 col-md-4">
                    <div className="row">
                        <label className="col-sm-3 col-form-label">Email (*)</label>
                        <div className="col-sm-9">
                            <input
                                type="email"
                                className="form-control form-control-lg"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="mb-3 col-md-4">
                    <div className="row">
                        <label className="col-sm-3 col-form-label">Phone (*)</label>
                        <div className="col-sm-9">
                            <input
                                type="text"
                                className="form-control form-control-lg"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <button type="submit" className="btn btn-success" disabled={isLoading}>
                    {isLoading ? 'Adding...' : 'Add Client'}
                </button>
            </div>
        </form>
    );
}
