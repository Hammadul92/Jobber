import '../App.css'
import { FaArrowRight } from 'react-icons/fa6';
import { FaStar } from "react-icons/fa";
// Use public path for images in public directory
const MessageBubble = '/images/message-bubble.svg';
const HorizontalRectangle = '/images/rounded-horizontal-rectangle.svg';
const VerticalRectangle = '/images/rounded-vertical-rectangle.svg';
const Hexagon = '/images/hexagon.svg';
const DotsBg = '/images/dots-bg.svg';
const user = '/images/user.png';
import { useNavigate } from 'react-router-dom';

function Hero() {
    const navigate = useNavigate();

    return (
        <section className='relative bg-background overflow-hidden lg:min-h-screen md:h-[70vh] lg:h-screen w-full px-6 py-40 md:px-16 lg:px-32 md:py-24 flex flex-col items-center justify-center gap-3'>

            {/* Design Elements */}
            <div className='absolute md:bottom-10 lg:bottom-16 left-0'>
                <img src={HorizontalRectangle} alt="Design Element" />
            </div>
            <div className='absolute top-20 right-0 md:w-24 lg:w-fit'>
                <img src={VerticalRectangle} alt="Design Element" className='w-full' />
            </div>
            <div className='absolute md:bottom-18 md:right-16 lg:bottom-28 lg:right-70'>
                <img src={Hexagon} alt="Design Element" width={125} />
            </div>
            <div className='absolute z-0 md:top-40 lg:bottom-0 md:-left-10 lg:-left-20 md:rotate-90 lg:-rotate-[6.5deg]'>
                <img src={DotsBg} alt="Design Element" className='md:scale-[1.5] lg:scale-[1.2]' />
            </div>

            {/* Happy Clients Bubble */}
            <div className='z-1 md:mb-10 lg:mb-6 flex items-center gap-2 bg-accent/10 rounded-full px-5 py-2.5 border border-accent'>
                <div className=' flex items-center -space-x-3'>
                    <img
                        src={user} alt="User" width={40} height={40}
                        className='rounded-full overflow-hidden border border-background'
                    />
                    <img
                        src={user} alt="User" width={40} height={40}
                        className='rounded-full overflow-hidden border border-background'
                    />
                    <img
                        src={user} alt="User" width={40} height={40}
                        className='rounded-full overflow-hidden border border-background'
                    />
                    <img
                        src={user} alt="User" width={40} height={40}
                        className='rounded-full overflow-hidden border border-background'
                    />
                    <img
                        src={user} alt="User" width={40} height={40}
                        className='rounded-full overflow-hidden border border-background'
                    />
                </div>
                <div>
                    <div>
                        <FaStar className='inline-block mr-0.5 text-accent' size={16} />
                        <FaStar className='inline-block mr-0.5 text-accent' size={16} />
                        <FaStar className='inline-block mr-0.5 text-accent' size={16} />
                        <FaStar className='inline-block mr-0.5 text-accent' size={16} />
                        <FaStar className='inline-block mr-0.5 text-accent' size={16} />
                    </div>
                    <span className='text-black/60 text-sm'>115+ Happy Clients</span>
                </div>
            </div>

            {/* Main Heading and Subheading */}
            <div className='z-1 flex flex-col items-center gap-5 max-w-7xl mt-4'>
                {/* Main Heading */}
                <h1 className='font-heading md:text-4xl lg:text-[3.2rem] text-center leading-snug max-w-7xl'>
                    OPERATE YOUR BUSINESS WITH <span className='text-accent'>ASSURANCE </span>
                    AND <span className='text-accent'>CLARITY</span>.
                </h1>
                {/* Subheading */}
                <p className='text-center lg:px-28 text-2xl section-intro mt-2'>
                    Empower your HR team with our all-in-one SaaS platform, designed to streamline your entire hiring process from attracting top talent to seamless onboarding.
                </p>
            </div>

            {/* Button and Message Bubble */}
            <div className='relative z-1 mt-2'>
                <div className='absolute md:-top-6 lg:-top-3 md:-left-48 lg:-left-56'>
                    <img src={MessageBubble} alt="Description" />
                    <span className='absolute top-10.5 left-7 text-white font-medium'>Find Your Plan</span>
                </div>
                <button onClick={() => { navigate('/contact-us') }} className='primary min-w-sm mt-12'>
                    Get Free Consultation <FaArrowRight className='inline-block ml-2' size={22} />
                </button>
            </div>
        </section>
    )
}

export default Hero