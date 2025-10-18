import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    useFetchUserQuery,
    useLogoutUserMutation,
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
    const [isOpen, setIsOpen] = useState(false); // mobile menu
    const [dropdownOpen, setDropdownOpen] = useState(false); // user dropdown
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const token = localStorage.getItem('token');
    const { data: user, isFetching } = useFetchUserQuery(undefined, { skip: !token });
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
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
            setSearchTerm('');
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className="navbar navbar-expand-lg fixed-top bg-white py-1 shadow-sm">
            <div className="container-fluid">
                <Link to="/" className="navbar-brand d-flex align-items-center gap-2">
                    <img src={logo} alt="logo" height="44" />
                </Link>

                <button className="navbar-toggler border-0" type="button" onClick={() => setIsOpen(!isOpen)}>
                    <i className="fa fa-bars fs-4"></i>
                </button>

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
                        {token && (
                            <li className="nav-item">
                                <button
                                    className="btn position-relative border-0"
                                    onClick={() => navigate('/dashboard/cart')}
                                >
                                    <i className="fa fa-shopping-cart fs-4 text-success"></i>
                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                        3
                                    </span>
                                </button>
                            </li>
                        )}

                        {isFetching ? (
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
                            <li className="nav-item dropdown" ref={dropdownRef}>
                                <button
                                    className="btn d-flex align-items-center gap-2 border-0"
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                >
                                    <i className="far fa-user-circle fs-4 text-success"></i>
                                    <span className="fw-medium">{user.name}</span>
                                    <i className={`fa fa-chevron-${dropdownOpen ? 'up' : 'down'}`}></i>
                                </button>

                                {dropdownOpen && (
                                    <ul className="dropdown-menu show position-absolute end-0 shadow-sm border-0">
                                        <li>
                                            <Link
                                                className="dropdown-item"
                                                to="/dashboard/home"
                                                onClick={() => setDropdownOpen(false)}
                                            >
                                                Dashboard
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                className="dropdown-item"
                                                to="/user-account"
                                                onClick={() => setDropdownOpen(false)}
                                            >
                                                My Account
                                            </Link>
                                        </li>
                                        <li>
                                            <hr className="dropdown-divider" />
                                        </li>
                                        <li>
                                            <button
                                                onClick={() => {
                                                    handleLogout();
                                                    setDropdownOpen(false);
                                                }}
                                                className="dropdown-item text-danger"
                                            >
                                                <i className="fa fa-power-off me-2"></i> Logout
                                            </button>
                                        </li>
                                    </ul>
                                )}
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
}
