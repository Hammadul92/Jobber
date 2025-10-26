import { useEffect } from 'react';
import { useFetchUserQuery } from './store';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

import Navbar from './Components/Navbar';
import Footer from './Components/Footer';
import PageNotFound from './Components/PageNotFound';
import Home from './Components/Home';

import SignIn from './Components/Forms/SignIn';
import Register from './Components/Forms/Register';
import ForgotPassword from './Components/Forms/ForgotPassword';
import ResetPassword from './Components/Forms/ResetPassword';
import UserAccount from './Components/UserAccount';
import UserDashboard from './Components/UserDashboard';

function App() {
    return (
        <Router>
            <MainApp />
        </Router>
    );
}

function MainApp() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const { data: user, isFetching, isError, error } = useFetchUserQuery(undefined, { skip: !token });

    useEffect(() => {
        const currentPath = window.location.pathname + window.location.search;
        const isPublicPage = ['/', '/sign-in', '/register', '/forgot-password', '/reset-password'].some((path) =>
            window.location.pathname.startsWith(path)
        );

        if ((!token || (isError && error?.status === 401)) && !isPublicPage) {
            navigate(`/sign-in?next=${encodeURIComponent(currentPath)}`, { replace: true });
        }
    }, [token, isError, error, navigate]);

    if (isFetching) {
        return <div className="text-center py-5">Loading...</div>;
    }

    const isDashboardRoute = window.location.pathname.startsWith('/dashboard');

    return (
        <>
            {!isDashboardRoute && <Navbar />}

            <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* User account */}
                <Route path="/user-account/:tab" element={<UserAccount token={token} user={user} />} />

                {/* Dashboard routes */}
                <Route path="/dashboard">
                    <Route path="home" element={<UserDashboard page="home" token={token} user={user} />} />
                    <Route path="clients" element={<UserDashboard page="clients" token={token} user={user} />} />
                    <Route path="client/:id" element={<UserDashboard page="client" token={token} user={user} />} />
                    <Route
                        path="client/:id/services"
                        element={<UserDashboard page="client-services" token={token} user={user} />}
                    />
                    <Route
                        path="services"
                        element={<UserDashboard page="client-services" token={token} user={user} />}
                    />
                    <Route
                        path="service-questionnaires"
                        element={<UserDashboard page="service-questionnaires" token={token} user={user} />}
                    />
                    <Route
                        path="service-questionnaire/:id"
                        element={<UserDashboard page="service-questionnaire" token={token} user={user} />}
                    />
                    <Route
                        path="service-questionnaire/:id/form"
                        element={<UserDashboard page="service-questionnaire-form" token={token} user={user} />}
                    />
                    <Route
                        path="service-questionnaire/:id/form/:serviceId"
                        element={<UserDashboard page="service-questionnaire-form" token={token} user={user} />}
                    />
                    <Route path="service/:id" element={<UserDashboard page="service" token={token} user={user} />} />
                    <Route path="quotes" element={<UserDashboard page="quotes" token={token} user={user} />} />
                    <Route path="quote/:id" element={<UserDashboard page="quote" token={token} user={user} />} />
                    <Route
                        path="quote/sign/:id"
                        element={<UserDashboard page="sign-quote" token={token} user={user} />}
                    />
                    <Route path="jobs" element={<UserDashboard page="jobs" token={token} user={user} />} />
                    <Route path="job/:id" element={<UserDashboard page="job" token={token} user={user} />} />
                    <Route path="invoices" element={<UserDashboard page="invoices" token={token} user={user} />} />
                    <Route path="payouts" element={<UserDashboard page="payouts" token={token} user={user} />} />
                    <Route
                        path="team-members"
                        element={<UserDashboard page="team-members" token={token} user={user} />}
                    />
                    <Route
                        path="team-member/:id"
                        element={<UserDashboard page="team-member" token={token} user={user} />}
                    />
                </Route>

                {/* Fallback route */}
                <Route path="*" element={<PageNotFound />} />
            </Routes>

            {!isDashboardRoute && <Footer />}
        </>
    );
}

export default App;
