import { Link } from 'react-router-dom';
import { FaFacebookF, FaTwitter, FaGoogle } from 'react-icons/fa';
import '../App.css';

export default function Footer() {
    return (
        <>
            <footer className="px-32 py-18 bg-secondary text-white">
                {/* Upper Row */}
                <div className="flex items-start justify-between w-full gap-20">
                    {/* About Us Column */}
                    <div className="max-w-2xs">
                        <h4 className="font-sans text-3xl font-semibold">About Us</h4>
                        <p className="text-white/70 mt-5 text-justify">
                            We&apos;re a team of designers, engineers, and innovators building AI tools that empower
                            anyone to turn imagination into stunning visuals — faster, smarter, and effortlessly.
                        </p>
                    </div>
                    {/* Useful Links Column */}
                    <div>
                        <h4 className="font-sans text-2xl font-medium">Useful Links</h4>
                        <div className="flex flex-col items-start gap-3 mt-5">
                            <Link to="/" className="text-white/70 hover:text-white">
                                About
                            </Link>
                            <Link to="/services" className="text-white/70 hover:text-white">
                                Services
                            </Link>
                            <Link to="/team" className="text-white/70 hover:text-white">
                                Team
                            </Link>
                            <Link to="/prices" className="text-white/70 hover:text-white">
                                Prices
                            </Link>
                        </div>
                    </div>
                    {/* Help Column */}
                    <div>
                        <h4 className="font-sans text-2xl font-medium">Help</h4>
                        <div className="flex flex-col items-start gap-3 mt-5">
                            <Link to="/" className="text-white/70 hover:text-white">
                                Customer Support
                            </Link>
                            <Link to="/" className="text-white/70 hover:text-white">
                                Terms & Conditions
                            </Link>
                            <Link to="/" className="text-white/70 hover:text-white">
                                Privacy Policy
                            </Link>
                            <Link to="/" className="text-white/70 hover:text-white">
                                Contact Us
                            </Link>
                        </div>
                    </div>
                    {/* Connect With Us Column */}
                    <div>
                        <h4 className="font-sans text-2xl font-medium">Connect With Us</h4>
                        <div className="flex flex-col items-start gap-4 mt-5 max-w-3xs text-white/70">
                            <p>27 Division St, New York, NY 10002, USA</p>
                            <p>+123 324 2653</p>
                            <p>info@contractorz.com</p>
                        </div>
                    </div>
                </div>

                {/* Lower Row */}
                <div className="w-full border-t-2 border-white/20 mt-14 pt-14 font-light font-intro flex items-center justify-between">
                    © {new Date().getFullYear()} Contractorz. All rights reserved.
                    {/* Social Icons */}
                    <div>
                        <div className="border border-accent rounded-full mx-1.5 p-2 inline-block">
                            <FaFacebookF
                                className="inline-block cursor-pointer text-accent hover:text-white/90 transition-all duration-200"
                                size={20}
                            />
                        </div>
                        <div className="border border-accent rounded-full mx-1.5 p-2 inline-block">
                            <FaTwitter
                                className="inline-block cursor-pointer text-accent hover:text-white/90 transition-all duration-200"
                                size={20}
                            />
                        </div>
                        <div className="border border-accent rounded-full mx-1.5 p-2 inline-block">
                            <FaGoogle
                                className="inline-block cursor-pointer text-accent hover:text-white/90 transition-all duration-200"
                                size={20}
                            />
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
}
