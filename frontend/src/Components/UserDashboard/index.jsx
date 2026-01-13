import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFetchBusinessesQuery } from '../../store';

import SideNav from './SideNav';
import DashboardHome from './Tabs/Home/';
import Clients from './Tabs/Clients';
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
import Invoices from './Tabs/Invoices';
import Invoice from './Tabs/Invoices/Invoice';
import Payouts from './Tabs/Payouts';
import Payout from './Tabs/Payouts/Payout';

export default function UserDashboard({ page, token, user }) {
    const navigate = useNavigate();

    const accessRules = useMemo(
        () => [
            { page: 'home', roles: ['CLIENT', 'MANAGER', 'EMPLOYEE'] },
            { page: 'team-members', roles: ['EMPLOYEE', 'MANAGER'] },
            { page: 'team-member', roles: ['EMPLOYEE', 'MANAGER'] },
            { page: 'clients', roles: ['MANAGER'] },
            { page: 'client', roles: ['MANAGER'] },
            { page: 'service', roles: ['MANAGER'] },
            { page: 'client-services', roles: ['MANAGER', 'CLIENT'] },
            { page: 'service-questionnaires', roles: ['MANAGER'] },
            { page: 'service-questionnaire', roles: ['MANAGER'] },
            { page: 'service-questionnaire-form', roles: ['MANAGER', 'CLIENT'] },
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
        const currentPath = window.location.pathname + window.location.search;

        if (!token) {
            navigate(`/sign-in?next=${encodeURIComponent(currentPath)}`, { replace: true });
            return;
        }

        // Check user role access for the requested page and redirect if unauthorized 
        const userRole = user?.role;
        if (!userRole || userRole === 'USER') {
            navigate('/', { replace: true });
            return;
        }

        const rule = accessRules.find((r) => r.page === page);
        if (rule && !rule.roles.includes(userRole)) {
            navigate('/dashboard/home', { replace: true });
        }
    }, [user, page, navigate, accessRules, token]);

    const {
        data: businessesData,
        isLoading: loadingBusiness,
        isError: errorBusiness,
    } = useFetchBusinessesQuery(undefined, {
        skip: user?.role !== 'MANAGER' || !token,
    });

    const business = businessesData ? businessesData[0] : null;

    const renderTab = () => {
        switch (page) {
            case 'home':
                return <DashboardHome token={token} role={user?.role} business={business} />;
            case 'clients':
                return <Clients token={token} business={business} role={user?.role} />;
            case 'client-services':
                return <ClientServices token={token} role={user?.role} business={business} />;
            case 'service':
                return <Service token={token} business={business} role={user?.role} />;
            case 'service-questionnaires':
                return <ServiceQuestionnaires token={token} business={business} role={user?.role} />;
            case 'service-questionnaire':
                return <ServiceQuestionnaire token={token} business={business} />;
            case 'service-questionnaire-form':
                return <ServiceQuestionnaireForm token={token} role={user?.role} business={business} />;
            case 'team-members':
                return <TeamMembers token={token} business={business} />;
            case 'team-member':
                return <TeamMember token={token} business={business} role={user?.role} />;
            case 'quotes':
                return <Quotes token={token} role={user?.role} business={business} />;
            case 'quote':
                return <Quote token={token} business={business} />;
            case 'sign-quote':
                return <SignQuote token={token} />;
            case 'jobs':
                return <Jobs token={token} role={user?.role} business={business} />;
            case 'job':
                return <Job token={token} role={user?.role} business={business} />;
            case 'invoices':
                return <Invoices token={token} role={user?.role} business={business} />;
            case 'invoice':
                return <Invoice token={token} role={user?.role} business={business} />;
            case 'payouts':
                return <Payouts token={token} role={user?.role} business={business} />;
            case 'payout':
                return <Payout token={token} role={user?.role} business={business} />;
            default:
                return null;
        }
    };

    if (loadingBusiness) return <div className="mt-8 text-center text-gray-600">Loading business info...</div>;
    if (errorBusiness) return <div className="mt-8 text-center text-red-500">Failed to load business info.</div>;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <SideNav role={user?.role} userId={user?.id} />
            <main className="flex-1 px-4 py-6 md:px-8 lg:px-12 max-h-screen overflow-auto">{renderTab()}</main>
        </div>
    );
}
