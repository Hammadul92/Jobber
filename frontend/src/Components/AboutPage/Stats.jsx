import React from 'react'

function Stats() {
    return (
        <section className='px-6 py-20 md:px-16 lg:px-32 md:py-20 bg-secondary text-white font-sans 
        flex flex-col md:flex-row items-center justify-between gap-14 md:gap-10 lg:gap-20 text-center md:text-left'>
            <div>
                <h3 className='text-6xl md:text-5xl lg:text-7xl font-semibold'>10k+</h3>
                <p className='font-intro text-xl md:text-base lg:text-2xl'>Businesses Supported</p>
            </div>
            <div>
                <h3 className='text-6xl md:text-5xl lg:text-7xl font-semibold'>$2B+</h3>
                <p className='font-intro text-xl md:text-base lg:text-2xl'>Invoice Processed</p>
            </div>
            <div>
                <h3 className='text-6xl md:text-5xl lg:text-7xl font-semibold'>5M+</h3>
                <p className='font-intro text-xl md:text-base lg:text-2xl'>Jobs Scheduled</p>
            </div>
            <div>
                <h3 className='text-6xl md:text-5xl lg:text-7xl font-semibold'>24/7</h3>
                <p className='font-intro text-xl md:text-base lg:text-2xl'>Customer Support</p>
            </div>
        </section>
    )
}

export default Stats