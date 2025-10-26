import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AlertDispatcher from '../../utils/AlertDispatcher';
import Profile from './Profile';
import Business from './Business';
import Credentials from './Credentials';
import BankingInformation from './BankingInformation';

export default function UserAccount({ token, user }) {
    const { tab } = useParams();
    const [alert, setAlert] = useState({ type: '', message: '' });

    const activeTab = tab || 'profile';

    const menuItems = [
        { key: 'profile', label: 'Profile', icon: 'fa-user' },
        ...(user.role === 'MANAGER' ? [{ key: 'business', label: 'Business', icon: 'fa-briefcase' }] : []),
        { key: 'banking', label: 'Banking', icon: 'fa-building-columns' },
        { key: 'credentials', label: 'Credentials', icon: 'fa-key' },
    ];

    return (
        <div className="container my-5">
            {/* Alert Section */}
            {alert.message && (
                <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: '', message: '' })}
                />
            )}

            {/* Breadcrumb */}
            <nav aria-label="breadcrumb mb-3">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to="/" className="text-success text-decoration-none">
                            ZS Projects
                        </Link>
                    </li>
                    <li className="breadcrumb-item">
                        <Link to="/user-account/profile" className="text-success text-decoration-none">
                            User Account
                        </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        {activeTab}
                    </li>
                </ol>
            </nav>

            <h2 className="mb-4 text-success fw-bold">User Account</h2>

            <div className="row">
                {/* Sidebar Menu */}
                <div className="col-md-3 mb-3 mb-md-0">
                    <div className="list-group shadow-sm rounded-3">
                        {menuItems.map((item) => (
                            <Link
                                to={`/user-account/${item.key}`}
                                key={item.key}
                                className={`list-group-item list-group-item-action d-flex align-items-center gap-1 ${
                                    activeTab === item.key
                                        ? 'bg-success bg-gradient text-white border-success'
                                        : 'text-dark'
                                }`}
                            >
                                <i className={`fa ${item.icon} me-2`} style={{ width: '20px' }}></i>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Content Section */}
                <div className="col-md-9">
                    <div className="p-3 pt-0 bg-white rounded-sm shadow-sm">
                        {activeTab === 'profile' && <Profile token={token} setAlert={setAlert} />}
                        {activeTab === 'business' && user.role === 'MANAGER' && (
                            <Business token={token} setAlert={setAlert} />
                        )}
                        {activeTab === 'credentials' && <Credentials setAlert={setAlert} />}
                        {activeTab === 'banking' && <BankingInformation token={token} setAlert={setAlert} />}
                    </div>
                </div>
            </div>
        </div>
    );
}
