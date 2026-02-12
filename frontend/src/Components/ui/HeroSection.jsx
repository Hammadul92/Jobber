import React, { Children } from 'react'
const HorizontalRectangle = '/images/rounded-horizontal-rectangle.svg';
const VerticalRectangle = '/images/rounded-vertical-rectangle.svg';
const Hexagon = '/images/hexagon.svg';

function HeroSection({ children }) {
    return (
        <section className='relative bg-background overflow-hidden lg:min-h-screen md:h-[70vh] lg:h-screen w-full px-6 py-40 md:px-16 lg:px-32 md:py-24 flex flex-col items-center justify-center gap-3'>

            {/* Design Elements */}
            <div className='absolute w-40 bottom-7 md:w-auto md:bottom-10 lg:bottom-16 left-0'>
                <img src={HorizontalRectangle} alt="Design Element" />
            </div>
            <div className='absolute w-14 top-20 right-0 md:w-24 lg:w-fit'>
                <img src={VerticalRectangle} alt="Design Element" className='w-full' />
            </div>
            <div className='absolute w-20 h-20 bottom-18 right-10 md:w-auto md:h-auto md:bottom-18 md:right-16 lg:bottom-28 lg:right-70'>
                <img src={Hexagon} alt="Design Element" width={125} />
            </div>
            
            {children}

        </section>
    )
}

export default HeroSection