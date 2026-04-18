import React from "react";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
const JobFlowImage = "/images/jobflow-image.png";

function JobFlow() {
  return (
    <section className="px-6 py-10 md:py-20 md:px-16 lg:px-32 bg-background">
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-center mb-2">
        How a job flows in Contractorz
      </h2>
      <p className="text-gray-500 text-lg text-center mb-10">
        Simple. Organized. Reliable.
      </p>
      <div className="flex flex-col lg:flex-row items-center gap-10 w-full">
        {/* Timeline */}
        <div className="flex-1 min-w-[320px] flex flex-col justify-center">
          <div className="relative">
            <div
              className="absolute left-4 top-0 h-full w-0.5 bg-[#e5eaf1]"
              style={{ height: "calc(100% - 32px)", top: "32px" }}
            ></div>
            <div className="flex flex-col gap-10">
              {/* Step 1 */}
              <div className="flex items-start relative">
                <span className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-[#e5eaf1] bg-white z-10">
                  <svg
                    width="16"
                    height="16"
                    fill="#6a7282"
                    stroke="#a3aed6"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                </span>
                <div className="ml-8">
                  <div className="font-medium text-xl md:text-2xl text-[#101828]">
                    Customer requests a service
                  </div>
                  <div className="text-gray-500 text-base">
                    Inquiry captures all necessary details.
                  </div>
                </div>
              </div>
              {/* Step 2 */}
              <div className="flex items-start relative">
                <span className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-[#e5eaf1] bg-white z-10">
                  <svg
                    width="16"
                    height="16"
                    fill="#6a7282"
                    stroke="#a3aed6"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                </span>
                <div className="ml-8">
                  <div className="font-medium text-xl md:text-2xl text-[#101828]">
                    You send a professional quote
                  </div>
                  <div className="text-gray-500 text-base">
                    Branded and clear pricing sent via email/SMS.
                  </div>
                </div>
              </div>
              {/* Step 3 */}
              <div className="flex items-start relative">
                <span className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-[#e5eaf1] bg-white z-10">
                  <svg
                    width="16"
                    height="16"
                    fill="#6a7282"
                    stroke="#a3aed6"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                </span>
                <div className="ml-8">
                  <div className="font-medium text-xl md:text-2xl text-[#101828]">
                    Job is scheduled and assigned
                  </div>
                  <div className="text-gray-500 text-base">
                    Crew gets notification and route details.
                  </div>
                </div>
              </div>
              {/* Step 4 */}
              <div className="flex items-start relative">
                <span className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-[#e5eaf1] bg-white z-10">
                  <svg
                    width="16"
                    height="16"
                    fill="#6a7282"
                    stroke="#a3aed6"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                </span>
                <div className="ml-8">
                  <div className="font-medium text-xl md:text-2xl text-[#101828]">
                    Crew completes the work
                  </div>
                  <div className="text-gray-500 text-base">
                    Job marked done on mobile app.
                  </div>
                </div>
              </div>
              {/* Step 5 */}
              <div className="flex items-start relative">
                <span className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-green-200 bg-green-50 z-10">
                  <IoMdCheckmarkCircleOutline className="text-green-500 text-lg md:text-xl" />
                </span>
                <div className="ml-8">
                  <div className="font-medium text-xl md:text-2xl text-[#101828]">
                    Invoice sent & Payment collected
                  </div>
                  <div className="text-gray-500 text-base">
                    Instant invoice generation and online payment.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Image Side */}
        <div className="flex-1 min-w-[320px] flex items-center justify-center">
          <img
            src={JobFlowImage}
            alt="Job flow visual"
            className="rounded-2xl w-full max-w-xl object-cover"
          />
        </div>
      </div>
    </section>
  );
}

export default JobFlow;
