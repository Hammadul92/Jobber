"use client"
import React, { useState } from 'react'
import ToggleBilling from './ui/ToggleBilling'
import PricingCard from './ui/PricingCard'

const plans = [
    {
        id: 'basic',
        name: 'Basic',
        description: 'Start with the essentials for a lean team.',
        monthly: 50,
        yearly: 500,
        discountPct: 20,
        features: [
            '1 user',
            '20 clients',
            'Core scheduling',
            'Email support',
            '20 design generations/month',
            'Low-res downloads',
            'Basic style presets',
            'Limited customization options',
        ],
    },
    {
        id: 'team',
        name: 'Team',
        description: 'Grow collaboration with more seats and clients.',
        monthly: 70,
        yearly: 700,
        discountPct: 20,
        features: [
            '10 users',
            '50 clients',
            'Shared workflows',
            'Priority support',
            'Everything in Basic',
            'Unlimited Shared Commands',
            'Unlimited Shared Quicklinks',
            'Core scheduling',
        ],
        featured: true,
    },
    {
        id: 'business',
        name: 'Business',
        description: 'Scale with advanced capacity and support.',
        monthly: 120,
        yearly: 1200,
        discountPct: 20,
        features: [
            '20 users',
            '100 clients',
            'Advanced analytics',
            'Dedicated success manager',
            'Everything in Team',
            'Enigma AI',
            'Unlimited design generations',
            'High-resolution exports',
        ],
    },
]

function PricingPlans() {
    const [billing, setBilling] = useState('monthly')

    return (
        <section id='pricingPlans' className='w-full min-h-screen px-6 py-12 lg:px-32 lg:py-28 bg-background'>
            <div>
                <h2 className='font-heading text-2xl text-secondary max-w-lg mx-auto text-center'>
                    Choose the plan that&apos;s right for you
                </h2>
                <p className='font-intro mt-3 text-lg text-black/70 max-w-2xl text-center mx-auto'>
                    Giving you access to essential features and over 1,000 creative tools.
                </p>
            </div>
            <div className='mt-8 flex items-center justify-center'>
                {/* Month/Year toggle */}
                <ToggleBilling value={billing} onChange={(v) => setBilling(v)} />
            </div>

            <div className='mt-20 flex flex-col md:flex-row items-stretch justify-center md:-space-x-1 lg:-space-x-5 space-y-10 lg:space-y-0'>
                {plans.map((p) => (
                    <PricingCard key={p.id} plan={p} billing={billing} />
                ))}
            </div>
        </section>
    )
}
export default PricingPlans