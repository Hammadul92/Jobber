import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store';
import './Components.css';
import logo from './images/logo.png';

export default function Navbar() {
    const dispatch = useDispatch();
    const [isOpen, setIsOpen] = useState(false);
    const user = useSelector((state) => state.user);

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
                        {!user.name ? (
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
                            <>
                                <li className="nav-item">
                                    <Link to="/dashboard/home" className="nav-link">
                                        <i className="fa fa-user"></i> Welcome, {user.name}
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <button onClick={() => dispatch(logout())} className="nav-link">
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
