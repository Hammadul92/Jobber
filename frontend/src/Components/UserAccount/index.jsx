import { useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import AlertDispatcher from '../../utils/AlertDispatcher';
import Profile from './Profile';
import Business from './Business';
import Credentials from './Credentials';
import BankingInformation from './BankingInformation';

export default function UserAccount({ token, user }) {
    const { tab } = useParams();
    const [alert, setAlert] = useState({ type: '', message: '' });

    const activeTab = tab || 'profile';

    if (!['MANAGER', 'USER'].includes(user?.role) && activeTab === 'business') {
        return <Navigate to="/user-account/profile" replace />;
    }

    const menuItems = [
        { key: 'profile', label: 'Profile', icon: 'fa-user', is_visible: true },
        {
            key: 'business',
            label: 'Business',
            icon: 'fa-briefcase',
            is_visible: ['MANAGER', 'USER'].includes(user?.role),
        },
        { key: 'banking', label: 'Banking', icon: 'fa-building-columns', is_visible: true },
        { key: 'credentials', label: 'Credentials', icon: 'fa-key', is_visible: true },
    ];

    return (
        <div className="container my-5">
            {alert.message && (
                <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: '', message: '' })}
                />
            )}

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
                    <li className="breadcrumb-item active text-capitalize" aria-current="page">
                        {activeTab}
                    </li>
                </ol>
            </nav>

            <h2 className="mb-3 fw-bold">User Account</h2>

            <div className="row">
                <div className="col-md-3 mb-3 mb-md-0">
                    <div className="list-group shadow-sm rounded-3">
                        {menuItems
                            .filter((item) => item.is_visible)
                            .map((item) => (
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

                <div className="col-md-9">
                    <div className="p-3 pt-0 bg-white rounded-sm shadow-sm">
                        {activeTab === 'profile' && <Profile token={token} setAlert={setAlert} />}
                        {activeTab === 'business' && (user?.role === 'MANAGER' || user?.role === 'USER') && (
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
