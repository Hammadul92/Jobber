import { NavLink } from 'react-router-dom';
import { useState } from 'react';

export default function SideNav({ role, userId }) {
    const [collapsed, setCollapsed] = useState(false);

    const navItems = [
        { name: 'Dashboard', path: '/dashboard/home', icon: 'fa-chart-line', is_visible: role === 'MANAGER' },
        {
            name: 'Team Members',
            path: '/dashboard/team-members',
            icon: 'fa-user-friends',
            is_visible: role === 'EMPLOYEE' || role === 'MANAGER',
        },
        { name: 'Clients', path: '/dashboard/clients', icon: 'fa-users', is_visible: role === 'MANAGER' },
        {
            name: 'Services',
            path: '/dashboard/services',
            icon: 'fa-cogs',
            is_visible: role === 'CLIENT',
        },
        {
            name: 'Questionnaires',
            path: '/dashboard/service-questionnaires',
            icon: 'fa-list-check',
            is_visible: role === 'MANAGER',
        },
        {
            name: 'Quotes',
            path: '/dashboard/quotes',
            icon: 'fa-file-signature',
            is_visible: role === 'CLIENT' || role === 'MANAGER',
        },
        {
            name: 'Jobs',
            path: '/dashboard/jobs',
            icon: 'fa-clipboard-check',
            is_visible: ['CLIENT', 'MANAGER', 'EMPLOYEE'].includes(role),
        },
        { name: 'Payouts', path: '/dashboard/payouts', icon: 'fa-credit-card', is_visible: role === 'MANAGER' },
        {
            name: 'Invoices',
            path: '/dashboard/invoices',
            icon: 'fa-file-invoice',
            is_visible: role === 'CLIENT' || role === 'MANAGER',
        },
    ];

    return (
        <nav className={`side-nav py-2 px-3 ${collapsed ? 'collapsed' : ''}`}>
            <button className="btn btn-sm collapse-handle" onClick={() => setCollapsed(!collapsed)}>
                {collapsed ? <i className="fa fa-angle-left"></i> : <i className="fa fa-angle-right"></i>}
            </button>
            <ul className="nav flex-column">
                {navItems.map(
                    (item) =>
                        item.is_visible && (
                            <li className="nav-item mb-2" key={item.path}>
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `nav-link d-flex align-items-center ${isActive ? 'active' : ''}`
                                    }
                                    title={item.name}
                                >
                                    <i className={`fas ${item.icon} nav-icon`}></i>
                                    {collapsed ? <span style={{ fontSize: '13px' }}>{item.name}</span> : null}
                                </NavLink>
                            </li>
                        )
                )}
            </ul>
        </nav>
    );
}
