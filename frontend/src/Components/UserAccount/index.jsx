import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AlertDispatcher from '../../utils/AlertDispatcher';
import Profile from './Profile';
import Business from './Business';
import Credentials from './Credentials';

export default function AccountSettings({ token, user }) {
    const location = useLocation();
    const [alert, setAlert] = useState({ type: '', message: '' });

    // Extract active tab from URL — e.g., "/user-account/profile" → "profile"
    const activeTab = location.pathname.split('/').pop() || 'profile';

    const menuItems = [
        { key: 'profile', label: 'Profile', icon: 'fa-user' },
        ...(user.role === 'MANAGER' ? [{ key: 'business', label: 'Business', icon: 'fa-briefcase' }] : []),
        { key: 'banking', label: 'Banking', icon: 'fa-building-columns' },
        { key: 'credentials', label: 'Credentials', icon: 'fa-lock' },
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

            {/* Breadcrumb */}
            <nav aria-label="breadcrumb mb-3">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to="/" className="text-success text-decoration-none">
                            ZS Projects
                        </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        User Account
                    </li>
                </ol>
            </nav>

            <h2 className="mb-4 text-success fw-bold">User Account</h2>

            <div className="row">
                {/* Sidebar */}
                <div className="col-md-3 mb-3 mb-md-0">
                    <div className="list-group shadow-sm rounded-3">
                        {menuItems.map((item) => (
                            <Link
                                to={`/user-account/${item.key}`}
                                key={item.key}
                                className={`list-group-item list-group-item-action d-flex align-items-center gap-2 py-3 ${
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

                {/* Content */}
                <div className="col-md-9">
                    <div className="p-3 pt-0 bg-white rounded-sm shadow-sm">
                        {activeTab === 'profile' && <Profile token={token} setAlert={setAlert} />}
                        {activeTab === 'business' && user.role === 'MANAGER' && (
                            <Business token={token} setAlert={setAlert} />
                        )}
                        {activeTab === 'credentials' && <Credentials setAlert={setAlert} />}
                        {activeTab === 'banking' && (
                            <div className="text-muted text-center py-5">
                                <i className="fa fa-building-columns fa-2x mb-3 text-success"></i>
                                <p className="mb-0">Banking section coming soon...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
