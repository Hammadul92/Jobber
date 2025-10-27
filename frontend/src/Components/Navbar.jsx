import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
} from '../store';
import './Components.css';
import logo from './images/logo.png';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [showOffcanvas, setShowOffcanvas] = useState(false);
    const navigate = useNavigate();
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
        ].forEach((api) => dispatch(api.util.resetApiState()));

        localStorage.removeItem('token');
        navigate('/sign-in');
        setShowOffcanvas(false);
    };

    const business = businesses?.[0] ?? null;
    const loading = isFetchingUser || isFetchingBusiness;

    const renderLink = (to, icon, label) => (
        <li className="list-group-item">
            <Link
                to={to}
                className="text-decoration-none text-dark d-flex justify-content-between align-items-center"
                onClick={() => setShowOffcanvas(false)}
            >
                <span>
                    <i className={`${icon} me-2`}></i>
                    {label}
                </span>
                <i className="fa fa-arrow-right"></i>
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
            {/* Spacer for fixed navbar */}
            <div style={{ height: 63 }}></div>

            <nav className="navbar navbar-expand-lg fixed-top bg-white py-1 shadow-sm">
                <div className="container">
                    <Link to="/" className="navbar-brand d-flex align-items-center">
                        <img src={logo} alt="logo" height="44" />
                    </Link>

                    <button className="navbar-toggler border-0" type="button" onClick={() => setIsOpen(!isOpen)}>
                        <i className="fa fa-bars fs-4"></i>
                    </button>

                    <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`}>
                        <ul className="navbar-nav ms-auto align-items-center gap-2">
                            {loading ? (
                                <li className="nav-item">
                                    <span className="nav-link disabled">Loading...</span>
                                </li>
                            ) : !token || !user ? (
                                <>
                                    <li className="nav-item">
                                        <Link className="btn btn-outline-success" to="/register">
                                            Start Free Trial
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className="btn btn-success" to="/sign-in">
                                            Sign In
                                        </Link>
                                    </li>
                                </>
                            ) : (
                                <li className="nav-item">
                                    <button
                                        className="btn d-flex align-items-center gap-2 border-0"
                                        type="button"
                                        onClick={() => setShowOffcanvas(true)}
                                    >
                                        <i className="far fa-user-circle fs-4"></i>
                                        <span className="fw-medium">{user.name}</span>
                                    </button>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </nav>

            {/* Offcanvas */}
            {showOffcanvas && (
                <>
                    <div className="offcanvas-backdrop fade show" onClick={() => setShowOffcanvas(false)}></div>

                    <div
                        className="offcanvas offcanvas-end show"
                        style={{ visibility: 'visible', transform: 'translateX(0)' }}
                    >
                        <div className="offcanvas-header bg-success bg-gradient text-white">
                            <h5 className="offcanvas-title">
                                <i className="far fa-user-circle me-2"></i>
                                {user?.name}
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => setShowOffcanvas(false)}
                            ></button>
                        </div>

                        <div className="offcanvas-body">
                            <h5 className="fw-bold">My Account</h5>
                            <ul className="list-group mb-4">
                                {renderLink('/user-account/profile', 'fas fa-user', 'Profile')}
                                {(user.role === 'USER' || user.role === 'MANAGER') &&
                                    renderLink('/user-account/business', 'fa fa-briefcase', 'Business')}
                                {renderLink('/user-account/banking', 'fa fa-building-columns', 'Banking')}
                                {renderLink('/user-account/credentials', 'fa fa-key', 'Credentials')}
                            </ul>

                            {user.role && user.role !== 'USER' && (
                                <>
                                    <h5 className="fw-bold">
                                        {user.role === 'MANAGER'
                                            ? business?.name
                                            : user.role === 'CLIENT'
                                              ? 'Client Portal'
                                              : 'Employee Portal'}
                                    </h5>
                                    <ul className="list-group mb-3">{roleMenus[user.role]}</ul>
                                </>
                            )}

                            <button onClick={handleLogout} className="btn btn-danger bg-gradient w-100">
                                <i className="fa fa-power-off me-2"></i> Logout
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
