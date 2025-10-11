import { useState } from 'react';
import { Link } from 'react-router-dom';

import Profile from './Profile';
import Business from './Business';
import Credentials from './Credentials';

export default function AccountSettings({ token, role }) {
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <div>
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

            {/* Tabs Navigation */}
            <ul className="nav nav-tabs">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Profile
                    </button>
                </li>
                {role === 'MANAGER' ? (
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'business' ? 'active' : ''}`}
                            onClick={() => setActiveTab('business')}
                        >
                            Business
                        </button>
                    </li>
                ) : null}
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

            {/* Tabs Content */}
            <div className="tab-content py-3">
                {activeTab === 'profile' && <Profile token={token} />}
                {activeTab === 'business' && role === 'MANAGER' && <Business token={token} />}
                {activeTab === 'credentials' && <Credentials />}
            </div>
        </div>
    );
}
