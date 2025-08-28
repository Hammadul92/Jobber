import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./Components/Navbar";
import Home from "./Components/Home";
import SignIn from "./Forms/SignIn";
import Register from "./Forms/Register";

function App() {
  return (
    <Router>
      <Navbar />
      <div className="container">
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;