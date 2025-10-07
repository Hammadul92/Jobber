import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFetchUserQuery } from '../../store';

import SideNav from './SideNav';
import Settings from './Tabs/Settings/';
import Clients from './Tabs/Clients';
import Client from './Tabs/Clients/Client';
import ClientServices from './Tabs/Clients/Services';
import Service from './Tabs/Clients/Services/Service';
import TeamMembers from './Tabs/TeamMembers';
import TeamMember from './Tabs/TeamMembers/TeamMember';
import Quotes from './Tabs/Quotes';
import Quote from './Tabs/Quotes/Quote';

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
            return <Settings token={token} />;
        } else if (page === 'clients') {
            return <Clients token={token} />;
        } else if (page === 'client') {
            return <Client token={token} />;
        } else if (page === 'client-services') {
            return <ClientServices token={token} />;
        } else if (page === 'service') {
            return <Service token={token} />;
        } else if (page === 'team-members') {
            return <TeamMembers token={token} />;
        } else if (page === 'team-member') {
            return <TeamMember token={token} />;
        } else if (page === 'quotes') {
            return <Quotes token={token} />;
        } else if (page === 'quote') {
            return <Quote token={token} />;
        }
        return null;
    };

    return (
        <div className="dashboard-container">
            <SideNav />
            <main className="container tab-container py-4">{renderTab()}</main>
        </div>
    );
}
