import React, { useState } from 'react';
import { useSelector } from 'react-redux';

export default function AccountSettings() {
  const user = useSelector((state) => state.user);
  const [activeTab, setActiveTab] = useState('profile');
  const [userName, setUserName] = useState(user.name)
  const [userEmail, setUserEmail] = useState(user.email)

  return (
    <div className="container mt-4">
      <h3 className='mb-3'>Settings</h3>

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
            className={`nav-link ${activeTab === 'credentials' ? 'active' : ''}`}
            onClick={() => setActiveTab('credentials')}
          >
            Credentials
          </button>
        </li>
      </ul>

      {/* Tabs Content */}
      <div className="tab-content py-3">
        {activeTab === 'profile' && (
          <div className="tab-pane active">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Full Name (*)</label>
                  <input type="text" className="form-control" value={userName} onChange={e => setUserName(e.target.value)} required />
                </div>
                <div className="mb-3 w-md-50">
                  <label className="form-label">Email (*)</label>
                  <input type="email" className="form-control" value={userEmail} onChange={e => setUserEmail(e.target.value)}required />
                </div>
                <div className="mb-3 w-md-50">
                  <label className="form-label">Last Login</label>
                  <input type="text" className="form-control" value={user.last_login} readOnly/>
                </div>
              </div>
            </div>
            <button className="btn btn-success">Save Profile</button>
          </div>
        )}

        {activeTab === 'business' && (
          <div className="tab-pane active">
            <div className="mb-3">
              <label className="form-label">Business Name</label>
              <input type="text" className="form-control" placeholder="Your Business" />
            </div>
            <div className="mb-3">
              <label className="form-label">Business Email</label>
              <input type="email" className="form-control" placeholder="business@example.com" />
            </div>
            <div className="mb-3">
              <label className="form-label">Business Phone</label>
              <input type="text" className="form-control" placeholder="+1 234 567 890" />
            </div>
            <div className="mb-3">
              <label className="form-label">Timezone</label>
              <select className="form-select">
                <option>UTC</option>
                <option>EST</option>
                <option>PST</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Services Offered</label>
              <select className="form-select" multiple>
                <option>Construction</option>
                <option>Cleaning Service</option>
                <option>Landscaping</option>
                <option>Plumbing</option>
                <option>Electrical</option>
                <option>Snow Removal</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Business Logo</label>
              <input type="file" className="form-control" />
            </div>
            <button className="btn btn-success">Save Business</button>
          </div>
        )}

        {activeTab === 'credentials' && (
          <div className="tab-pane active">
            <h5>Update Credentials</h5>
            <div className="mb-3">
              <label className="form-label">Old Password</label>
              <input type="password" className="form-control" />
            </div>
            <div className="mb-3">
              <label className="form-label">New Password</label>
              <input type="password" className="form-control" />
            </div>
            <div className="mb-3">
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="form-control" />
            </div>
            <button className="btn btn-success">Save Credentials</button>
          </div>
        )}
      </div>
    </div>
  );
}
