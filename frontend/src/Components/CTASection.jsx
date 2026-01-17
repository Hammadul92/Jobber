import { FaArrowRight } from 'react-icons/fa6';
import { Link } from 'react-router-dom';

function CTASection() {
    return (
        <section className="w-full px-6 py-12 md:px-16 lg:px-32 md:py-28 rounded-3xl 
        flex flex-col items-center text-center gap-6">
            <div
                className='min-w-full lg:min-w-6xl bg-cover bg-no-repeat bg-center border-2 border-accent 
                rounded-3xl px-10 py-16 lg:py-28 flex flex-col items-center gap-8'
                style={{ backgroundImage: `url(/images/CTA-Gradient.svg)` }}
            >
                <h3 className='font-intro text-4xl lg:text-5xl font-bold text-cardLight'>Ready To Design Smarter?</h3>
                <p className='w-md md:w-lg max-w-lg text-black/80 font-medium md:text-lg'>
                    Whether you&apos;re a freelancer, a team, or a growing agency—our tools
                    adapt to your workflow. Design faster. Deliver better.
                </p>
                <Link to="/register" className='primary'>
                    Get Started <FaArrowRight className='ml-2 inline-block' size={22} />
                </Link>
            </div>
        </section>
    )
}

export default CTASection