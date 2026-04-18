import React from "react";
import { CiMobile2 } from "react-icons/ci";
import { TbFileInvoice, TbUser, TbCalendar } from "react-icons/tb";
import { MdOutlineRequestQuote } from "react-icons/md";

function LandscapingFeatures() {
  return (
    <section className="px-6 py-10 md:py-20 md:px-16 lg:px-32 bg-white">
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[#101828] text-center mb-2">
        Features built for landscaping businesses
      </h2>
      <p className="text-gray-500 text-lg text-center mb-10">
        Tools designed for the specific needs of lawn care and outdoor services.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Fast Quotes & Estimates */}
        <div className="bg-white rounded-xl border border-[#e5eaf1] p-5 md:p-8 flex flex-col gap-3 relative">
          <div className="flex items-start justify-between">
            <span className="bg-green-50 p-2 rounded-full">
              {/* Estimate Icon */}
              <MdOutlineRequestQuote className="text-3xl text-green-500" />
            </span>
            <span className="bg-background text-gray-500 px-3 py-1 rounded-md text-sm font-medium">
              On-site or Office
            </span>
          </div>
          <div className="mt-3 md:mt-6 font-medium text-xl text-[#101828]">
            Fast Quotes & Estimates
          </div>
          <div className="text-gray-500 text-base">
            Create and send professional landscaping quotes in minutes.
            Instantly price lawn maintenance, cleanups, or seasonal services.
          </div>
          <div className="bg-background rounded-lg p-4 mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#101828] font-medium">Spring Cleanup</span>
              <span className="text-[#101828] font-medium">$450.00</span>
            </div>
            <div className="w-full h-2 bg-green-100 rounded-full mb-2">
              <div
                className="h-2 bg-green-500 rounded-full"
                style={{ width: "90%" }}
              ></div>
            </div>
            <div className="text-green-500 text-xs font-medium text-right">
              SENT
            </div>
          </div>
        </div>
        {/* Smart Job Scheduling */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-8 flex flex-col justify-between gap-3 relative">
          <div>
            <div className="flex items-start justify-between">
              <span className="bg-blue-50 p-2 rounded-full">
                {/* Calendar Icon */}
                <TbCalendar className="text-3xl text-blue-500" />
              </span>
            </div>
            <div className="mt-5 md:mt-9 font-medium text-xl text-[#101828]">
              Smart Job Scheduling
            </div>
            <div className="mt-2.5 text-gray-500 text-base">
              Schedule recurring or one-time landscaping jobs and assign crews
              effortlessly. Weekly lawn care routes planned in seconds.
            </div>
          </div>

          <div className="bg-background rounded-lg p-4 mt-4 flex items-center justify-between">
            <span className="text-gray-500 font-medium">Recurring Weekly</span>
            <span className="inline-block w-10 h-6 bg-[#e5eaf1] rounded-full relative">
              <span className="absolute left-1 top-1 w-4 h-4 bg-white border border-[#e5eaf1] rounded-full"></span>
            </span>
          </div>
        </div>
        {/* Crew Management */}
        <div className="bg-white rounded-xl border border-[#e5eaf1] p-5 md:p-8 flex flex-col gap-3 relative">
          <div className="flex items-start justify-between">
            <span className="bg-orange-50 p-2 rounded-full">
              {/* Crew Icon */}
              <TbUser className="text-3xl text-orange-500" />
            </span>
          </div>
          <div className="mt-3 md:mt-6 font-medium text-xl text-[#101828]">
            Crew Management
          </div>
          <div className="text-gray-500 text-base">
            Give your team access to job details, locations, and notes — all
            from their phones. Reduce errors and ensure crews know exactly what
            to do.
          </div>
        </div>
        {/* Invoicing & Payments */}
        <div className="bg-white rounded-xl border border-[#e5eaf1] p-5 md:p-8 flex flex-col gap-3 relative">
          <div className="flex items-start justify-between">
            <span className="bg-purple-50 p-2 rounded-full">
              {/* Invoice Icon */}
              <TbFileInvoice className="text-3xl text-purple-500" />
            </span>
          </div>
          <div className="mt-3 md:mt-6 font-medium text-xl text-[#101828]">
            Invoicing & Payments
          </div>
          <div className="text-gray-500 text-base">
            Send invoices right after a job is completed. Accept card payments
            online to drastically reduce unpaid invoices and follow-ups.
          </div>
        </div>
      </div>
      {/* Mobile-Friendly for Field Work */}
      <div className="bg-[#0F172A] rounded-xl p-6 flex items-center gap-4 mt-8">
        <div>
          <p className="text-white text-xl mb-3 font-medium">
            Mobile-Friendly for Field Work
          </p>
          <span className="text-gray-300 text-sm">
            Manage your landscaping business from anywhere — office, truck, or
            job site.
          </span>
        </div>
        <span className="ml-auto">
          {/* Mobile Icon */}
          <CiMobile2 className="text-6xl text-green-300" />
        </span>
      </div>
    </section>
  );
}

export default LandscapingFeatures;
