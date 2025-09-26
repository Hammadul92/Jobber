import { useState } from 'react';

export default function CreateClientForm() {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = (e) => {
        e.preventDeafult();
    };

    return (
        <form className="py-3" onSubmit={handleSubmit}>
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
                <button className="btn btn-success float-end">Add Client</button>
            </div>
        </form>
    );
}
