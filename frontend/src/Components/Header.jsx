import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
    useFetchUserQuery,
    useLogoutUserMutation,
    useFetchBusinessesQuery,
    userApi,
    businessApi,
    clientApi,
    serviceQuestionnaireApi,
    teamMemberApi,
    serviceApi,
    quoteApi,
    jobApi,
    bankingInformationApi,
    invoiceApi,
} from '../store';
import './Components.css';
import contractorzLogo from '../../public/images/contractorz-logo-horizontal.svg'

export default function Header() {
    // const [isOpen, setIsOpen] = useState(false);
    const [showOffcanvas, setShowOffcanvas] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const token = localStorage.getItem('token');

    const { data: user, isFetching: isFetchingUser } = useFetchUserQuery(undefined, { skip: !token });
    const { data: businesses, isFetching: isFetchingBusiness } = useFetchBusinessesQuery(undefined, { skip: !token });
    const [logoutUser] = useLogoutUserMutation();

    const handleLogout = async () => {
        await logoutUser();
        [
            userApi,
            businessApi,
            clientApi,
            serviceQuestionnaireApi,
            teamMemberApi,
            serviceApi,
            quoteApi,
            jobApi,
            bankingInformationApi,
            invoiceApi,
        ].forEach((api) => dispatch(api.util.resetApiState()));

        localStorage.removeItem('token');
        navigate('/sign-in');
        setShowOffcanvas(false);
    };

    const business = businesses?.[0] ?? null;
    const loading = isFetchingUser || isFetchingBusiness;

    const scrollToPricing = () => {
        const pricingSection = document.getElementById('pricingPlans');
        if (pricingSection) {
            pricingSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handlePricingClick = (event) => {
        event.preventDefault();

        const isHome = location.pathname === '/';

        if (!isHome) {
            navigate('/');
            setTimeout(scrollToPricing, 150);
            return;
        }

        scrollToPricing();
    };

    const renderLink = (to, icon, label) => (
        <li className="flex items-center justify-between py-3 px-4 border-b border-gray-200 last:border-none">
            <Link
                to={to}
                className="flex items-center justify-between w-full text-gray-800 hover:text-accent"
                onClick={() => setShowOffcanvas(false)}
            >
                <span className="flex items-center gap-2">
                    <i className={`${icon} text-gray-600`}></i>
                    {label}
                </span>
                <i className="fa fa-arrow-right text-gray-500"></i>
            </Link>
        </li>
    );

    const managerMenu = (
        <>
            {renderLink('/dashboard/home', 'fas fa-chart-line', 'Dashboard')}
            {renderLink('/dashboard/clients', 'fas fa-users', 'Clients')}
            {renderLink('/dashboard/service-questionnaires', 'fas fa-list-check', 'Questionnaires')}
            {renderLink('/dashboard/quotes', 'fas fa-file-signature', 'Quotes')}
            {renderLink('/dashboard/jobs', 'fas fa-clipboard-check', 'Jobs')}
            {renderLink('/dashboard/invoices', 'fas fa-file-invoice', 'Invoices')}
            {renderLink('/dashboard/payouts', 'fas fa-credit-card', 'Payouts')}
            {renderLink('/dashboard/team-members', 'fas fa-user-friends', 'Team Members')}
        </>
    );

    const clientMenu = (
        <>
            {renderLink('/dashboard/services', 'fas fa-cogs', 'Services')}
            {renderLink('/dashboard/quotes', 'fas fa-file-signature', 'Quotes')}
            {renderLink('/dashboard/jobs', 'fas fa-clipboard-check', 'Jobs')}
            {renderLink('/dashboard/invoices', 'fas fa-file-invoice', 'Invoices')}
        </>
    );

    const employeeMenu = (
        <>
            {renderLink('/dashboard/jobs', 'fas fa-clipboard-check', 'Jobs')}
            {renderLink('/dashboard/team-members', 'fas fa-user-friends', 'Team Members')}
        </>
    );

    const roleMenus = {
        MANAGER: managerMenu,
        CLIENT: clientMenu,
        EMPLOYEE: employeeMenu,
    };

    return (
        <>
            <header className='flex items-center bg-background justify-between px-32 pt-8 w-full absolute top-0 left-0 z-10'>
                <div>
                    <Link to="/">
                        <img src={contractorzLogo} alt="Logo" width={170} height={0} />
                    </Link>
                </div>
                <nav className='flex items-center gap-10 font-medium'>
                    <Link to="/" className='active'>Home</Link>
                    <Link to="/about">About</Link>
                    <Link to="/product">Product</Link>
                    <Link to="/industries">Industries</Link>
                    <Link to="/resources">Resources</Link>
                    <Link
                        to="/"
                        onClick={handlePricingClick}
                    >
                        Prices
                    </Link>
                </nav>
                <div className="hidden items-center gap-3 md:flex">
                    {loading ? (
                        <span className="text-gray-500">Loading...</span>
                    ) : !token || !user ? (
                        <>
                            <Link
                                className="primary"
                                to="/sign-in"
                            >
                                Login
                            </Link>
                        </>
                    ) : (
                        <button
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-gray-800 hover:text-accent"
                            type="button"
                            onClick={() => setShowOffcanvas(true)}
                        >
                            <i className="far fa-user-circle text-xl"></i>
                            <span className="font-medium">{user.name}</span>
                        </button>
                    )}
                </div>
            </header>

            {/* Offcanvas */}
            {showOffcanvas && (
                <>
                    <div
                        className="fixed inset-0 z-30 bg-black/40"
                        onClick={() => setShowOffcanvas(false)}
                        aria-label="Close menu"
                    ></div>

                    <div className="fixed right-0 top-0 z-40 h-full w-80 max-w-full bg-white shadow-xl">
                        <div className="flex items-center justify-between bg-accent px-5 py-4 text-white">
                            <div className="flex items-center gap-2">
                                <i className="far fa-user-circle text-xl"></i>
                                <span className="font-semibold">{user?.name}</span>
                            </div>
                            <button
                                type="button"
                                className="text-white hover:text-white/80"
                                onClick={() => setShowOffcanvas(false)}
                                aria-label="Close"
                            >
                                <i className="fa fa-times text-lg"></i>
                            </button>
                        </div>

                        <div className="flex flex-col gap-4 px-5 py-4">
                            <div>
                                <h5 className="mb-2 text-sm font-semibold text-gray-900">My Account</h5>
                                <ul className="overflow-hidden rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-800">
                                    {renderLink('/user-account/profile', 'fas fa-user', 'Profile')}
                                    {(user.role === 'USER' || user.role === 'MANAGER') &&
                                        renderLink('/user-account/business', 'fa fa-briefcase', 'Business')}
                                    {renderLink('/user-account/banking', 'fa fa-building-columns', 'Banking')}
                                    {renderLink('/user-account/credentials', 'fa fa-key', 'Credentials')}
                                </ul>
                            </div>

                            {user.role && user.role !== 'USER' && (
                                <div>
                                    <h5 className="mb-2 text-sm font-semibold text-gray-900">
                                        {user.role === 'MANAGER'
                                            ? business?.name
                                            : user.role === 'CLIENT'
                                                ? 'Client Portal'
                                                : 'Employee Portal'}
                                    </h5>
                                    <ul className="overflow-hidden rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-800">
                                        {roleMenus[user.role]}
                                    </ul>
                                </div>
                            )}

                            <button
                                onClick={handleLogout}
                                className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-white shadow hover:bg-red-600"
                            >
                                <i className="fa fa-power-off"></i> Logout
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
