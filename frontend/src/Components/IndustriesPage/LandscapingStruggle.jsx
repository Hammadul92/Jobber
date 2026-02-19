import React from 'react'
import { IoCloseCircleOutline } from "react-icons/io5";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";

function LandscapingStruggle() {
    return (
        <section className="px-6 py-10 md:py-20 md:px-16 lg:px-32 bg-white">
            <div className="flex flex-col lg:flex-row gap-10 md:gap-20 items-center justify-between w-full">
                {/* Left Side */}
                <div className="flex-1 min-w-[320px]">
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-heading leading-normal">
                        LANDSCAPING WORK IS HARD ENOUGH. <span className="text-orange-500">RUNNING THE BUSINESS SHOULDN'T BE.</span>
                    </h2>
                    <p className="mt-8 md:text-xl  text-[#667085] max-w-xl">
                        If you run a landscaping business, you know the struggle. Manual tools and disconnected apps weren’t built for landscapers. That’s where Contractorz comes in.
                    </p>
                    <ul className="mt-8 space-y-4">
                        <li className="flex items-start md:items-center text-[#667085] md:text-lg">
                            <IoCloseCircleOutline className="text-red-500 mt-1 md:mt-0 mr-3 md:text-lg lg:text-xl" />
                            Quotes scattered across texts, calls, and emails
                        </li>
                        <li className="flex items-start md:items-center text-[#667085] md:text-lg">
                            <IoCloseCircleOutline className="text-red-500 mt-1 md:mt-0 mr-3 md:text-lg lg:text-xl" />
                            Jobs missed because schedules aren&apos;t clear
                        </li>
                        <li className="flex items-start md:items-center text-[#667085] md:text-lg">
                            <IoCloseCircleOutline className="text-red-500 mt-1 md:mt-0 mr-3 md:text-lg lg:text-xl" />
                            Crews asking for details you can&apos;t find fast
                        </li>
                        <li className="flex items-start md:items-center text-[#667085] md:text-lg">
                            <IoCloseCircleOutline className="text-red-500 mt-1 md:mt-0 mr-3 md:text-lg lg:text-xl" />
                            Invoices sent late and payments delayed
                        </li>
                    </ul>
                </div>
                {/* Right Side */}
                <div className="flex-1 min-w-[320px] flex flex-col items-center justify-center border border-gray-300 rounded-xl p-5 md:p-6">
                    <div className="w-full bg-green-50 border border-green-100 rounded-xl p-6 flex items-center gap-4 mb-6">
                        <div className='p-2 bg-green-200/50 rounded-full'>
                            <IoMdCheckmarkCircleOutline className="text-green-500 text-xl md:text-2xl" />
                            </div>
                        <div>
                            <div className="font-medium md:text-lg text-primary">One Dashboard</div>
                            <div className="text-gray-400 text-sm md:text-base">From inquiry to final payment</div>
                        </div>
                    </div>
                    <p className="text-gray-500 md:text-lg max-w-md">
                        Contractorz is an all-in-one business management platform designed to support the day-to-day reality of landscaping companies. You don’t need more tools. You need one tool that actually works.
                    </p>
                </div>
            </div>
        </section>
    )
}

export default LandscapingStruggle