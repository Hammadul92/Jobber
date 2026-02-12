import { useState } from 'react';
import { FaUser, FaBriefcase, FaKey } from 'react-icons/fa';
import { FaBuildingColumns } from 'react-icons/fa6';
import { Link, useParams, Navigate } from 'react-router-dom';
import AlertDispatcher from '../ui/AlertDispatcher';
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
        { key: 'profile', label: 'Profile', Icon: FaUser, is_visible: true },
        {
            key: 'business',
            label: 'Business',
            Icon: FaBriefcase,
            is_visible: ['MANAGER', 'USER'].includes(user?.role),
        },
        { key: 'banking', label: 'Banking', Icon: FaBuildingColumns, is_visible: true },
        { key: 'credentials', label: 'Credentials', Icon: FaKey, is_visible: true },
    ];

    return (
        <div className="min-h-screen w-full px-4 py-8 md:px-8 lg:p-32">
            {alert.message && (
                <AlertDispatcher
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: '', message: '' })}
                />
            )}

            {/* <nav aria-label="breadcrumb" className="mb-6">
                <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <li>
                        <Link to="/" className="font-semibold text-accent hover:text-accent/80">
                            CONTRACTORZ
                        </Link>
                        <Link
                            to={`/user-account/${item.key}`}
                            key={item.key}
                            className={`flex items-center gap-3 py-4 px-4 transition first:rounded-t-xl ${isActive
                                    ? 'bg-accent text-white font-bold'
                                    : 'text-gray-800 hover:bg-secondary hover:text-white font-medium '
                                }`}
                        >
                            <item.Icon className="text-base w-5" />
                            <span>{item.label}</span>
                        </Link>
                        < li className="text-gray-400">/</1i>
                        < li className="capitalize text-gray-80Ø">{activeTab}</1i>
                    </1i>
                </ol>
            </nav> */}
            
            <h2 className="mb-6 text-2xl font-bold text-gray-900">{"Welcome, " + user?.name || 'User Account'}</h2>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="lg:col-span-3">
                    <div className="rounded-xl overflow-hidden flex items-center justify-start lg:flex-col lg:items-start min-h-full border border-gray-200 bg-white shadow-sm">
                        {menuItems
                            .filter((item) => item.is_visible)
                            .map((item) => {
                                const isActive = activeTab === item.key;
                                return (
                                    <Link
                                        to={`/user-account/${item.key}`}
                                        key={item.key}
                                        className={`flex items-center md:gap-3 p-4 md:w-1/4 lg:w-full transition ${isActive
                                            ? 'bg-accent text-white font-bold'
                                            : 'text-gray-800 hover:bg-secondary hover:text-white font-medium '
                                            }`}
                                    >
                                        <item.Icon className="hidden md:inline text-base w-5" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                    </div>
                </div>

                <div className="lg:col-span-9">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
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
