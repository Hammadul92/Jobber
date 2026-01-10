import { useState } from 'react';
import { FaEnvelope, FaPhone, FaClock, FaLocationDot, FaArrowRight } from 'react-icons/fa6';

function ContactUs() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setSubmitted(true);
    };

    const contactPoints = [
        {
            icon: <FaPhone className="text-accent" size={22} />,
            label: 'Call Us',
            value: '+1 (555) 012-9912',
            hint: 'Mon – Fri, 9:00 AM – 6:30 PM EST',
        },
        {
            icon: <FaEnvelope className="text-accent" size={22} />,
            label: 'Email',
            value: 'hello@contractorz.com',
            hint: 'We reply in under 24 hours',
        },
        {
            icon: <FaClock className="text-accent" size={22} />,
            label: 'Live Support',
            value: 'Open 8:00 AM – 10:00 PM',
            hint: 'Priority for enterprise plans',
        },
    ];

    return (
        <section className="px-6 md:px-16 lg:px-32 py-32 flex flex-col gap-12">
            <div className="flex flex-col lg:flex-row items-start gap-10 lg:gap-16">
                <div className="flex-1 space-y-6">
                    <h1 className="font-heading text-center md:text-left text-xl md:text-4xl leading-tight text-primary">
                        Let&apos;s build the next chapter of your operations together.
                    </h1>
                    <p className="text-center md:text-left text-lg text-black/70 max-w-3xl">
                        Reach our team for product walkthroughs, onboarding support, or bespoke solutions for your
                        organization. We respond quickly and tailor solutions to your workflow.
                    </p>
                    <div className="grid grid-cols-1 gap-2.5">
                        {contactPoints.map((item) => (
                            <div
                                key={item.label}
                                className="p-4 flex items-start gap-3"
                            >
                                <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/30">
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="font-semibold text-secondary">
                                        {item.label} {" "} <br className='lg:hidden'/>
                                        <span className="text-sm font-medium text-black/60">
                                            {item.hint}
                                        </span>
                                    </p>
                                    <p className="font-medium text-primary">{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 lg:max-w-xl w-full bg-white/90 border border-black/10 rounded-3xl shadow-lg p-8 backdrop-blur-sm">
                    <div className="flex items-start justify-between w-full">
                        <h3 className="font-heading text-xl md:text-2xl">Tell us about your project</h3>
                    </div>

                    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                        <div className="grid md:grid-cols-2 gap-4">
                            <label className="flex flex-col gap-2 text-sm font-medium text-secondary/80">
                                Full Name
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Alex Johnson"
                                    required
                                    className="h-11 px-4 rounded-xl border border-black/10 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-white"
                                />
                            </label>
                            <label className="flex flex-col gap-2 text-sm font-medium text-secondary/80">
                                Work Email
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@company.com"
                                    required
                                    className="h-11 px-4 rounded-xl border border-black/10 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-white"
                                />
                            </label>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <label className="flex flex-col gap-2 text-sm font-medium text-secondary/80">
                                Phone
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="(+1) 555 012 9912"
                                    className="h-11 px-4 rounded-xl border border-black/10 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-white"
                                />
                            </label>
                            <label className="flex flex-col gap-2 text-sm font-medium text-secondary/80">
                                Subject
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    placeholder="Product demo, onboarding, partnership"
                                    required
                                    className="h-11 px-4 rounded-xl border border-black/10 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-white"
                                />
                            </label>
                        </div>

                        <label className="flex flex-col gap-2 text-sm font-medium text-secondary/80">
                            How can we help?
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Share context, timelines, and goals so we can tailor the first call."
                                rows={5}
                                required
                                className="px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-white resize-none"
                            />
                        </label>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="text-sm text-black/70 md:max-w-1/2">
                                Prefer talking to a human? Call us and we&apos;ll route you instantly.
                            </div>
                            <button type="submit" className="primary inline-flex items-center justify-center gap-2">
                                Send Message <FaArrowRight size={18} />
                            </button>
                        </div>

                        {submitted && (
                            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                                Message received. Our team will reach out shortly.
                            </p>
                        )}
                    </form>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 items-stretch">
                <div className="lg:col-span-2 bg-white/90 border border-black/10 rounded-3xl shadow-md p-8 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="uppercase tracking-[0.3em] text-secondary/60 text-xs font-semibold">Offices</p>
                            <h3 className="font-heading text-2xl mt-2">Where to find us</h3>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl border border-black/10 bg-accent/5 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-secondary font-semibold">
                                <FaLocationDot className="text-accent" /> New York, HQ
                            </div>
                            <p className="text-black/70">27 Division St, New York, NY 10002</p>
                            <p className="text-black/60">Walk-ins by appointment only</p>
                        </div>
                        <div className="p-5 rounded-2xl border border-black/10 bg-secondary/5 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-secondary font-semibold">
                                <FaLocationDot className="text-accent" /> Remote Team
                            </div>
                            <p className="text-black/70">Serving clients across US, Canada, and EU time zones.</p>
                            <p className="text-black/60">Ask about on-site implementation.</p>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-secondary text-white p-3 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className='text-center md:text-left lg:w-2/3'>
                            <p className="uppercase tracking-[0.3em] text-white/60 text-xs font-semibold">Need urgent support?</p>
                            <h4 className="font-heading text-md md:text-xl mt-2">Talk live with our support pod</h4>
                            <p className="text-white/80 text-sm mt-1">We usually pick up in under 90 seconds.</p>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <a
                                href="tel:+15550129912"
                                className="secondary w-44 text-center"
                            >
                                Call Now
                            </a>
                            <a href="mailto:hello@contractorz.com" className="primary w-44 text-center">
                                Email Support
                            </a>
                        </div>
                    </div>
                </div>

                <div className="h-full bg-white/90 border border-black/10 rounded-3xl shadow-md p-8 flex flex-col justify-between">
                    <div className="space-y-3">
                        <p className="uppercase tracking-[0.3em] text-secondary/60 text-xs font-semibold">Response Times</p>
                        <h3 className="font-heading text-2xl">What to expect</h3>
                        <ul className="space-y-3 text-black/70">
                            <li className="flex items-start gap-2">
                                <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
                                <span>General inquiries: within 24 hours.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
                                <span>Enterprise & onboarding: within 4 business hours.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
                                <span>Incident support: live callback under 2 minutes.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="mt-6 p-5 rounded-2xl border border-black/10 bg-accent/5 text-black/80">
                        <p className="text-sm">Prefer a scheduled demo?</p>
                        <p className="font-semibold text-secondary">We&apos;ll tailor it to your stack and workflows.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default ContactUs;