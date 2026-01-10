import { useEffect, useRef, useState } from 'react';
import {
    FaArrowRight,
    FaBriefcase,
    FaChartLine,
    FaChevronDown,
    FaChevronUp,
    FaCogs,
    FaCreditCard,
    FaKey,
    FaPowerOff,
    FaRegUserCircle,
    FaTimes,
    FaUsers,
    FaUserFriends,
    FaBars,
} from 'react-icons/fa';
import { FaBuildingColumns, FaClipboardCheck, FaFileInvoice, FaFileSignature, FaListCheck } from 'react-icons/fa6';
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
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
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
        setShowDropdown(false);
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

    const renderLink = (to, Icon, label) => (
        <li className="flex items-center justify-between py-3 px-4 border-b border-gray-200 last:border-none">
            <Link
                to={to}
                className="flex items-center justify-between w-full text-gray-800 hover:text-accent"
                onClick={() => setShowDropdown(false)}
            >
                <span className="flex items-center gap-2">
                    <Icon className="text-gray-600" />
                    {label}
                </span>
                <FaArrowRight className="text-gray-500" />
            </Link>
        </li>
    );

    const managerMenu = (
        <>
            {renderLink('/dashboard/home', FaChartLine, 'Dashboard')}
            {renderLink('/dashboard/clients', FaUsers, 'Clients')}
            {renderLink('/dashboard/service-questionnaires', FaListCheck, 'Questionnaires')}
            {renderLink('/dashboard/quotes', FaFileSignature, 'Quotes')}
            {renderLink('/dashboard/jobs', FaClipboardCheck, 'Jobs')}
            {renderLink('/dashboard/invoices', FaFileInvoice, 'Invoices')}
            {renderLink('/dashboard/payouts', FaCreditCard, 'Payouts')}
            {renderLink('/dashboard/team-members', FaUserFriends, 'Team Members')}
        </>
    );

    const clientMenu = (
        <>
            {renderLink('/dashboard/services', FaCogs, 'Services')}
            {renderLink('/dashboard/quotes', FaFileSignature, 'Quotes')}
            {renderLink('/dashboard/jobs', FaClipboardCheck, 'Jobs')}
            {renderLink('/dashboard/invoices', FaFileInvoice, 'Invoices')}
        </>
    );

    const employeeMenu = (
        <>
            {renderLink('/dashboard/jobs', FaClipboardCheck, 'Jobs')}
            {renderLink('/dashboard/team-members', FaUserFriends, 'Team Members')}
        </>
    );

    const roleMenus = {
        MANAGER: managerMenu,
        CLIENT: clientMenu,
        EMPLOYEE: employeeMenu,
    };

    const linkClass = (path) => {
        const isActive = location.pathname === path;
        return `hover:text-accent ${isActive ? 'font-bold text-secondary' : ''}`.trim();
    };

    useEffect(() => {
        // Close dropdown when clicking outside the menu
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    return (
        <header className='flex items-center justify-between bg-background md:px-16 lg:px-32 pt-8 w-full absolute top-0 left-0 z-10'>
            
            {/* Mobile Menu Button */}
            <div className='lg:hidden'>
                <button
                    className="text-secondary mt-3"
                    onClick={() => setShowMenu((open) => !open)}
                >
                    {showMenu ? <FaTimes className="text-3xl" /> : <FaBars className="text-3xl" />}
                </button>
            </div>

            {/* Logo */}
            <div>
                <Link to="/">
                    <img src={contractorzLogo} alt="Logo" width={170} height={0} />
                </Link>
            </div>

            {/* Navigation Menu */}
            <nav className='hidden lg:flex items-center gap-10 font-medium'>
                <Link to="/" className={linkClass('/')}>Home</Link>
                <Link to="/about" className={linkClass('/about')}>About</Link>
                <Link to="/product" className={linkClass('/product')}>Product</Link>
                <Link to="/industries" className={linkClass('/industries')}>Industries</Link>
                <Link to="/resources" className={linkClass('/resources')}>Resources</Link>
                <Link
                    to="/"
                    onClick={handlePricingClick}
                >
                    Prices
                </Link>
            </nav>

            {showDropdown && (
                <div className='absolute top-0 left-0 bg-black/40 w-full h-screen' />
            )}

            {/* Login button and User account dropdown */}
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
                    <div className="relative z-30" ref={menuRef}>
                        <button
                            className="cursor-pointer flex items-center gap-2 rounded-md px-3 py-2 text-gray-800 hover:text-accent"
                            type="button"
                            onClick={() => setShowDropdown((open) => !open)}
                            aria-expanded={showDropdown}
                            aria-haspopup="true"
                        >
                            <FaRegUserCircle className="text-xl" />
                            <span className="font-bold">{user.name}</span>
                            {showDropdown ? (
                                <FaChevronUp className="text-xs" />
                            ) : (
                                <FaChevronDown className="text-xs" />
                            )}
                        </button>

                        {showDropdown && (
                            <div className="absolute z-50 right-0 p-3 mt-3 w-64 rounded-lg bg-white shadow-lg">
                                <div>
                                    <ul className="overflow-hidden rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-800">
                                        {renderLink('/user-account/profile', FaRegUserCircle, 'Profile')}
                                        {(user.role === 'USER' || user.role === 'MANAGER') &&
                                            renderLink('/user-account/business', FaBriefcase, 'Business')}
                                        {renderLink('/user-account/banking', FaBuildingColumns, 'Banking')}
                                        {renderLink('/user-account/credentials', FaKey, 'Credentials')}
                                    </ul>
                                </div>

                                {user.role && user.role !== 'USER' && (
                                    <div>
                                        <h5 className="mt-2  font-semibold text-accent font-heading">
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
                                    className="cursor-pointer rounded-lg mt-1 flex items-center justify-center gap-2 w-full bg-red-500 px-4 py-2 text-white shadow hover:bg-red-600"
                                >
                                    <FaPowerOff /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
