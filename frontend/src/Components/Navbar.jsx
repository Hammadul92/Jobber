import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFetchUserQuery, useLogoutUserMutation, userApi } from '../store';
import { useDispatch } from 'react-redux';
import './Components.css';
import logo from './images/logo.png';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const token = localStorage.getItem('token');
    console.log(token);
    const { data: user, isFetching } = useFetchUserQuery(undefined, {
        skip: !token,
    });

    const [logoutUser] = useLogoutUserMutation();

    const handleLogout = async () => {
        await logoutUser();
        dispatch(userApi.util.resetApiState());
        navigate('/sign-in');
    };

    return (
        <nav className="navbar navbar-expand-lg fixed-top shadow-sm bg-white px-2 py-0">
            <div className="container-fluid">
                {/* Brand */}
                <Link to="/" className="navbar-brand">
                    <img src={logo} alt="logo" width={114} />
                </Link>

                {/* Toggler button */}
                <button className="navbar-toggler" type="button" onClick={() => setIsOpen(!isOpen)}>
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* Collapse */}
                <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`}>
                    <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                        {isFetching ? (
                            // 🔄 Show nothing or a spinner while loading user data
                            <li className="nav-item">
                                <span className="nav-link disabled">Loading...</span>
                            </li>
                        ) : !token || !user ? (
                            // 🔑 Show Register / Sign In only if token missing or user is null
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/register">
                                        Register
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/sign-in">
                                        Sign In
                                    </Link>
                                </li>
                            </>
                        ) : (
                            // 👋 Show welcome message if user is loaded
                            <>
                                <li className="nav-item">
                                    <Link to="/dashboard/home" className="nav-link">
                                        <i className="fa fa-user"></i> Welcome, {user.name}
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <button onClick={handleLogout} className="nav-link btn btn-link">
                                        <i className="fa fa-power-off"></i> Logout
                                    </button>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
}
