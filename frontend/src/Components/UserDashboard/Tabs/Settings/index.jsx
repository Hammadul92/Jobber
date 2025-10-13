import { useState } from 'react';
import { Link } from 'react-router-dom';
import AlertDispatcher from '../../../../utils/AlertDispatcher';
import Profile from './Profile';
import Business from './Business';
import Credentials from './Credentials';

export default function AccountSettings({ token, role }) {
    const [activeTab, setActiveTab] = useState('profile');
    const [alert, setAlert] = useState({ type: '', message: '' });

    return (
        <>
            {alert.message && <AlertDispatcher type={alert.type} message={alert.message} />}

            <nav aria-label="breadcrumb mb-3">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to={`/dashboard/home`} className="text-success">
                            Dashboard
                        </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        Settings
                    </li>
                </ol>
            </nav>
            <h3 className="mb-3">Settings</h3>

            <ul className="nav nav-tabs">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Profile
                    </button>
                </li>
                {role === 'MANAGER' && (
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'business' ? 'active' : ''}`}
                            onClick={() => setActiveTab('business')}
                        >
                            Business
                        </button>
                    </li>
                )}
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'banking' ? 'active' : ''}`}
                        onClick={() => setActiveTab('banking')}
                    >
                        Banking
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'credentials' ? 'active' : ''}`}
                        onClick={() => setActiveTab('credentials')}
                    >
                        Credentials
                    </button>
                </li>
            </ul>

            <div className="tab-content p-3 bg-white shadow-sm">
                {activeTab === 'profile' && <Profile token={token} setAlert={setAlert} />}
                {activeTab === 'business' && role === 'MANAGER' && <Business token={token} setAlert={setAlert} />}
                {activeTab === 'credentials' && <Credentials setAlert={setAlert} />}
            </div>
        </>
    );
}
