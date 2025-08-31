import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './Components/Navbar';
import Home from './Components/Home';
import SignIn from './Components/Forms/SignIn';
import Register from './Components/Forms/Register';
import UserDashboard from './Components/UserDashboard';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard/home" element={<UserDashboard page={'home'} />} />
        <Route path="/dashboard/clients" element={<UserDashboard page={'clients'} />} />
        <Route path="/dashboard/quotes" element={<UserDashboard page={'quotes'} />} />
        <Route path="/dashboard/jobs" element={<UserDashboard page={'jobs'} />} />
        <Route path="/dashboard/invoices" element={<UserDashboard page={'invoices'} />} />
        <Route path="/dashboard/payouts" element={<UserDashboard page={'payouts'} />} />
        <Route path="/dashboard/team" element={<UserDashboard page={'team'} />} />
        <Route path="/dashboard/settings" element={<UserDashboard page={'settings'} />} />
      </Routes>
    </Router>
  );
}

export default App;
