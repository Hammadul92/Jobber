import cleaning_image from './images/cleaning.png';
import landscaping_image from './images/landscaping.png';
import plumbing_image from './images/plumbing.png';
import construction_image from './images/construction.png';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-light py-5 text-center">
        <div className="container">
          <h1 className="display-4 fw-bold">
            Simplify Your Service Business with ZS Projects
          </h1>
          <p className="lead">
            Manage jobs, scheduling, invoicing, and payments — all in one
            powerful platform.
          </p>
          <div className="mt-4">
            <a href="#contact" className="btn btn-primary btn-lg me-2">
              Get Started
            </a>
            <a href="#contact" className="btn btn-success btn-lg">
              Book a Demo
            </a>
          </div>
        </div>
      </section>

      {/* Who We Help */}
      <section className="py-5">
        <div className="container text-center">
          <h2 className="mb-5">Built for Service Businesses</h2>
          <div className="row">
            {[
              {
                icon: 'fa-broom',
                text: 'Cleaning Companies',
                img: cleaning_image,
              },
              {
                icon: 'fa-seedling',
                text: 'Landscaping & Lawn Care',
                img: landscaping_image,
              },
              {
                icon: 'fa-wrench',
                text: 'Plumbing & Electrical',
                img: plumbing_image,
              },
              {
                icon: 'fa-hard-hat',
                text: 'Renovations & Contractors',
                img: construction_image,
              },
            ].map((item, i) => (
              <div key={i} className="col-md-3 col-6 mb-4 text-center">
                <img
                  src={item.img}
                  alt={`${item.text} image`}
                  className="img-fluid rounded mb-2"
                />
                <h4>{item.text}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-5 bg-light">
        <div className="container text-center">
          <h2 className="mb-5">Core Features</h2>
          <div className="row">
            {[
              {
                icon: 'fa-calendar-check',
                title: 'Job Scheduling',
                desc: 'Drag & drop calendar to assign and track jobs.',
              },
              {
                icon: 'fa-file-invoice-dollar',
                title: 'Invoicing & Payments',
                desc: 'Create branded invoices and get paid faster.',
              },
              {
                icon: 'fa-users',
                title: 'Client Management',
                desc: 'Keep all customer details in one place.',
              },
              {
                icon: 'fa-mobile-screen-button',
                title: 'Mobile App',
                desc: 'Empower your field staff with mobile job updates.',
              },
            ].map((feature, i) => (
              <div key={i} className="col-md-3 mb-4 text-center">
                <i
                  className={`fa-solid ${feature.icon} fa-3x text-primary mb-3`}
                ></i>
                <h5>{feature.title}</h5>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose ZS Projects */}
      <section className="py-5">
        <div className="container text-center">
          <h2 className="mb-5">Why Choose ZS Projects?</h2>
          <div className="row">
            {[
              {
                icon: 'fa-tags',
                title: 'Affordable Pricing',
                desc: 'Transparent plans with no hidden fees.',
              },
              {
                icon: 'fa-gears',
                title: 'Customizable Workflows',
                desc: 'Adapt the platform to your business needs.',
              },
              {
                icon: 'fa-headset',
                title: 'Dedicated Support',
                desc: 'Friendly local support team ready to help.',
              },
              {
                icon: 'fa-bolt',
                title: 'Fast & Easy',
                desc: 'Modern design that your team can learn quickly.',
              },
            ].map((item, i) => (
              <div key={i} className="col-md-3 mb-4 text-center">
                <i
                  className={`fa-solid ${item.icon} fa-3x text-success mb-3`}
                ></i>
                <h5>{item.title}</h5>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center mb-4">Let’s Talk About Your Business</h2>
          <div className="row justify-content-center">
            <div className="col-md-8">
              <form className="p-4 border rounded bg-white shadow-sm">
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Your name"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Business Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Your business"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Your email"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="Your phone number"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Message</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Tell us about your needs"
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  Submit Request
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-light py-4 text-center">
        <div className="container">
          <p className="mb-1">
            © {new Date().getFullYear()} ZS Projects. All rights reserved.
          </p>
          <p className="mb-0">Developed by ZS Projects</p>
        </div>
      </footer>
    </div>
  );
}
