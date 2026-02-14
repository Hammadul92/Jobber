import React from 'react'
import HeroSection from '../ui/HeroSection'

function AboutHero() {
    return (
        <HeroSection>
            {/* Badge */}
            <div className='flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-full border 
            border-gray-300 text-gray-400 text-xs font-semibold mb-4'>
                <div className='bg-green-700/70 p-1.5 rounded-full' />
                <p className='mt-0.5'>WE ARE CONTRACTORZ</p>
            </div>
            <div className='z-20'>
                {/* content */}
                <h1 className='font-heading text-[1.5rem] md:text-4xl lg:text-[3.5rem] text-center leading-snug md:max-w-6xl md:w-8xl'>
                    Building Better <span className='text-accent'>Businesses</span> For Those Who Build Our <span className='text-accent'>World</span>.
                </h1>
                <p className='w-6xl mx-auto text-center md:px-28 md:text-xl lg:text-2xl section-intro mt-4'>
                    We empower plumbers, electricians, and tradespeople to escape the
                    chaos of paperwork and focus on the craft they love.
                </p></div>
        </HeroSection>
    )
}

export default AboutHero