import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="bg-dark bg-gradient text-light pt-5 pb-3">
            <div className="container">
                <div className="row text-start">
                    {/* Company */}
                    <div className="col-md-2 mb-4">
                        <h6 className="fw-bold mb-3 text-success">Company</h6>
                        <ul className="list-unstyled">
                            <li>
                                <Link to="/about" className="text-light text-decoration-none">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link to="/careers" className="text-light text-decoration-none">
                                    Careers
                                </Link>
                            </li>
                            <li>
                                <Link to="/blog" className="text-light text-decoration-none">
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-light text-decoration-none">
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Product */}
                    <div className="col-md-2 mb-4">
                        <h6 className="fw-bold mb-3 text-success">Product</h6>
                        <ul className="list-unstyled">
                            <li>
                                <Link to="/features" className="text-light text-decoration-none">
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link to="/pricing" className="text-light text-decoration-none">
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link to="/mobile-app" className="text-light text-decoration-none">
                                    Mobile App
                                </Link>
                            </li>
                            <li>
                                <Link to="/integrations" className="text-light text-decoration-none">
                                    Integrations
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Industries */}
                    <div className="col-md-2 mb-4">
                        <h6 className="fw-bold mb-3 text-success">Industries</h6>
                        <ul className="list-unstyled">
                            <li>
                                <Link to="/industries/cleaning" className="text-light text-decoration-none">
                                    Cleaning
                                </Link>
                            </li>
                            <li>
                                <Link to="/industries/landscaping" className="text-light text-decoration-none">
                                    Landscaping
                                </Link>
                            </li>
                            <li>
                                <Link to="/industries/plumbing" className="text-light text-decoration-none">
                                    Plumbing
                                </Link>
                            </li>
                            <li>
                                <Link to="/industries/hvac" className="text-light text-decoration-none">
                                    HVAC
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div className="col-md-3 mb-4">
                        <h6 className="fw-bold mb-3 text-success">Resources</h6>
                        <ul className="list-unstyled">
                            <li>
                                <Link to="/help" className="text-light text-decoration-none">
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link to="/guides" className="text-light text-decoration-none">
                                    Guides & Tutorials
                                </Link>
                            </li>
                            <li>
                                <Link to="/community" className="text-light text-decoration-none">
                                    Community Forum
                                </Link>
                            </li>
                            <li>
                                <Link to="/api" className="text-light text-decoration-none">
                                    API Docs
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="col-md-3 mb-4">
                        <h6 className="fw-bold mb-3 text-success">Legal</h6>
                        <ul className="list-unstyled">
                            <li>
                                <Link to="/privacy" className="text-light text-decoration-none">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms" className="text-light text-decoration-none">
                                    Terms & Conditions
                                </Link>
                            </li>
                            <li>
                                <Link to="/security" className="text-light text-decoration-none">
                                    Security
                                </Link>
                            </li>
                        </ul>
                        <div className="d-flex gap-3 mt-3">
                            <a href="#" className="text-light">
                                <i className="fab fa-facebook fa-lg"></i>
                            </a>
                            <a href="#" className="text-light">
                                <i className="fab fa-linkedin fa-lg"></i>
                            </a>
                            <a href="#" className="text-light">
                                <i className="fab fa-instagram fa-lg"></i>
                            </a>
                            <a href="#" className="text-light">
                                <i className="fab fa-x-twitter fa-lg"></i>
                            </a>
                        </div>
                    </div>
                </div>

                <hr className="border-secondary" />

                <div className="text-center">
                    <p className="mb-0">© {new Date().getFullYear()} ZS Projects. All rights reserved.</p>
                    <p className="mb-0">Built by ZS Projects</p>
                </div>
            </div>
        </footer>
    );
}
