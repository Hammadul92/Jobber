import React from 'react'
import TestimonialCard from './ui/TestimonialCard'

const testimonial = {
    title: "Amazing Tool! Saved me months",
    content: "Contractorz transformed our hiring process. The platform is intuitive and has saved us countless hours.",
    userName: "Ali Ahsan",
    userRole: "Director, ABC.com",
    userImage: '../../public/images/user.png',
}

function Testimonials() {
    return (
        <section className="w-full py-28 px-32">
            {/* Header Content */}
            <div>
                <div className='flex items-end justify-between gap-5 mb-3'>
                    <div className='pb-12'>
                        <h2 className='font-heading text-3xl max-w-3xl leading-14'>
                            HERE&apos;S WHAT OUR <span className='text-accent'>CUSTOMERS</span> HAVE TO SAY
                        </h2>
                    </div>
                    <div className='flex items-end justify-start gap-4 max-w-sm'>
                        <img src='../../public/images/linesflower.svg' alt="Customer testimonial" width={70} height={70} />
                        <p className='text-3xs leading-tight'>
                            [short description goes in here] lorem ipsum is a placeholder text to demonstrate.
                        </p>
                    </div>
                </div>
                <button className="secondary">Read Customer&apos; Stories</button>
            </div>
            {/* Testimonials Cards */}
            <div className='grid grid-cols-2 gap-4 mt-8'>
                <TestimonialCard
                    title={testimonial.title}
                    content={testimonial.content}
                    userName={testimonial.userName}
                    userRole={testimonial.userRole}
                    userImage={testimonial.userImage}
                    light={true}
                />
                <TestimonialCard
                    title={testimonial.title}
                    content={testimonial.content}
                    userName={testimonial.userName}
                    userRole={testimonial.userRole}
                    userImage={testimonial.userImage}
                />
                <TestimonialCard
                    title={testimonial.title}
                    content={testimonial.content}
                    userName={testimonial.userName}
                    userRole={testimonial.userRole}
                    userImage={testimonial.userImage}
                />
                <TestimonialCard
                    title={testimonial.title}
                    content={testimonial.content}
                    userName={testimonial.userName}
                    userRole={testimonial.userRole}
                    userImage={testimonial.userImage}
                    light={true}
                />
            </div>
        </section>
    )
}

export default Testimonials