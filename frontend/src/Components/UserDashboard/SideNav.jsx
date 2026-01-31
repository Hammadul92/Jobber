import { NavLink } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
    FaAngleLeft,
    FaAngleRight,
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

export default function SideNav({ role }) {
    const [collapsed, setCollapsed] = useState(false);

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

    const showLabels = !collapsed;

    return (
        <nav
            className={`hidden md:flex h-screen flex-col gap-5 border-r border-accent/10 bg-secondary px-3 py-4 text-white transition-all duration-200 shrink-0 ${
                collapsed ? 'w-16 min-w-16' : 'w-64 min-w-[16rem]'
            }`}
        >
            <button
                className="mr-auto flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white text-black cursor-pointer shadow-sm transition hover:bg-white/60"
                onClick={() => setCollapsed(!collapsed)}
                aria-label="Toggle navigation"
                type="button"
            >
                {collapsed ? <FaAngleRight /> : <FaAngleLeft />}
            </button>

            <ul className="flex flex-1 flex-col gap-1">
                {navItems.map(
                    (item) =>
                        item.is_visible && (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                                            isActive
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
                                    {showLabels && <span className="truncate">{item.name}</span>}
                                </NavLink>
                            </li>
                        )
                )}
            </ul>
        </nav>
    );
}
