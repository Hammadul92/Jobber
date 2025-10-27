import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import SideNav from './SideNav';
import DashboardHome from './Tabs/Home/';
import Clients from './Tabs/Clients';
import Client from './Tabs/Clients/Client';
import ClientServices from './Tabs/Clients/Services';
import Service from './Tabs/Clients/Services/Service';
import ServiceQuestionnaires from './Tabs/ServiceQuestionnaires';
import ServiceQuestionnaire from './Tabs/ServiceQuestionnaires/ServiceQuestionnaire';
import ServiceQuestionnaireForm from './Tabs/ServiceQuestionnaires/ServiceQuestionnaireForm';
import TeamMembers from './Tabs/TeamMembers';
import TeamMember from './Tabs/TeamMembers/TeamMember';
import Quotes from './Tabs/Quotes';
import Quote from './Tabs/Quotes/Quote';
import SignQuote from './Tabs/Quotes/signQuote';
import Jobs from './Tabs/Jobs';
import Job from './Tabs/Jobs/Job';

export default function UserDashboard({ page, token, user }) {
    const navigate = useNavigate();

    const accessRules = useMemo(
        () => [
            { page: 'home', roles: ['MANAGER'] },
            { page: 'team-members', roles: ['EMPLOYEE', 'MANAGER'] },
            { page: 'team-member', roles: ['EMPLOYEE', 'MANAGER'] },
            { page: 'clients', roles: ['MANAGER'] },
            { page: 'client', roles: ['MANAGER'] },
            { page: 'service', roles: ['MANAGER'] },
            { page: 'client-services', roles: ['MANAGER', 'CLIENT'] },
            { page: 'service-questionnaires', roles: ['MANAGER'] },
            { page: 'service-questionnaire', roles: ['MANAGER'] },
            { page: 'service-questionnaire-form', roles: ['MANAGER', 'CLIENT']},
            { page: 'quotes', roles: ['CLIENT', 'MANAGER'] },
            { page: 'quote', roles: ['CLIENT', 'MANAGER'] },
            { page: 'sign-quote', roles: ['CLIENT'] },
            { page: 'jobs', roles: ['CLIENT', 'MANAGER', 'EMPLOYEE'] },
            { page: 'job', roles: ['CLIENT', 'MANAGER', 'EMPLOYEE'] },
            { page: 'payouts', roles: ['MANAGER'] },
            { page: 'invoices', roles: ['CLIENT', 'MANAGER'] },
        ],
        []
    );

    useEffect(() => {
        const userRole = user?.role;
        if (!userRole || userRole === 'USER') {
            navigate('/', { replace: true });
            return;
        }

        const rule = accessRules.find((r) => r.page === page);
        if (rule && !rule.roles.includes(userRole)) {
            navigate('/dashboard/home', { replace: true });
        }
    }, [user, page, navigate, accessRules]);

    const renderTab = () => {
        switch (page) {
            case 'home':
                return <DashboardHome token={token} role={user?.role} />;
            case 'clients':
                return <Clients token={token} />;
            case 'client':
                return <Client token={token} />;
            case 'client-services':
                return <ClientServices token={token} role={user?.role} />;
            case 'service':
                return <Service token={token} />;
            case 'service-questionnaires':
                return <ServiceQuestionnaires token={token} />;
            case 'service-questionnaire':
                return <ServiceQuestionnaire token={token} />;
            case 'service-questionnaire-form':
                return <ServiceQuestionnaireForm token={token} role={user?.role} />;
            case 'team-members':
                return <TeamMembers token={token} />;
            case 'team-member':
                return <TeamMember token={token} />;
            case 'quotes':
                return <Quotes token={token} role={user?.role} />;
            case 'quote':
                return <Quote token={token} />;
            case 'sign-quote':
                return <SignQuote token={token} />;
            case 'jobs':
                return <Jobs token={token} role={user?.role} />;
            case 'job':
                return <Job token={token} role={user?.role} />;
            default:
                return null;
        }
    };

    return (
        <div className="dashboard-container">
            <SideNav role={user?.role} userId={user?.id} />
            <main className="container tab-container py-4">{renderTab()}</main>
        </div>
    );
}
