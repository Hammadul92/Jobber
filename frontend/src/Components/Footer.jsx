import { Link, useNavigate } from 'react-router-dom';
import { FaFacebookF, FaTwitter, FaGoogle } from 'react-icons/fa';
import '../App.css';

export default function Footer() {
    const navigate = useNavigate();

    const scrollToPricing = () => {
        const pricingSection = document.getElementById('pricingPlans');
        if (pricingSection) {
            pricingSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handlePricingClick = (event) => {
        event.preventDefault();

        const isHome = location.pathname === '/';

        if (!isHome) {
            navigate('/');
            setTimeout(scrollToPricing, 150);
            return;
        }

        scrollToPricing();
    };


    return (
        <>
            <footer className="w-full px-6 py-12 md:px-16 lg:px-32 lg:py-18 bg-secondary text-white">
                {/* Upper Row */}
                <div className="flex flex-wrap lg:flex-nowrap items-start justify-between w-full gap-8 lg:gap-20">
                    {/* About Us Column */}
                    <div className="lg:w-2xs lg:max-w-2xs">
                        <h4 className="font-sans text-3xl font-semibold">About Us</h4>
                        <p className="text-white/70 mt-2 md:mt-5 text-justify">
                            We&apos;re a team of designers, engineers, and innovators building AI tools that empower
                            anyone to turn imagination into stunning visuals — faster, smarter, and effortlessly.
                        </p>
                    </div>
                    {/* Useful Links Column */}
                    <div>
                        <h4 className="font-sans text-2xl font-medium">Useful Links</h4>
                        <div className="flex flex-col items-start lg:gap-3 mt-2 md:mt-5">
                            <Link to="/" className="text-white/70 hover:text-white">
                                About
                            </Link>
                            <Link to="/services" className="text-white/70 hover:text-white">
                                Services
                            </Link>
                            <Link to="/team" className="text-white/70 hover:text-white">
                                Team
                            </Link>
                            <Link to="/" onClick={handlePricingClick} className="text-white/70 hover:text-white">
                                Prices
                            </Link>
                        </div>
                    </div>
                    {/* Help Column */}
                    <div>
                        <h4 className="font-sans text-2xl font-medium">Help</h4>
                        <div className="flex flex-col items-start lg:gap-3 mt-2 md:mt-5">
                            <Link to="/customer-support" className="text-white/70 hover:text-white">
                                Customer Support
                            </Link>
                            <Link to="/terms-and-conditions" className="text-white/70 hover:text-white">
                                Terms & Conditions
                            </Link>
                            <Link to="/privacy-policy" className="text-white/70 hover:text-white">
                                Privacy Policy
                            </Link>
                            <Link to="/contact-us" className="text-white/70 hover:text-white">
                                Contact Us
                            </Link>
                        </div>
                    </div>
                    {/* Connect With Us Column */}
                    <div>
                        <h4 className="font-sans text-2xl font-medium">Connect With Us</h4>
                        <div className="flex flex-col items-start lg:gap-4 mt-2 md:mt-5 max-w-3xs text-white/70">
                            <p>27 Division St, New York, NY 10002, USA</p>
                            <p>+123 324 2653</p>
                            <p>info@contractorz.com</p>
                        </div>
                    </div>
                </div>

                {/* Lower Row */}
                <div className="w-full border-t-2 border-white/20 mt-12 pt-12 font-light font-intro flex flex-wrap md:flex-nowrap items-center justify-between">
                    © {new Date().getFullYear()} Contractorz. All rights reserved.
                    {/* Social Icons */}
                    <div>
                        <div className="border-0 md:border border-accent rounded-full mx-0 md:mx-1.5 p-1.5 md:p-2 inline-block">
                            <FaFacebookF
                                className="inline-block cursor-pointer text-accent hover:text-white/90 transition-all duration-200"
                                size={20}
                            />
                        </div>
                        <div className="border-0 md:border border-accent rounded-full mx-0 md:mx-1.5 p-1.5 md:p-2 inline-block">
                            <FaTwitter
                                className="inline-block cursor-pointer text-accent hover:text-white/90 transition-all duration-200"
                                size={20}
                            />
                        </div>
                        <div className="border-0 md:border border-accent rounded-full mx-0 md:mx-1.5 p-1.5 md:p-2 inline-block">
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
