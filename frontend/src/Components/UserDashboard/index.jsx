import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFetchUserQuery } from '../../store';

import SideNav from './SideNav';
import Settings from './Tabs/Settings/';
import Clients from './Tabs/Clients/';

export default function UserDashboard({ page }) {
    const navigate = useNavigate();

    const token = localStorage.getItem('token');

    const {
        data: user,
        isFetching,
        isError,
        error,
    } = useFetchUserQuery(undefined, {
        skip: !token,
    });

    useEffect(() => {
        if (!token || (isError && error?.status === 401)) {
            navigate('/sign-in', { replace: true });
        }
    }, [token, isError, error, navigate]);

    if (isFetching) {
        return <div className="text-center py-5">Loading...</div>;
    }

    const renderTab = () => {
        if (page === 'settings') {
            return <Settings />;
        }
        else if(page === 'clients') {
            return <Clients />;
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
