import '../../App.css'
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
import HeroSection from '../ui/HeroSection';

function Hero() {
    const navigate = useNavigate();

    return (
        <HeroSection>
            {/* Design Elements */}
            <div className='absolute z-0 top-80 md:top-40 lg:bottom-0 md:-left-10 lg:-left-20 rotate-90 lg:-rotate-[6.5deg]'>
                <img src={DotsBg} alt="Design Element" className='scale-150 md:scale-[1.5] lg:scale-[1.2]' />
            </div>

            {/* Happy Clients Bubble */}
            <div className='z-1 md:mb-8 lg:mb-6 flex items-center gap-2 bg-accent/20 rounded-full px-3 py-1 md:px-5 md:py-2.5 border border-accent'>
                <div className=' flex items-center -space-x-3'>
                    <img
                        src={user} alt="User" width={40} height={40}
                        className='w-8 md:w-10 rounded-full overflow-hidden border border-background'
                    />
                    <img
                        src={user} alt="User" width={40} height={40}
                        className='w-8 md:w-10 rounded-full overflow-hidden border border-background'
                    />
                    <img
                        src={user} alt="User" width={40} height={40}
                        className='w-8 md:w-10 rounded-full overflow-hidden border border-background'
                    />
                    <img
                        src={user} alt="User" width={40} height={40}
                        className='w-8 md:w-10 rounded-full overflow-hidden border border-background'
                    />
                    <img
                        src={user} alt="User" width={40} height={40}
                        className='w-8 md:w-10 rounded-full overflow-hidden border border-background'
                    />
                </div>
                <div>
                    <div>
                        <FaStar className='w-3 md:w-4 inline-block mr-0.5 text-accent' size={16} />
                        <FaStar className='w-3 md:w-4 inline-block mr-0.5 text-accent' size={16} />
                        <FaStar className='w-3 md:w-4 inline-block mr-0.5 text-accent' size={16} />
                        <FaStar className='w-3 md:w-4 inline-block mr-0.5 text-accent' size={16} />
                        <FaStar className='w-3 md:w-4 inline-block mr-0.5 text-accent' size={16} />
                    </div>
                    <p className='text-black/60 text-[0.65rem] md:text-sm'>115+ Happy Clients</p>
                </div>
            </div>

            {/* Main Heading and Subheading */}
            <div className='z-1 flex flex-col items-center gap-5 md:max-w-7xl mt-4'>
                {/* Main Heading */}
                <h1 className='font-heading text-[1.7rem] md:text-4xl lg:text-[3.2rem] text-center leading-snug md:max-w-7xl'>
                    OPERATE YOUR BUSINESS WITH <span className='text-accent'>ASSURANCE </span>
                    AND <span className='text-accent'>CLARITY</span>.
                </h1>
                {/* Subheading */}
                <p className='text-center md:px-28 md:text-xl lg:text2xl section-intro md:mt-2'>
                    Empower your HR team with our all-in-one SaaS platform, designed to streamline your entire hiring process from attracting top talent to seamless onboarding.
                </p>
            </div>

            {/* Button and Message Bubble */}
            <div className='relative z-1 mt-4 md:mt-2'>
                <div className='absolute -top-6 -left-8 md:-top-6 lg:-top-3 md:-left-48 lg:-left-56'>
                    <img src={MessageBubble} alt="Description" className='w-36 md:w-auto' />
                </div>
                <button onClick={() => { navigate('/contact-us') }} className='primary md:min-w-sm mt-12'>
                    Get Free Consultation <FaArrowRight className='inline-block ml-2' size={22} />
                </button>
            </div>
        </HeroSection>
    )
}

export default Hero