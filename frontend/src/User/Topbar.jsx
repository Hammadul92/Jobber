import { NavLink, Link, useLocation } from 'react-router-dom';
import { Fragment, useMemo, useState } from 'react';
import {
    FaBars,
    FaChartLine,
    FaClipboardCheck,
    FaClipboardList,
    FaCogs,
    FaCreditCard,
    FaFileInvoice,
    FaFileSignature,
    FaUsers,
    FaUserFriends,
} from 'react-icons/fa';
import { IoClose } from "react-icons/io5";

function Topbar({ role, businessName }) {

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const navItems = useMemo(
        () => [
            {
                name: 'Dashboard',
                path: '/dashboard/home',
                icon: FaChartLine,
                is_visible: ['CLIENT', 'MANAGER', 'EMPLOYEE'].includes(role),
            },
            {
                name: 'Team Members',
                path: '/dashboard/team-members',
                icon: FaUserFriends,
                is_visible: role === 'EMPLOYEE' || role === 'MANAGER',
            },
            { name: 'Clients', path: '/dashboard/clients', icon: FaUsers, is_visible: role === 'MANAGER' },
            {
                name: 'Services',
                path: '/dashboard/services',
                icon: FaCogs,
                is_visible: role === 'CLIENT',
            },
            {
                name: 'Questionnaires',
                path: '/dashboard/service-questionnaires',
                icon: FaClipboardList,
                is_visible: role === 'MANAGER',
            },
            {
                name: 'Quotes',
                path: '/dashboard/quotes',
                icon: FaFileSignature,
                is_visible: role === 'CLIENT' || role === 'MANAGER',
            },
            {
                name: 'Jobs',
                path: '/dashboard/jobs',
                icon: FaClipboardCheck,
                is_visible: ['CLIENT', 'MANAGER', 'EMPLOYEE'].includes(role),
            },
            { name: 'Payouts', path: '/dashboard/payouts', icon: FaCreditCard, is_visible: role === 'MANAGER' },
            {
                name: 'Invoices',
                path: '/dashboard/invoices',
                icon: FaFileInvoice,
                is_visible: role === 'CLIENT' || role === 'MANAGER',
            },
        ],
        [role]
    );

    const segmentLabels = {
        dashboard: 'Dashboard',
        home: 'Home',
        'team-members': 'Team Members',
        clients: 'Clients',
        services: 'Services',
        'service-questionnaires': 'Questionnaires',
        quotes: 'Quotes',
        jobs: 'Jobs',
        payouts: 'Payouts',
        invoices: 'Invoices',
        settings: 'Settings',
    };

    const toTitle = (segment) =>
        segment
            .split('-')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');

    const breadcrumbItems = useMemo(() => {
        const businessLabel = businessName || 'Dashboard';
        const segments = location.pathname.split('/').filter(Boolean);
        const items = [
            { label: 'Contractorz', to: '/' },
            { label: businessLabel, to: '/dashboard/home' },
        ];

        if (segments[0] !== 'dashboard') return items;

        let path = '/dashboard';
        for (let i = 1; i < segments.length; i += 1) {
            path += `/${segments[i]}`;
            const rawLabel = segmentLabels[segments[i]] || toTitle(decodeURIComponent(segments[i]));
            const isLast = i === segments.length - 1;
            items.push({ label: rawLabel, to: isLast ? undefined : path });
        }

        return items;
    }, [location.pathname, businessName]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleMobileMenu = () => setIsMenuOpen((prev) => !prev);
    const closeMobileMenu = () => setIsMenuOpen(false);

    return (
        <div className="fixed inset-x-0 top-0 bg-secondary text-white shadow-md py-4 px-6 flex items-center justify-start md:hidden">
            <button onClick={toggleMobileMenu} aria-expanded={isMenuOpen} aria-controls="mobile-nav">
                <FaBars size={20} />
            </button>
            <nav aria-label="breadcrumb-mobile" className="ml-6">
                <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-300">
                    {breadcrumbItems.map((crumb, idx) => (
                        <Fragment key={`${crumb.label}-${idx}`}>
                            <li>
                                {crumb.to ? (
                                    <Link
                                        to={crumb.to}
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
            </nav>

            {/* Backdrop allows tap-to-close on mobile */}
            <div
                className={`fixed inset-0 bg-black/40 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={closeMobileMenu}
            />

            <nav
                id="mobile-nav"
                className={`absolute top-0 left-0 flex h-screen flex-col gap-5 border-r border-accent/10 bg-secondary px-3 py-4 text-white transition-transform duration-300 ease-out shrink-0 w-3/5 min-w-[16rem] ${isMenuOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'}`}
                aria-hidden={!isMenuOpen}
            >
                <button
                    className="mr-auto flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white text-black cursor-pointer shadow-sm transition hover:bg-white/60"
                    onClick={closeMobileMenu}
                    aria-label="Toggle navigation"
                    type="button"
                >
                    <IoClose />
                </button>

                <ul className="flex flex-1 flex-col gap-1">
                    {navItems.map(
                        (item) =>
                            item.is_visible && (
                                <li key={item.path}>
                                    <NavLink
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${isActive
                                                ? 'bg-accent text-secondary shadow-md'
                                                : 'text-white/85 hover:bg-white/20 hover:text-white'
                                            }`
                                        }
                                        title={item.name}
                                    >
                                        <span
                                            className={`flex h-8 w-8 items-center justify-center rounded-lg text-base`}
                                        >
                                            <item.icon className='h-4 w-4' />
                                        </span>
                                        <span className="truncate">{item.name}</span>
                                    </NavLink>
                                </li>
                            )
                    )}
                </ul>
            </nav>

        </div>
    )
}

export default Topbar