import React from 'react'
import { IoMdCheckmarkCircleOutline } from "react-icons/io";

function WhyUs() {
    return (
        <section className="px-6 py-10 md:py-20 md:px-16 lg:px-32 bg-white flex items-center justify-center">
            <div className='bg-[#0F172A] rounded-2xl px-4 py-12 md:px-16 md:py-16 w-5xl max-w-xl mx-auto'>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center mb-10">Why businesses choose Contractorz</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 mb-10">
                    <div className="flex items-start gap-3">
                        <IoMdCheckmarkCircleOutline className="text-green-500 text-xl md:text-[2.2rem] lg:text-xl mt-1 md:mt-0 lg:mt-1" />
                        <p className="text-gray-300 md:text-lg">Built for service businesses, not generic software</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <IoMdCheckmarkCircleOutline className="text-green-500 text-lg md:text-[1.75rem] lg:text-xl mt-1" />
                        <p className="text-gray-300 md:text-lg">One platform instead of multiple tools</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <IoMdCheckmarkCircleOutline className="text-green-500 text-lg md:text-3xl lg:text-xl mt-1" />
                        <p className="text-gray-300 md:text-lg">Easy to use, even for non-technical teams</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <IoMdCheckmarkCircleOutline className="text-green-500 text-lg md:text-3xl lg:text-xl mt-1" />
                        <p className="text-gray-300 md:text-lg">Designed to support growth without chaos</p>
                    </div>
                </div>
                <div className="border-t border-[#1e293b] my-8"></div>
                <div className="text-center">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-3">Run Your Landscaping Business Smarter</h3>
                    <p className="text-[#94A3B8] md:text-lg mb-8">Stop juggling tools and chasing paperwork. Start running your business with clarity and confidence.</p>
                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                        <button className="bg-white text-[#0F172A] font-semibold px-8 py-4 rounded-xl md:text-lg hover:bg-gray-100 transition">Start Free Trial</button>
                        <button className="border border-[#334155] text-white font-semibold px-8 py-4 rounded-xl md:text-lg hover:bg-[#1e293b] transition">Book a Demo</button>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default WhyUs