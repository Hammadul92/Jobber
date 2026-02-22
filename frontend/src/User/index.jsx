import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFetchBusinessesQuery } from '../store';
import Topbar from './Topbar';

import SideNav from './SideNav';

import Profile from './(user)/Profile';
import Business from './(user)/Business';
import BankingInformation from './(user)/BankingInformation';
import Credentials from './(user)/Credentials';

import DashboardHome from './(business)/Home';
import Clients from './(business)/Clients';
import ClientServices from './(business)/Clients/Services';
import Service from './(business)/Clients/Services/Service';
import ServiceQuestionnaires from './(business)/ServiceQuestionnaires';
import ServiceQuestionnaire from './(business)/ServiceQuestionnaires/ServiceQuestionnaire';
import ServiceQuestionnaireForm from './(business)/ServiceQuestionnaires/ServiceQuestionnaireForm';
import TeamMembers from './(business)/TeamMembers';
import TeamMember from './(business)/TeamMembers/TeamMember';
import Quotes from './(business)/Quotes';
import Quote from './(business)/Quotes/Quote';
import SignQuote from './(business)/Quotes/signQuote';
import Jobs from './(business)/Jobs';
import Job from './(business)/Jobs/Job';
import Invoices from './(business)/Invoices';
import Invoice from './(business)/Invoices/Invoice';
import Payouts from './(business)/Payouts';
import Payout from './(business)/Payouts/Payout';

export default function UserDashboard({ page, token, user }) {
    const navigate = useNavigate();

    // Define access rules for each dashboard page and allowed roles
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

    // Handle authentication and access control
    useEffect(() => {
        const currentPath = window.location.pathname + window.location.search;

        // Redirect to sign-in if no token
        if (!token) {
            navigate(`/sign-in?next=${encodeURIComponent(currentPath)}`, { replace: true });
            return;
        }

        // Redirect to home if user role is not allowed
        const userRole = user?.role;
        if (!userRole || userRole === 'USER') {
            navigate('/', { replace: true });
            return;
        }

        // Redirect to dashboard home if user role does not match page access
        const rule = accessRules.find((r) => r.page === page);
        if (rule && !rule.roles.includes(userRole)) {
            navigate('/user/business/home', { replace: true });
        }
    }, [user, page, navigate, accessRules, token]);

    // Fetch business data for MANAGER role
    const {
        data: businessesData,
        // isLoading: loadingBusiness,
        // isError: errorBusiness,
    } = useFetchBusinessesQuery(undefined, {
        skip: user?.role !== 'MANAGER' || !token,
    });

    // Get the first business (if any)
    const business = businessesData ? businessesData[0] : null;
    const businessRegistered = Boolean(user?.role && user.role !== 'USER');

    // Render the correct dashboard tab based on the page prop
    const renderTab = () => {
        switch (page) {
            case 'profile':
                // User account tab
                return <Profile token={token} user={user} />;
            case 'business':
                // User account settings tab
                return <Business token={token} user={user} />;
            case 'banking':
                // User account banking tab
                return <BankingInformation token={token} user={user} />;
            case 'credentials':
                // User account credentials tab
                return <Credentials token={token} user={user} />;
            case 'home':
                // Dashboard home tab
                return <DashboardHome token={token} user={user} business={business} />;
            case 'clients':
                // Clients tab
                return <Clients token={token} business={business} role={user?.role} />;
            case 'client-services':
                // Client services tab
                return <ClientServices token={token} role={user?.role} business={business} />;
            case 'service':
                // Service details tab
                return <Service token={token} business={business} role={user?.role} />;
            case 'service-questionnaires':
                // Service questionnaires tab
                return <ServiceQuestionnaires token={token} business={business} role={user?.role} />;
            case 'service-questionnaire':
                // Single service questionnaire tab
                return <ServiceQuestionnaire token={token} business={business} />;
            case 'service-questionnaire-form':
                // Service questionnaire form tab
                return <ServiceQuestionnaireForm token={token} role={user?.role} business={business} />;
            case 'team-members':
                // Team members tab
                return <TeamMembers token={token} business={business} />;
            case 'team-member':
                // Single team member tab
                return <TeamMember token={token} business={business} role={user?.role} />;
            case 'quotes':
                // Quotes tab
                return <Quotes token={token} role={user?.role} business={business} />;
            case 'quote':
                // Single quote tab
                return <Quote token={token} business={business} />;
            case 'sign-quote':
                // Sign quote tab
                return <SignQuote token={token} />;
            case 'jobs':
                // Jobs tab
                return <Jobs token={token} role={user?.role} business={business} />;
            case 'job':
                // Single job tab
                return <Job token={token} role={user?.role} business={business} />;
            case 'invoices':
                // Invoices tab
                return <Invoices token={token} role={user?.role} business={business} />;
            case 'invoice':
                // Single invoice tab
                return <Invoice token={token} role={user?.role} business={business} />;
            case 'payouts':
                // Payouts tab
                return <Payouts token={token} role={user?.role} business={business} />;
            case 'payout':
                // Single payout tab
                return <Payout token={token} role={user?.role} business={business} />;
            default:
                // Fallback for unknown page
                return null;
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Topbar for mobile view */}
            <div className='md:hidden'>
                <Topbar role={user?.role} businessName={business?.name || 'Dashboard'} />
            </div>
            <SideNav user={user} businessRegistered={businessRegistered} />
            <main className="flex-1 p-4 md:p-8 lg:py-12 lg:pl-12 lg:pr-14 max-h-screen overflow-auto">{renderTab()}</main>
        </div>
    )
}
