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
        <section className='relative bg-background overflow-hidden h-screen w-full px-32 py-24 flex flex-col items-center justify-center gap-3'>

            {/* Design Elements */}
            <div className='absolute bottom-16 left-0'>
                <img src={HorizontalRectangle} alt="Design Element" />
            </div>
            <div className='absolute top-20 right-0'>
                <img src={VerticalRectangle} alt="Design Element" />
            </div>
            <div className='absolute bottom-28 right-70'>
                <img src={Hexagon} alt="Design Element" width={125} />
            </div>
            <div className='absolute z-0 bottom-0 -left-10 -rotate-[6.5deg]'>
                <img src={DotsBg} alt="Design Element" />
            </div>

            {/* Happy Clients Bubble */}
            <div className='flex items-center gap-2 bg-accent/10 rounded-full px-5 py-2.5 border border-accent'>
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
            <div className='flex flex-col items-center gap-1 max-w-7xl mt-4'>
                {/* Main Heading */}
                <h1 className='font-heading text-[3.2rem] text-center leading-snug max-w-7xl'>
                    OPERATE YOUR BUSINESS WITH <span className='text-accent'>ASSURANCE </span>
                    AND <span className='text-accent'>CLARITY</span>.
                </h1>
                {/* Subheading */}
                <p className='text-center max-w-5xl text-2xl section-intro mt-2'>
                    Empower your HR team with our all-in-one SaaS platform, designed to streamline your entire hiring process from attracting top talent to seamless onboarding.
                </p>
            </div>
            {/* Button and Message Bubble */}
            <div className='relative  mt-2'>
                <div className='absolute -top-3 -left-56'>
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