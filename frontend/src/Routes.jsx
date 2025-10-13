import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Components/Navbar';
import PageNotFound from './Components/PageNotFound';
import Home from './Components/Home';

import SignIn from './Components/Forms/SignIn';
import Register from './Components/Forms/Register';
import ForgotPassword from './Components/Forms/ForgotPassword';
import ResetPassword from './Components/Forms/ResetPassword';
import UserDashboard from './Components/UserDashboard';

function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Dashboard routes */}
                <Route path="/dashboard">
                    <Route path="home" element={<UserDashboard page="home" />} />
                    <Route path="clients" element={<UserDashboard page="clients" />} />
                    <Route path="client/:id" element={<UserDashboard page="client" />} />
                    <Route path="client/:id/services" element={<UserDashboard page="client-services" />} />
                    <Route path="services" element={<UserDashboard page="client-services" />} />
                    <Route path="service-questionnaires" element={<UserDashboard page="service-questionnaires" />} />
                    <Route path="service-questionnaire/:id" element={<UserDashboard page="service-questionnaire" />} />
                    <Route
                        path="service-questionnaire/:id/form"
                        element={<UserDashboard page="service-questionnaire-form" />}
                    />
                    <Route
                        path="service-questionnaire/:id/form/:serviceId"
                        element={<UserDashboard page="service-questionnaire-form" />}
                    />
                    <Route path="service/:id" element={<UserDashboard page="service" />} />
                    <Route path="quotes" element={<UserDashboard page="quotes" />} />
                    <Route path="quote/:id" element={<UserDashboard page="quote" />} />
                    <Route path="quote/sign/:id" element={<UserDashboard page="sign-quote" />} />
                    <Route path="jobs" element={<UserDashboard page="jobs" />} />
                    <Route path="invoices" element={<UserDashboard page="invoices" />} />
                    <Route path="payouts" element={<UserDashboard page="payouts" />} />
                    <Route path="team-members" element={<UserDashboard page="team-members" />} />
                    <Route path="team-member/:id" element={<UserDashboard page="team-member" />} />
                    <Route path="settings" element={<UserDashboard page="settings" />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<PageNotFound />} />
            </Routes>
        </Router>
    );
}

export default App;
