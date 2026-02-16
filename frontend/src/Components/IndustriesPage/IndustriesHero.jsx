import React from 'react'
import HeroSection from '../ui/HeroSection'

function IndustriesHero() {
    return (
        <HeroSection>
            {/* Badge */}
            <div className='flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-full border 
            border-gray-300 text-gray-400 text-xs font-semibold mb-4'>
                <div className='bg-green-700/70 p-1.5 rounded-full' />
                <p className='mt-0.5'>Landscaping</p>
            </div>
            <div className='z-20'>
                {/* content */}
                <h1 className='font-heading text-[1.5rem] md:text-4xl lg:text-[3.5rem] text-center leading-snug md:max-w-6xl md:w-8xl'>
                    Spend <span className='text-accent'>Less Time</span> Chasing Paperwork. <span className='text-accent'>Grow</span> Your Business.
                </h1>
                <p className='w-6xl mx-auto text-center md:px-28 md:text-xl lg:text-2xl section-intro mt-4'>
                    Contractorz gives landscaping and lawn care businesses one simple
                    system to manage quotes, schedules, crews, invoices, and payments, all in one place.
                </p></div>
        </HeroSection>
    )
}

export default IndustriesHero