import React from 'react'
import HeroSection from '../ui/HeroSection'

function ContactHero() {
    return (
        <HeroSection>
            {/* Badge */}
            <div className='flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-full border 
            border-gray-300 text-gray-400 text-[0.6rem] lg:text-xs font-semibold mb-2 lg:mb-10 uppercase'>
                <div className='bg-green-700/70 p-1.5 rounded-full' />
                <p>Average Response Time: {"<"}2 Hours</p>
            </div>
            <div className='z-20'>
                {/* content */}
                <h1 className='font-heading text-[1.5rem] md:text-4xl lg:text-[3.5rem] text-center leading-snug md:max-w-6xl md:w-8xl'>
                    Let&apos;s get your <span className='text-accent'>business organized</span> and growing
                </h1>
                <p className='w-6xl text-gray-600 mx-auto text-center md:px-28 md:text-xl lg:text-2xl section-intro mt-1 lg:mt-10'>
                    Talk to real people who understand contracting work. Whether you're a
                    solo pro or scaling a multi-crew team, we're here to help you run a tighter ship.
                </p>
            </div>
        </HeroSection>
    )
}

export default ContactHero