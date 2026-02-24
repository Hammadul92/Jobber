import { useEffect, useRef, useState } from 'react';
import MegaMenu from './MegaMenu';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import './Components.css';
import {
    FaChevronDown,
    FaChevronRight,
    FaChevronUp,
    FaBars,
} from 'react-icons/fa';
import { LuLogOut, LuUser, LuCircleUser, LuBuilding2, LuCreditCard, LuKey } from "react-icons/lu";
import { FiLogIn } from "react-icons/fi";
import {
    useFetchUserQuery,
    useLogoutUserMutation,
    // useFetchBusinessesQuery,
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
import AnnouncementBar from './AnnouncementBar';


// import contractorzLogo from '../../public/images/contractorz-logo-horizontal.svg'
// Use public path for images in public directory
const contractorzLogo = '/images/contractorz-logo-horizontal.svg';

export default function Header() {
    // const [isOpen, setIsOpen] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMegaMenu, setShowMegaMenu] = useState(false);
    const [showMobileIndustries, setShowMobileIndustries] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const token = localStorage.getItem('token');

    const { data: user, isFetching: isFetchingUser } = useFetchUserQuery(undefined, { skip: !token });
    // const { data: businesses, isFetching: isFetchingBusiness } = useFetchBusinessesQuery(undefined, { skip: !token });
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

    // const business = businesses?.[0] ?? null;
    const loading = isFetchingUser;

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
        setMobileNavOpen(false);
    };

    const renderLink = (to, Icon, label) => (
        <li className="flex items-center justify-between " >
            <Link
                to={to}
                className="flex items-center justify-between w-full text-gray-800 hover:text-white py-4 px-6 hover:bg-accent hover:shadow shadow-accent/50 rounded-xl"
                onClick={() => setShowDropdown(false)}
            >
                <span className="flex items-center gap-3">
                    <Icon className="text-xl" />
                    {label}
                </span>
            </Link>
        </li>
    );

    // const managerMenu = (
    //     <>
    //         {renderLink('/user/business/home', FaChartLine, 'Dashboard')}
    //         {renderLink('/user/business/team-members', FaUserFriends, 'Team Members')}
    //         {renderLink('/user/business/clients', FaUsers, 'Clients')}
    //         {renderLink('/user/business/service-questionnaires', FaListCheck, 'Questionnaires')}
    //         {renderLink('/user/business/quotes', FaFileSignature, 'Quotes')}
    //         {renderLink('/user/business/jobs', FaClipboardCheck, 'Jobs')}
    //         {renderLink('/user/business/payouts', FaCreditCard, 'Payouts')}
    //         {renderLink('/user/business/invoices', FaFileInvoice, 'Invoices')}
    //     </>
    // );

    // const clientMenu = (
    //     <>
    //         {renderLink('/user/business/services', FaCogs, 'Services')}
    //         {renderLink('/user/business/quotes', FaFileSignature, 'Quotes')}
    //         {renderLink('/user/business/jobs', FaClipboardCheck, 'Jobs')}
    //         {renderLink('/user/business/invoices', FaFileInvoice, 'Invoices')}
    //     </>
    // );

    // const employeeMenu = (
    //     <>
    //         {renderLink('/user/business/jobs', FaClipboardCheck, 'Jobs')}
    //         {renderLink('/user/business/team-members', FaUserFriends, 'Team Members')}
    //     </>
    // );

    // const roleMenus = {
    //     MANAGER: managerMenu,
    //     CLIENT: clientMenu,
    //     EMPLOYEE: employeeMenu,
    // };

    const linkClass = (path) => {
        const isActive = location.pathname === path;
        return `hover:text-accent ${isActive ? 'font-bold text-secondary' : ''}`.trim();
    };

    const mobLinkClass = (path) => {
        const isActive = location.pathname === path;
        return (isActive ? 'font-bold bg-secondary text-white px-8 py-5' : '').trim();
    };

    // Prevent immediate re-open after toggle
    const justToggledMegaMenu = useRef(false);
    useEffect(() => {
        // Close dropdown and mega menu when clicking outside
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
            if (megaMenuRef.current && !megaMenuRef.current.contains(event.target)) {
                // Only close if not just toggled
                if (!justToggledMegaMenu.current) {
                    setShowMegaMenu(false);
                }
            }
            justToggledMegaMenu.current = false;
        };
        if (showDropdown || showMegaMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown, showMegaMenu]);

    useEffect(() => {
        if (showDropdown) {
            document.body.classList.add('scroll-disabled');
            return () => document.body.classList.remove('scroll-disabled');
        }

        document.body.classList.remove('scroll-disabled');
        return undefined;
    }, [showDropdown]);

    document.addEventListener('scroll', () => {
        const h = document.getElementById('site-header');
        if (!h) return;
        const atTop = window.scrollY === 0;
        h.classList.toggle('top-0', !atTop);
        h.classList.toggle('top-9', atTop);
        h.classList.toggle('pb-2', !atTop);
        h.classList.toggle('pb-0', atTop);
        h.classList.toggle('md:pb-4', !atTop);
        h.classList.toggle('md:pb-0', atTop);
        h.classList.toggle('shadow', !atTop);
        h.classList.toggle('shadow-none', atTop);
    });

    const megaMenuRef = useRef(null);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    useEffect(() => {
        if (mobileNavOpen) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }
        return () => {
            document.body.classList.remove('overflow-hidden');
        };
    }, [mobileNavOpen]);

    return (
        <>
            <AnnouncementBar />
            <header id='site-header' className='fixed top-9 left-0 z-30 flex items-end md:items-center justify-between bg-background px-6 pt-2 md:pt-4 md:px-16 lg:px-32 w-full transition-[top] duration-150 ease-in-out'>

                {/* Mobile Menu Button */}
                <div className='lg:hidden'>
                    <button
                        className="text-secondary mt-3"
                        onClick={() => setMobileNavOpen(!mobileNavOpen)}
                    >
                        <FaBars className="text-xl" />
                    </button>
                </div>

                {/* Mobile Navigation Menu */}
                {mobileNavOpen && (
                    <div className='fixed inset-0 w-full h-screen bg-black/50' onClick={() => setMobileNavOpen(false)}>
                        <div className='w-4/5 md:w-3/7 h-screen bg-white overflow-y-auto' onClick={e => e.stopPropagation()}>
                            <div className='p-8 inset-0 flex justify-between'>
                                <h3 className='font-heading text-2xl' >Menu</h3>
                            </div>
                            <nav className='flex flex-col items-start justify-start font-medium'>
                                <Link onClick={e => {
                                    e.stopPropagation();
                                    setMobileNavOpen(false);
                                }}
                                    to="/" className={"w-full text-lg text-left px-8 py-5" + mobLinkClass('/')}>Home</Link>
                                {/* Industries Link */}
                                <div
                                    className={"w-full text-lg text-left px-8 py-5 flex items-center justify-between" + mobLinkClass('/industries')}
                                    onClick={e => {
                                        e.stopPropagation();
                                        setShowMobileIndustries(open => !open);
                                    }}
                                >
                                    <span>Industries</span>
                                    {showMobileIndustries ? <FaChevronUp className="ml-2" /> : <FaChevronDown className="ml-2" />}
                                </div>
                                {showMobileIndustries && (
                                    <div className="pl-14 pb-2">
                                        <div className="flex flex-col gap-3 mb-2 text-gray-600">
                                            <span>HVAC</span>
                                            <span>Landscaping</span>
                                            <span>Painting</span>
                                            <span>Residential Cleaning</span>
                                            <span>Plumbing</span>
                                            <span>Lawn Care</span>
                                            <span>Renovations</span>
                                            <span>Janitorial Cleaning</span>
                                            <span>Electrician</span>
                                            <span>Tree Care</span>
                                            <span>Appliance Repair</span>
                                            <span>Pressure Washing</span>
                                            <span>Roofing</span>
                                            <span>Pool Service</span>
                                        </div>
                                        <Link to="/industries" className={"text-secondary font-semibold flex items-center gap-1 hover:underline mb-2"} onClick={() => { setMobileNavOpen(false); setShowMobileIndustries(false); }}>
                                            SEE ALL INDUSTRIES <FaChevronRight className="text-secondary mb-px" />
                                        </Link>
                                    </div>
                                )}
                                <Link to="/" onClick={handlePricingClick} className='w-full text-lg text-left px-8 py-5'>Pricing</Link>
                                <Link onClick={e => {
                                    e.stopPropagation();
                                    setMobileNavOpen(false);
                                }}
                                    to="/faqs" className={"w-full text-lg text-left px-8 py-5" + mobLinkClass('/faqs')}>FAQ's</Link>
                                <Link onClick={e => {
                                    e.stopPropagation();
                                    setMobileNavOpen(false);
                                }}
                                    to="/about" className={"w-full text-lg text-left px-8 py-5" + mobLinkClass('/about')}>About Us</Link>
                                <Link onClick={e => {
                                    e.stopPropagation();
                                    setMobileNavOpen(false);
                                }}
                                    to="/contact" className={"w-full text-lg text-left px-8 py-5" + mobLinkClass('/contact')}>Contact Us</Link>
                            </nav>
                        </div>
                    </div>
                )}

                {/* Logo */}
                <div>
                    <Link to="/">
                        <img src={contractorzLogo} alt="Logo" width={170} height={0} className='w-38 lg:w-44' />
                    </Link>
                </div>

                {/* Navigation Menu */}
                <nav className='hidden lg:flex items-center md:text-lg gap-x-10 lg:mt-2 font-medium'>
                    <Link to="/" className={linkClass('/')}>Home</Link>
                    <div className="relative inline-block">
                        <button
                            className={linkClass('/industries') + ' relative'}
                            type="button"
                            aria-haspopup="true"
                            aria-expanded={showMegaMenu}
                            style={{ background: 'none', border: 'none', padding: 0, margin: 0 }}
                            onClick={e => {
                                e.stopPropagation();
                                justToggledMegaMenu.current = true;
                                setShowMegaMenu(open => !open);
                            }}
                        >
                            Industries
                            {showMegaMenu ? <FaChevronUp className="inline-flex ml-1 text-xs" /> : <FaChevronDown className="inline-flex ml-1 text-xs" />}
                        </button>
                        {/* Mega Menu */}
                        {showMegaMenu && (
                            <div
                                ref={megaMenuRef}
                                className="absolute left-0 top-full min-w-180 max-w-225 bg-white shadow-2xl rounded-xl border border-gray-200 z-40"
                            >
                                <MegaMenu onClose={() => setShowMegaMenu(false)} />
                            </div>
                        )}
                    </div>
                    <Link
                        to="/"
                        onClick={handlePricingClick}
                    >
                        Pricing
                    </Link>
                    <Link to="/faqs" className={linkClass('/faqs')}>FAQ's</Link>
                    <Link to="/about" className={linkClass('/about')}>About Us</Link>
                    <Link to="/contact" className={linkClass('/contact')}>Contact Us</Link>
                </nav>


                {showDropdown && (
                    <div className='absolute top-0 left-0 bg-black/40 w-full h-screen' />
                )}

                {/* Login button and User account dropdown */}
                <div className=" flex items-center gap-3 md:flex">
                    {loading ? (
                        <span className="text-gray-500">Loading...</span>
                    ) : !token || !user ? (
                        <>
                            <Link
                                className="text-2xl md:text-xl md:hidden font-bold"
                                to="/sign-in"
                            >
                                <FiLogIn className="mb-1" />
                            </Link>
                            <Link
                                className="primary hidden md:inline"
                                to="/sign-in"
                            >
                                Login
                            </Link>
                        </>
                    ) : (
                        <div className="relative z-30" ref={menuRef}>
                            <button
                                className="cursor-pointer flex items-center gap-2 rounded-md py-2 text-gray-800 hover:text-accent"
                                type="button"
                                onClick={() => setShowDropdown((open) => !open)}
                                aria-expanded={showDropdown}
                                aria-haspopup="true"
                            >
                                <LuCircleUser className="text-2xl md:text-xl" />
                                <span className="hidden md:block font-bold">{user.name}</span>
                                {showDropdown ? (
                                    <FaChevronUp className="hidden md:block text-xs" />
                                ) : (
                                    <FaChevronDown className="hidden md:block text-xs" />
                                )}
                            </button>

                            {showDropdown && (
                                <div className="absolute z-50 top-4 right-4 lg:right-0 p-4 mt-3 min-w-[70vw] lg:min-w-[20vw] rounded-2xl bg-white shadow-lg">

                                    {/* Profile Section */}
                                    <div className="flex items-center gap-3 mb-6">
                                        {/* Profile avatar */}
                                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                                            {user.profilePic ? (
                                                <img src={user.profilePic} alt="Profile" className="h-full w-full rounded-full object-cover" />
                                            ) : (
                                                <span className="text-xl font-bold text-gray-700">{user.name.charAt(0).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-lg">{user.name}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <ul className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50 p-3 font-medium text-gray-800">
                                            {renderLink('/user/profile', LuUser, 'Profile')}
                                            {(user.role === 'USER' || user.role === 'MANAGER') &&
                                                renderLink('/user/business', LuBuilding2, 'Business')}
                                            {renderLink('/user/banking', LuCreditCard, 'Banking')}
                                            {renderLink('/user/credentials', LuKey, 'Credentials')}
                                        </ul>
                                    </div>

                                    {/* Business Menu */}
                                    {/* {user.role && user.role !== 'USER' && (
                                        <div>
                                            <h5 className="mt-5 mb-2 font-semibold text-accent font-heading">
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
                                    )} */}

                                    <button
                                        onClick={handleLogout}
                                        className="cursor-pointer rounded-xl mt-2 flex items-center justify-center gap-2 w-full px-4 py-2 text-gray-600 hover:text-gray-950 hover:bg-gray-100 transition"
                                    >
                                        <LuLogOut /> Logout Account
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>
        </>
    );
}
