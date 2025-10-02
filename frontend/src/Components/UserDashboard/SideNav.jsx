import { NavLink } from 'react-router-dom';
import { useState } from 'react';

export default function SideNav() {
    const [collapsed, setCollapsed] = useState(false);

    const navItems = [
        { name: 'Dashboard', path: '/dashboard/home', icon: 'fa-chart-line' },
        { name: 'Clients', path: '/dashboard/clients', icon: 'fa-users' },
        {
            name: 'Quotes',
            path: '/dashboard/quotes',
            icon: 'fa-file-signature',
        },
        { name: 'Jobs', path: '/dashboard/jobs', icon: 'fa-clipboard-check' },
        {
            name: 'Invoices',
            path: '/dashboard/invoices',
            icon: 'fa-file-invoice',
        },
        { name: 'Payouts', path: '/dashboard/payouts', icon: 'fa-credit-card' },
        { name: 'Team Members', path: '/dashboard/team-members', icon: 'fa-user-friends' },
        { name: 'Settings', path: '/dashboard/settings', icon: 'fa-cog' },
    ];

    return (
        <nav className={`side-nav py-2 px-3 ${collapsed ? 'collapsed' : ''}`}>
            <button className="btn btn-sm collapse-handle" onClick={() => setCollapsed(!collapsed)}>
                {collapsed ? <i className="fa fa-angle-left"></i> : <i className="fa fa-angle-right"></i>}
            </button>
            <ul className="nav flex-column">
                {navItems.map((item) => (
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
                ))}
            </ul>
        </nav>
    );
}
