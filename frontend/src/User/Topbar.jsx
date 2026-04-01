import { NavLink, Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
    FaBars,
} from 'react-icons/fa';
import {
    LuUser,
    LuLogOut,
    LuReceipt,
    LuBriefcase,
    LuArrowUpRight,
    LuFileText,
    LuUsers,
    LuCircleUser,
    LuClipboardList,
    LuBuilding2,
    LuCreditCard,
    LuKey,
} from 'react-icons/lu';
import { RiDashboardLine } from 'react-icons/ri';
import { IoClose } from "react-icons/io5";

function Topbar({ role, businessName, user }) {

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    // const location = useLocation();

    const logo = '/images/contractorz-logo-horizontal.svg'; 

    const navItems = useMemo(
        () => [
            {
                name: 'Dashboard',
                path: '/user/business/home',
                icon: RiDashboardLine,
                is_visible: ['CLIENT', 'MANAGER', 'EMPLOYEE'].includes(role),
            },
            {
                name: 'Team Members',
                path: '/user/business/team-members',
                icon: LuUsers,
                is_visible: role === 'EMPLOYEE' || role === 'MANAGER',
            },
            { name: 'Clients', path: '/user/business/clients', icon: LuCircleUser, is_visible: role === 'MANAGER' },
            {
                name: 'Services',
                path: '/user/business/services',
                icon: LuFileText,
                is_visible: role === 'CLIENT',
            },
            {
                name: 'Questionnaires',
                path: '/user/business/service-questionnaires',
                icon: LuClipboardList,
                is_visible: role === 'MANAGER',
            },
            {
                name: 'Quotes',
                path: '/user/business/quotes',
                icon: LuFileText,
                is_visible: role === 'CLIENT' || role === 'MANAGER',
            },
            {
                name: 'Jobs',
                path: '/user/business/jobs',
                icon: LuBriefcase,
                is_visible: ['CLIENT', 'MANAGER', 'EMPLOYEE'].includes(role),
            },
            { name: 'Payouts', path: '/user/business/payouts', icon: LuArrowUpRight, is_visible: role === 'MANAGER' },
            {
                name: 'Invoices',
                path: '/user/business/invoices',
                icon: LuReceipt,
                is_visible: role === 'CLIENT' || role === 'MANAGER',
            },
        ],
        [role]
    );

    const accountMenu = useMemo(
        () => [
            { key: 'profile', label: 'Profile', icon: LuUser, path: '/user/profile', visible: true },
            {
                key: 'business',
                label: 'Business',
                icon: LuBuilding2,
                path: '/user/business',
                visible: role === 'USER' || role === 'MANAGER',
            },
            { key: 'banking', label: 'Banking', icon: LuCreditCard, path: '/user/banking', visible: true },
            { key: 'credentials', label: 'Credentials', icon: LuKey, path: '/user/credentials', visible: true },
        ],
        [role]
    );

    const displayName =
        user?.name ||
        user?.full_name ||
        [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
        'User';
    const displayEmail = user?.email || '';

    // const segmentLabels = {
    //     dashboard: 'Dashboard',
    //     home: 'Home',
    //     'team-members': 'Team Members',
    //     clients: 'Clients',
    //     services: 'Services',
    //     'service-questionnaires': 'Questionnaires',
    //     quotes: 'Quotes',
    //     jobs: 'Jobs',
    //     payouts: 'Payouts',
    //     invoices: 'Invoices',
    //     settings: 'Settings',
    // };

    // const toTitle = (segment) =>
    //     segment
    //         .split('-')
    //         .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    //         .join(' ');

    // const breadcrumbItems = useMemo(() => {
    //     const businessLabel = businessName || 'Dashboard';
    //     const segments = location.pathname.split('/').filter(Boolean);
    //     const items = [
    //         { label: 'Contractorz', to: '/' },
    //         { label: businessLabel, to: '/user/business/home' },
    //     ];

    //     if (segments[0] !== 'dashboard') return items;

    //     let path = '/dashboard';
    //     for (let i = 1; i < segments.length; i += 1) {
    //         path += `/${segments[i]}`;
    //         const rawLabel = segmentLabels[segments[i]] || toTitle(decodeURIComponent(segments[i]));
    //         const isLast = i === segments.length - 1;
    //         items.push({ label: rawLabel, to: isLast ? undefined : path });
    //     }

    //     return items;
    // }, [location.pathname, businessName]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleMobileMenu = () => setIsMenuOpen((prev) => !prev);
    const closeMobileMenu = () => setIsMenuOpen(false);

    return (
        <div className="fixed z-20 inset-x-0 top-0 bg-background text-secondary shadow-sm p-4 md:px-12 flex items-end justify-between lg:hidden">
            <button onClick={toggleMobileMenu} aria-expanded={isMenuOpen} aria-controls="mobile-nav">
                <FaBars className="text-[20px] md:text-[28px]" />
            </button>
            {/* <nav aria-label="breadcrumb-mobile" className="ml-6">
                <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-300">
                    {breadcrumbItems.map((crumb, idx) => (
                        <Fragment key={`${crumb.label}-${idx}`}>
                            <li>
                                {crumb.to ? (
                                    <Link
                                        to={crumb.to}
                                        onClick={closeMobileMenu}
                                        className={`font-semibold ${idx === 1 || idx === breadcrumbItems.length - 1 ? 'text-white' : 'text-accent hover:text-accentLight'}`}
                                    >
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className="font-semibold text-gray-300">{crumb.label}</span>
                                )}
                            </li>
                            {idx < breadcrumbItems.length - 1 && <li className="text-gray-300">/</li>}
                        </Fragment>
                    ))}
                </ol>
            </nav> */}
            {/* Logo */}
            <div className='mr-6'>
                <Link to="/">
                    <img src={logo} alt="Contractorz" className='w-30 md:w-36' />
                </Link>
            </div>
            {/* Empty placeholder */}
            <div></div>

            {/* Backdrop allows tap-to-close on mobile */}
            <div
                className={`fixed inset-0 bg-black/40 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={closeMobileMenu}
            />

            <nav
                id="mobile-nav"
                className={`absolute top-0 left-0 h-screen w-4/5 md:w-2/5 max-w-sm p-2 transition-transform duration-300 ease-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'}`}
                aria-hidden={!isMenuOpen}
            >
                <div className="bg-white h-full flex flex-col shadow-md rounded-2xl p-3 overflow-y-auto overscroll-contain">
                    <button
                        className="mr-auto mb-6 flex h-10 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-black cursor-pointer shadow-sm transition hover:bg-gray-100"
                        onClick={closeMobileMenu}
                        aria-label="Close navigation"
                        type="button"
                    >
                        <IoClose className="h-8 w-6" />
                    </button>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                            {user?.profile_picture ? (
                                <img src={user.profile_picture} alt="Profile" className="h-full w-full rounded-full object-cover" />
                            ) : (
                                <span className="text-gray-500 text-lg font-bold">{displayName.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        <div>
                            <div className="font-semibold text-black text-lg leading-tight">{displayName}</div>
                            <div className="text-sm text-gray-500">{displayEmail}</div>
                        </div>
                    </div>

                    <nav className="mb-4 space-y-1 bg-gray-50 border border-gray-100 p-1 rounded-xl">
                        {accountMenu.filter((item) => item.visible).map((item) => (
                            <NavLink
                                key={item.key}
                                to={item.path}
                                onClick={closeMobileMenu}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-xl px-3 py-2 font-medium transition ${isActive
                                        ? 'bg-accent text-white font-bold shadow-lg shadow-accent/50'
                                        : 'text-gray-500 hover:bg-secondary hover:text-white font-medium'
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {role && role !== 'USER' && (
                        <>
                            <div className="mt-2 text-[0.7rem] text-gray-400 font-semibold">WORKSPACE</div>
                            <div className="mb-4 font-bold text-lg text-gray-900">{businessName || 'Dashboard'}</div>
                        </>
                    )}

                    <ul className="flex flex-1 flex-col gap-1 rounded-xl">
                        {navItems.map((item) =>
                            item.is_visible ? (
                                <li key={item.path}>
                                    <NavLink
                                        to={item.path}
                                        onClick={closeMobileMenu}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 rounded-xl px-3 py-2 font-medium transition ${isActive
                                                ? 'bg-gray-100 text-black font-bold'
                                                : 'text-gray-500 hover:bg-gray-100 hover:text-black font-medium'
                                            }`
                                        }
                                        title={item.name}
                                    >
                                        <item.icon className='h-5 w-5' />
                                        <span>{item.name}</span>
                                    </NavLink>
                                </li>
                            ) : null
                        )}
                    </ul>

                    <div className="mt-auto  pt-6 px-3">
                        <button
                            onClick={closeMobileMenu}
                            className="p-3 flex items-center gap-2 text-gray-500 bg-gray-100 border border-gray-200 w-full text-sm font-medium rounded-xl"
                            type="button"
                        >
                            <LuLogOut className="w-5 h-5" />
                            Logout Account
                        </button>
                    </div>
                </div>
            </nav>

        </div>
    )
}

export default Topbar