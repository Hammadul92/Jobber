"use client"
import React, { useState } from 'react'
import ToggleBilling from './ui/ToggleBilling'
import PricingCard from './ui/PricingCard'

const plans = [
    {
        id: 'free',
        name: 'Free',
        description: 'Everything you need to supercharge your productivity.',
        monthly: 0,
        yearly: 0,
        features: ['20 design generations/month', 'Low-res downloads', 'Basic style presets', 'Limited customization options'],
    },
    {
        id: 'pro',
        name: 'Pro',
        description: 'Unlock a new level of your personal productivity.',
        monthly: 17,
        yearly: 170,
        discountPct: 20,
        features: ['Everything in Free', 'Enigma AI', 'Unlimited design generations', 'Custom Themes', 'High-resolution exports', 'Developer Tools'],
        featured: true,
    },
    {
        id: 'team',
        name: 'Team',
        description: 'Everything you need to supercharge your productivity.',
        monthly: 37,
        yearly: 370,
        discountPct: 20,
        features: ['Everything in Free', 'Unlimited Shared Commands', 'Unlimited Shared Quicklinks', 'Priority support'],
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

            <div className='mt-12 flex flex-col lg:flex-row items-center justify-center space-y-10 lg:-space-x-5'>
                {plans.map((p) => (
                    <PricingCard key={p.id} plan={p} billing={billing} />
                ))}
            </div>
        </section>
    )
}
export default PricingPlans