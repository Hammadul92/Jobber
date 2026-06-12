import React from "react";
import TestimonialCard from "../ui/TestimonialCard";

const testimonials = [
  {
    title: "We stopped chasing customers for basic job details.",
    content:
      "Before Contractorz, every new request turned into a back-and-forth over text and phone. Now clients fill out the service questionnaire first, and my team starts with the right scope, address, and notes already in the system.",
    userName: "Michael Reyes",
    userRole: "Owner, Reyes Landscaping",
    userImage: "/images/user.png",
    light: true,
  },
  {
    title: "Quotes get signed faster because the process feels professional.",
    content:
      "We create the quote, send it from the dashboard, and the client signs it through the secure link without us explaining the next step. That alone cut down the time between estimate and approval for our flooring jobs.",
    userName: "Sarah Patel",
    userRole: "Operations Manager, Northline Flooring",
    userImage: "/images/user.png",
  },
  {
    title: "Invoices and payouts are finally connected in one workflow.",
    content:
      "What I like most is that billing is not separate from the work anymore. Once a service is active and payment comes in, I can see the invoice, the payout status, and our banking details in one place instead of reconciling three different tools.",
    userName: "Jordan Kim",
    userRole: "Founder, ClearPeak Exteriors",
    userImage: "/images/user.png",
  },
  {
    title: "My crew and office see the same job picture now.",
    content:
      "The office can assign jobs, the team can track status, and we have one record of what was quoted, scheduled, and completed. It sounds simple, but for a growing contractor that visibility makes a huge difference.",
    userName: "Danielle Brooks",
    userRole: "General Manager, Brooks Home Services",
    userImage: "/images/user.png",
    light: true,
  },
];

function Testimonials() {
  return (
    <section className="w-full px-6 py-12 md:px-16 lg:py-28 lg:px-32">
      {/* Header Content */}
      <div>
        <div className="w-full flex flex-wrap lg:flex-nowrap items-end justify-between gap-5 mb6 lg:mb-3">
          <div className="lg:pb-12">
            <h2 className="font-heading text-xl md:text-2xl lg:text-3xl max-w-3xl leading-relaxed lg:leading-14">
              HERE&apos;S WHAT OUR{" "}
              <span className="text-accent">CUSTOMERS</span> HAVE TO SAY
            </h2>
          </div>
          <div className="flex md:items-center lg:items-end justify-start gap-4 max-w-sm mb-10">
            <img
              src="/images/linesflower.svg"
              alt="Customer testimonial"
              width={70}
              height={70}
              className="md:w-10 lg:w-18 h-auto"
            />
            <p className="text-3xs leading-tight">
              Real stories from contractors using questionnaires, quotes,
              jobs, invoices, and payouts in one workflow.
            </p>
          </div>
        </div>
        <button className="secondary">Read Customer&apos; Stories</button>
      </div>
      {/* Testimonials Cards */}
      <div className="grid md:grid-cols-2 gap-4 mt-8">
        {testimonials.map((testimonial) => (
          <TestimonialCard
            key={`${testimonial.userName}-${testimonial.title}`}
            title={testimonial.title}
            content={testimonial.content}
            userName={testimonial.userName}
            userRole={testimonial.userRole}
            userImage={testimonial.userImage}
            light={testimonial.light}
          />
        ))}
      </div>
    </section>
  );
}

export default Testimonials;
