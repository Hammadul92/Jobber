import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addUser } from "../store";

export default function SignIn() {
    const dispatch = useDispatch()
    const user = useSelector((state) => {
        return state.user
    })

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Email:", email, "Password:", password);
        // Add authentication logic here
        const action = addUser({email: email})
        dispatch(action)
    };

    return (
        <div className="mt-5">
            <h2 className="text-center mb-4">Sign In</h2>

            <form onSubmit={handleSubmit} className="row">
                <div className="col-md-4 offset-md-4">
                    {/* Email Field */}
                    <div className=" mb-3">
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
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="form-control form-control-lg rounded-0"
                            placeholder="Password"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="text-center mb-3">
                        <button type="submit" className="btn brn-lg btn-success w-100 rounded-0">
                            Sign In
                        </button>
                    </div>

                    {/* Forgot Password */}
                    <div className="text-center mb-3">
                        <Link to="/forgot-password">
                            Forgot Password?
                        </Link>
                    </div>

                    {/* Register Link */}
                    <p className="text-center">
                        Don’t have an account?{" "}
                        <Link to="/register">
                            Register
                        </Link>
                    </p>
                </div>
            </form>
        </div>
    );
}
