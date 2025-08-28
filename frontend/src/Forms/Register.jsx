import { useState } from "react";
import { Link } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");

  const checkPasswordStrength = (pwd) => {
    let strength = "";
    const strongRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (pwd.length < 6) {
      strength = "Too short";
    } else if (!/[A-Z]/.test(pwd)) {
      strength = "Must include uppercase letter";
    } else if (!/[0-9]/.test(pwd)) {
      strength = "Must include a number";
    } else if (!/[!@#$%^&*]/.test(pwd)) {
      strength = "Must include special character";
    } else if (strongRegex.test(pwd)) {
      strength = "Strong Password ✅";
    }
    setPasswordStrength(strength);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    console.log("Name:", name, "Email:", email, "Password:", password);
    // Add registration logic here
  };

  return (
    <div className="mt-5">
      <h2 className="text-center mb-4">Register</h2>

      <form onSubmit={handleSubmit} className="row">
        <div className="col-md-4 offset-md-4">
          {/* Name Field */}
          <div className="mb-3">
            <label htmlFor="name" className="mb-2">
              Name (*)
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="form-control form-control-lg rounded-0"
              placeholder="Full Name"
            />
          </div>

          {/* Email Field */}
          <div className="mb-3">
            <label htmlFor="email" className="mb-2">
              Email (*)
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-control form-control-lg rounded-0"
              placeholder="Email"
            />
          </div>

          {/* Password Field */}
          <div className="mb-3">
            <label htmlFor="password" className="mb-2">
              Password (*)
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                checkPasswordStrength(e.target.value);
              }}
              required
              className="form-control form-control-lg rounded-0"
              placeholder="Password"
            />
            {password && (
              <small
                className={`d-block mt-1 ${
                  passwordStrength.includes("Strong")
                    ? "text-success"
                    : "text-danger"
                }`}
              >
                {passwordStrength}
              </small>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="mb-3">
            <label htmlFor="confirmPassword" className="mb-2">
              Confirm Password (*)
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="form-control form-control-lg rounded-0"
              placeholder="Confirm Password"
            />
          </div>

          {/* Submit Button */}
          <div className="text-center mb-3">
            <button
              type="submit"
              className="btn brn-lg btn-success w-100 rounded-0"
            >
              Register
            </button>
          </div>

          {/* Login Link */}
          <p className="text-center">
            Already have an account?{" "}
            <Link to="/sign-in">
              Sign In
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
