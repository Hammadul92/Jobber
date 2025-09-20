import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import SideNav from './SideNav';
import Settings from './Tabs/Settings/';

export default function UserDashboard({ page }) {
    const user = useSelector((state) => state.user);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || Object.keys(user).length === 0) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    const renderTab = () => {
        if (page === 'settings') {
            return <Settings />;
        }

        return null;
    };

    return (
        <div className="dashboard-container">
            <SideNav />
            <main className="container py-3 tab-container">{renderTab()}</main>
        </div>
    );
}
