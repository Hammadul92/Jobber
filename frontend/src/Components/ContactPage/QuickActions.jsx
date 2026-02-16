import React from 'react'
import { MdOutlineArrowForwardIos } from "react-icons/md";
import { LuLifeBuoy } from "react-icons/lu";
import { TbMessageCircleDollar } from "react-icons/tb";
import { HiOutlinePresentationChartLine } from "react-icons/hi2";

function QuickActions() {
    return (
        <section className="px-6 py-20 md:px-16 lg:px-32 md:py-24 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-12 place-content-center">
                {/* Card 1: Talk to Sales */}
                <div className="bg-background rounded-xl border border-gray-200 shadow-sm p-4 lg:p-8 flex flex-col gap-4 md:w-30%">
                    <div className="mb-2">
                        <span className="inline-block bg-white border border-gray-100 rounded-md p-2">
                            <TbMessageCircleDollar className="w-8 h-8 text-secondary" />
                        </span>
                    </div>
                    <h3 className="text-lg font-medium">Talk to Sales</h3>
                    <p className="text-gray-600 font-normal text-sm">Perfect for discussing pricing, custom plans, or migrating from another tool like Jobber or Housecall Pro.</p>
                    <a href="#" className="font-semibold text-secondary mt-auto hover:underline flex items-center gap-1">Chat with an expert <MdOutlineArrowForwardIos className="inline-flex" />
                    </a>
                </div>

                {/* Card 2: Book a Live Demo */}
                <div className="bg-background rounded-xl border border-gray-200 shadow-sm p-4 lg:p-8 flex flex-col gap-4 md:w-30%">
                    <div className="mb-2">
                        <span className="inline-block bg-white border border-gray-100 rounded-md p-2">
                            <HiOutlinePresentationChartLine className="w-8 h-8 text-secondary" />
                        </span>
                    </div>
                    <h3 className="text-lg font-medium">Book a Live Demo</h3>
                    <p className="text-gray-600 font-normal text-sm">See exactly how Contractorz works for your specific trade. We'll walk through scheduling, quoting, and invoicing.</p>
                    <a href="#" className="font-semibold text-accent mt-auto hover:underline flex items-center gap-1">Schedule a walkthrough <MdOutlineArrowForwardIos className="inline-flex" />
                    </a>
                </div>

                {/* Card 3: Customer Support */}
                <div className="bg-background rounded-xl border border-gray-200 shadow-sm p-4 lg:p-8 flex flex-col gap-4 md:w-30%">
                    <div className="mb-2">
                        <span className="inline-block bg-white border border-gray-100 rounded-md p-2">
                            <LuLifeBuoy className="w-8 h-8 text-secondary" />
                        </span>
                    </div>
                    <h3 className="text-lg font-medium">Customer Support</h3>
                    <p className="text-gray-600 font-normal text-sm">Already using Contractorz? Get help with technical issues, account settings, or team onboarding.</p>
                    <a href="#" className="font-semibold text-secondary mt-auto hover:underline flex items-center gap-1">Visit Help Center <MdOutlineArrowForwardIos className="inline-flex" />
                    </a>
                </div>
            </div>
        </section>
    )
}

export default QuickActions