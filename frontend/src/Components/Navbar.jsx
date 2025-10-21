import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
} from '../store';
import { useDispatch } from 'react-redux';
import './Components.css';
import logo from './images/logo.png';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [showOffcanvas, setShowOffcanvas] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const token = localStorage.getItem('token');

    const { data: user, isFetching: isFetchingUser } = useFetchUserQuery(undefined, { skip: !token });
    const { data: businesses, isFetching: isFetchingBusiness } = useFetchBusinessesQuery(undefined, { skip: !token });
    const [logoutUser] = useLogoutUserMutation();

    const handleLogout = async () => {
        await logoutUser();
        dispatch(userApi.util.resetApiState());
        dispatch(businessApi.util.resetApiState());
        dispatch(clientApi.util.resetApiState());
        dispatch(serviceQuestionnaireApi.util.resetApiState());
        dispatch(teamMemberApi.util.resetApiState());
        dispatch(serviceApi.util.resetApiState());
        dispatch(quoteApi.util.resetApiState());
        dispatch(jobApi.util.resetApiState());
        navigate('/sign-in');
        setShowOffcanvas(false);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
            setSearchTerm('');
        }
    };

    const business = businesses && businesses.length > 0 ? businesses[0] : null;

    return (
        <>
            <nav className="navbar navbar-expand-lg fixed-top bg-white py-1 shadow-sm">
                <div className="container-fluid">
                    {/* Brand / Logo */}
                    <Link to="/" className="navbar-brand d-flex align-items-center gap-2">
                        <img src={logo} alt="logo" height="44" />
                    </Link>

                    {/* Mobile Menu Toggle */}
                    <button className="navbar-toggler border-0" type="button" onClick={() => setIsOpen(!isOpen)}>
                        <i className="fa fa-bars fs-4"></i>
                    </button>

                    {/* Navbar Content */}
                    <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`}>
                        <form
                            className="d-flex mx-auto my-2 flex-grow-1"
                            style={{ maxWidth: '500px' }}
                            onSubmit={handleSearch}
                        >
                            <input
                                type="search"
                                className="form-control"
                                placeholder="Search ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </form>

                        <ul className="navbar-nav ms-auto align-items-center gap-2">
                            {isFetchingUser || isFetchingBusiness ? (
                                <li className="nav-item">
                                    <span className="nav-link disabled">Loading...</span>
                                </li>
                            ) : !token || !user ? (
                                <>
                                    <li className="nav-item">
                                        <Link className="btn btn-outline-success btn-sm px-3" to="/register">
                                            Register
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className="btn btn-success btn-sm px-3" to="/sign-in">
                                            Sign In
                                        </Link>
                                    </li>
                                </>
                            ) : (
                                <li className="nav-item">
                                    {/* React-controlled offcanvas trigger */}
                                    <button
                                        className="btn d-flex align-items-center gap-2 border-0"
                                        type="button"
                                        onClick={() => setShowOffcanvas(true)}
                                    >
                                        <i className="far fa-user-circle fs-4 text-success"></i>
                                        <span className="fw-medium">{user.name}</span>
                                    </button>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </nav>

            {showOffcanvas && (
                <>
                    <div className="offcanvas-backdrop fade show" onClick={() => setShowOffcanvas(false)}></div>

                    <div
                        className={`offcanvas offcanvas-end show`}
                        style={{
                            visibility: 'visible',
                            transform: 'translateX(0)',
                        }}
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
                                <li className="list-group-item">
                                    <Link
                                        to="/user-account/profile"
                                        className="text-decoration-none text-success d-flex justify-content-between align-items-center"
                                        onClick={() => setShowOffcanvas(false)}
                                    >
                                        <span>
                                            <i className="fas fa-user me-2"></i>
                                            Profile
                                        </span>
                                        <i className="fa fa-arrow-right"></i>
                                    </Link>
                                </li>

                                <li className="list-group-item">
                                    <Link
                                        to="/user-account/business"
                                        className="text-decoration-none text-success d-flex justify-content-between align-items-center"
                                        onClick={() => setShowOffcanvas(false)}
                                    >
                                        <span>
                                            <i className="fa fa-briefcase me-2"></i>
                                            Business
                                        </span>
                                        <i className="fa fa-arrow-right"></i>
                                    </Link>
                                </li>

                                <li className="list-group-item">
                                    <Link
                                        to="/user-account/banking"
                                        className="text-decoration-none text-success d-flex justify-content-between align-items-center"
                                        onClick={() => setShowOffcanvas(false)}
                                    >
                                        <span>
                                            <i className="fa fa-building-columns me-2"></i>
                                            Banking
                                        </span>
                                        <i className="fa fa-arrow-right"></i>
                                    </Link>
                                </li>

                                <li className="list-group-item">
                                    <Link
                                        to="/user-account/credentials"
                                        className="text-decoration-none text-success d-flex justify-content-between align-items-center"
                                        onClick={() => setShowOffcanvas(false)}
                                    >
                                        <span>
                                            <i className="fa fa-key me-2"></i>
                                            Credentials
                                        </span>
                                        <i className="fa fa-arrow-right"></i>
                                    </Link>
                                </li>
                            </ul>

                            {business && <h5 className="fw-bold">{business.name || 'Client Portal'}</h5>}
                            <ul className="list-group">
                                {business && (
                                    <li className="list-group-item">
                                        <Link
                                            to="/dashboard/home"
                                            className="text-decoration-none text-success d-flex justify-content-between align-items-center"
                                            onClick={() => setShowOffcanvas(false)}
                                        >
                                            <span>
                                                <i className="fas fa-chart-line me-2"></i>
                                                Dashboard
                                            </span>
                                            <i className="fa fa-arrow-right"></i>
                                        </Link>
                                    </li>
                                )}

                                <li className="list-group-item">
                                    <Link
                                        to="/dashboard/clients"
                                        className="text-decoration-none text-success d-flex justify-content-between align-items-center"
                                        onClick={() => setShowOffcanvas(false)}
                                    >
                                        <span>
                                            <i className="fas fa-users me-2"></i>
                                            Clients
                                        </span>
                                        <i className="fa fa-arrow-right"></i>
                                    </Link>
                                </li>

                                <li className="list-group-item">
                                    <Link
                                        to="/dashboard/service-questionnaires"
                                        className="text-decoration-none text-success d-flex justify-content-between align-items-center"
                                        onClick={() => setShowOffcanvas(false)}
                                    >
                                        <span>
                                            <i className="fas fa-list-check me-2"></i>
                                            Questionnaires
                                        </span>
                                        <i className="fa fa-arrow-right"></i>
                                    </Link>
                                </li>

                                <li className="list-group-item">
                                    <Link
                                        to="/dashboard/quotes"
                                        className="text-decoration-none text-success d-flex justify-content-between align-items-center"
                                        onClick={() => setShowOffcanvas(false)}
                                    >
                                        <span>
                                            <i className="fas fa-file-signature me-2"></i>
                                            Quotes
                                        </span>
                                        <i className="fa fa-arrow-right"></i>
                                    </Link>
                                </li>

                                <li className="list-group-item">
                                    <Link
                                        to="/dashboard/jobs"
                                        className="text-decoration-none text-success d-flex justify-content-between align-items-center"
                                        onClick={() => setShowOffcanvas(false)}
                                    >
                                        <span>
                                            <i className="fas fa-clipboard-check me-2"></i>
                                            Jobs
                                        </span>
                                        <i className="fa fa-arrow-right"></i>
                                    </Link>
                                </li>

                                <li className="list-group-item">
                                    <Link
                                        to="/dashboard/invoices"
                                        className="text-decoration-none text-success d-flex justify-content-between align-items-center"
                                        onClick={() => setShowOffcanvas(false)}
                                    >
                                        <span>
                                            <i className="fas fa-file-invoice me-2"></i>
                                            Invoices
                                        </span>
                                        <i className="fa fa-arrow-right"></i>
                                    </Link>
                                </li>

                                <li className="list-group-item">
                                    <Link
                                        to="/dashboard/payouts"
                                        className="text-decoration-none text-success d-flex justify-content-between align-items-center"
                                        onClick={() => setShowOffcanvas(false)}
                                    >
                                        <span>
                                            <i className="fas fa-credit-card me-2"></i>
                                            Payouts
                                        </span>
                                        <i className="fa fa-arrow-right"></i>
                                    </Link>
                                </li>

                                <li className="list-group-item">
                                    <Link
                                        to="/dashboard/team-members"
                                        className="text-decoration-none text-success d-flex justify-content-between align-items-center"
                                        onClick={() => setShowOffcanvas(false)}
                                    >
                                        <span>
                                            <i className="fas fa-user-friends me-2"></i>
                                            Team Members
                                        </span>
                                        <i className="fa fa-arrow-right"></i>
                                    </Link>
                                </li>
                            </ul>

                            <button onClick={handleLogout} className="btn btn-danger bg-gradient mt-4">
                                <i className="fa fa-power-off me-2"></i> Logout
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
