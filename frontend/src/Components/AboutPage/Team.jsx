import React from 'react'
import { FiCheckCircle } from 'react-icons/fi'

function Team() {
    const highlights = [
        'Built for mobile, works offline',
        'Enterprise-grade security',
        'Syncs with your accounting software',
    ]

    return (
        <section className="bg-white px-6 py-20 md:px-16 lg:px-32 md:py-24 flex flex-col gap-10 md:flex-row md:items-center justify-center md:gap-7 lg:gap-14">
            {/* Left side Images Column */}
            <div className="flex min-w-[48%] flex-1 items-center gap-4 md:gap-6">
                {/* Left Images Column */}
                <div className='pt-6 space-y-4 md:space-y-6'>
                    <div className="rounded-2xl flex items-end">
                        <div style={{ aspectRatio: '5 / 6' }}>
                            <img src="/images/user.png" alt="Team member portrait" className="h-full w-full object-cover rounded-2xl" loading="lazy" />
                        </div>
                    </div>

                    <div className="rounded-2xl flex items-end mb-10">
                        <div className=" aspect-square">
                            <img src="/images/user.png" alt="Team member portrait" className="h-full w-full object-cover rounded-2xl" loading="lazy" />
                        </div>
                    </div>
                </div>
                {/* Right Images Column */}
                <div className='space-y-4 md:space-y-6'>
                    <div className="rounded-2xl flex items-end">
                        <div style={{ aspectRatio: '7 / 8' }}>
                            <img src="/images/user.png" alt="Team member portrait" className="h-full w-full object-cover rounded-2xl" loading="lazy" />
                        </div>
                    </div>

                    <div className="rounded-2xl">
                        <div className="" style={{ aspectRatio: '3 / 4' }}>
                            <img src="/images/user.png" alt="Team member portrait" className="h-full w-full object-cover rounded-2xl" loading="lazy" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side Text Content */}
            <div className="min-w-[48%] flex-1 space-y-6 md:space-y-8">
                <div className="space-y-4">
                    <h3 className="text-xl md:text-2xl lg:text-3xl font-heading uppercase text-primary tracking-tighter">
                        More than just software.
                    </h3>
                    <p className="leading-relaxed text-gray-600 md:text-2xl">
                        We aren&apos;t just developers; we are partners in your growth. Our team is composed of industry veterans
                        and tech experts united by a single goal making your life easier.
                    </p>
                    <p className="leading-relaxed text-gray-600 md:text-2xl">
                        We understand the late nights finishing quotes and the weekends lost to bookkeeping. That&apos;s why every
                        feature in Contractorz is designed with simplicity and speed in mind.
                    </p>
                </div>

                <ul className="space-y-3">
                    {highlights.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-base font-semibold text-gray-900 md:text-lg">
                            <FiCheckCircle className="mt-1 h-5 w-5 text-gray-700" aria-hidden="true" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}

export default Team
