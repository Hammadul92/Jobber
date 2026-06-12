import React from "react";

const topRowTestimonials = [
  {
    quote:
      "The intake questionnaire alone saved our office hours every week. Homeowners send the property details up front, and we stop dispatching crews with half the information missing.",
    initials: "MR",
    title: "Owner",
    company: "Maple Ridge Landscaping",
  },
  {
    quote:
      "We use Contractorz from quote to invoice now. Our estimates look sharper, clients approve faster, and the team always knows which lawn and maintenance jobs are actually booked.",
    initials: "LC",
    title: "Operations Manager",
    company: "LawnCraft Property Care",
  },
  {
    quote:
      "Before this, our crew leads were texting updates and the office was rebuilding the day from memory. Now job status, client notes, and follow-up billing all live in one place.",
    initials: "SB",
    title: "Field Supervisor",
    company: "Summit Outdoor Services",
  },
];

const bottomRowTestimonials = [
  {
    quote:
      "The biggest difference for us is how organized the handoff feels. Once a quote is signed, the service, schedule, and invoice trail are already there instead of starting from scratch.",
    initials: "DP",
    title: "General Manager",
    company: "Downpour Irrigation Co.",
  },
  {
    quote:
      "We finally have a cleaner process for recurring maintenance clients. The office can track who filled out their questionnaire, what was approved, and what still needs to be invoiced.",
    initials: "AR",
    title: "Business Owner",
    company: "Arbor Run Lawn & Garden",
  },
  {
    quote:
      "Stripe payouts and invoice tracking gave us a much clearer picture of cash flow. It is easier to answer client billing questions when the history is already tied to the job.",
    initials: "NT",
    title: "Administrator",
    company: "North Trail Landscaping",
    faded: true,
  },
];

function Stars() {
  return (
    <div className="flex gap-1 md:mb-2">
      {[...Array(5)].map((_, i) => (
        <svg key={i} width="20" height="20" fill="#10b981" viewBox="0 0 20 20">
          <polygon points="10,1 12.59,7.36 19.51,7.64 14,12.14 15.82,18.99 10,15.27 4.18,18.99 6,12.14 0.49,7.64 7.41,7.36" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialItem({ quote, initials, title, company, faded = false }) {
  return (
    <div
      className={`w-full rounded-2xl border border-[#e5eaf1] bg-white p-8 flex flex-col gap-4 lg:min-w-4/11 ${
        faded ? "lg:opacity-40" : ""
      }`}
    >
      <Stars />
      <div className="text-primary text-lg md:text-xl font-medium">
        "{quote}"
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e5eaf1] text-lg font-bold text-[#64748b]">
          {initials}
        </span>
        <div>
          <div className="text-sm font-semibold text-[#101828] md:text-base">
            {title}
          </div>
          <div className="text-xs text-[#64748b] md:text-sm">{company}</div>
        </div>
      </div>
    </div>
  );
}

function TrustedBy() {
  return (
    <section className="border-b border-gray-200 bg-white px-6 py-10 md:px-16 md:py-20 lg:px-0">
      <h2 className="mb-12 text-center text-3xl font-extrabold text-[#101828] md:text-4xl">
        Trusted by landscaping professionals
      </h2>

      <div className="flex flex-wrap items-center justify-start gap-5 overflow-hidden lg:flex-nowrap lg:pl-32">
        {topRowTestimonials.map((testimonial) => (
          <TestimonialItem
            key={`${testimonial.company}-${testimonial.initials}`}
            {...testimonial}
          />
        ))}
      </div>

      <div className="mt-5 flex flex-row-reverse flex-wrap items-center justify-start gap-5 lg:flex-nowrap lg:pr-32">
        {bottomRowTestimonials.map((testimonial) => (
          <TestimonialItem
            key={`${testimonial.company}-${testimonial.initials}`}
            {...testimonial}
          />
        ))}
      </div>
    </section>
  );
}

export default TrustedBy;
