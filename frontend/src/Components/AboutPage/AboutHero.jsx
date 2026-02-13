import React from 'react'
import HeroSection from '../ui/HeroSection'

function AboutHero() {
    return (
        <HeroSection>
            {/* Badge */}
            <div className='flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-full border 
            border-gray-300 text-gray-400 text-xs font-semibold'>
                <div className='bg-green-700/70 p-1.5 rounded-full' />
                <p className='mt-0.5'>WE ARE CONTRACTORZ</p>
            </div>
            {/* content */}
            <h1 className='font-heading text-[1.2rem] md:text-4xl lg:text-6xl text-center leading-snug md:max-w-6xl md:w-8xl'>
                Building Better <span className='text-accent'>Businesses</span> For Those Who Build Our <span className='text-accent'>World</span>.
            </h1>
            <p className='w-6xl text-center lg:px-28 text-lg md:text-xl lg:text-3xl section-intro mt-2'>
                We empower plumbers, electricians, and tradespeople to escape the
                chaos of paperwork and focus on the craft they love.
            </p>
        </HeroSection>
    )
}

export default AboutHero