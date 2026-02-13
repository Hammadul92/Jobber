import React from 'react'
import { FiClock, FiTrendingUp } from 'react-icons/fi'
import { TfiWallet } from "react-icons/tfi";

function Features() {
    const features = [
        {
            title: 'Reclaim Your Time',
            description:
                'Automated scheduling and dispatching mean less time on the phone and more time on the job site.',
            Icon: FiClock,
        },
        {
            title: 'Get Paid Faster',
            description:
                'Send professional quotes instantly and accept payments on the spot. No more chasing checks.',
            Icon: TfiWallet,
        },
        {
            title: 'Scale With Confidence',
            description:
                'From solo operators to enterprise fleets, our platform grows as your business expands.',
            Icon: FiTrendingUp,
        },
    ]

    return (
        <section className="px-6 py-40 md:px-16 lg:px-32 md:py-24 bg-background">
            <div className="mx-auto max-w-6xl">
                <div className="space-y-6 md:space-y-8">
                    <div className="max-w-3xl space-y-4">
                        <h3 className="text-4xl font-black leading-tight text-gray-900 md:text-[42px]">
                            Everything in one place.
                        </h3>
                        <p className="md:text-xl font-intro leading-relaxed text-gray-600">
                            We replace the dozen disconnected apps you currently use with one streamlined operating system.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {features.map((feature) => (
                            <article
                                key={feature.title}
                                className="group flex h-full flex-col rounded-3xl border border-gray-200 bg-white/80 p-8"
                            >
                                <div className="mb-6">
                                    <feature.Icon className="h-10 w-10 text-gray-900" aria-hidden="true" />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-xl font-medium text-primary">{feature.title}</h3>
                                    <p className="text-xl leading-relaxed text-gray-600">{feature.description}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Features