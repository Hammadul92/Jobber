import { useState } from 'react';
import Profile from './Profile';
import Business from './Business';
import Credentials from './Credentials';

export default function AccountSettings() {
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <div>
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
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'business' ? 'active' : ''}`}
                        onClick={() => setActiveTab('business')}
                    >
                        Business
                    </button>
                </li>
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
                {activeTab === 'profile' && <Profile />}
                {activeTab === 'business' && <Business />}
                {activeTab === 'credentials' && <Credentials />}
            </div>
        </div>
    );
}
