"use client"

import React from 'react'
import FAQAccordian from '../ui/FAQAccordian'

const HorizontalRectangle = '/images/rounded-horizontal-rectangle-white.svg';
const VerticalRectangle = '/images/rounded-vertical-rectangle.svg';


const FAQ_ITEMS = [
  {
    question: "What is this platform used for?",
    answer:
      "It's an AI-powered design assistant that helps you generate, customize, and export creative assets in seconds—whether for personal projects, brand work, or commercial use.",
  },
  {
    question: "What happens if I hit my free generation limit?",
    answer:
      "When you reach your free limit you can upgrade to a paid plan to continue generating, or wait for your quota to reset depending on the plan rules.",
  },
  {
    question: "Do I need design experience to use it?",
    answer:
      "No — the assistant is designed for users of all levels and provides templates and one-click refinements.",
  },
  {
    question: "Can I collaborate with my team?",
    answer:
      "Yes — you can invite team members to projects and share access based on roles.",
  },
  {
    question: "Is it really free to use?",
    answer:
      "Yes! We offer a free tier with basic features and a limited number of generations. You can upgrade anytime for more advanced features.",
  },
]

function FAQSection() {
    return (
        <section className='relative w-full lg:min-h-screen px-6 py-12 md:px-16 lg:px-32 md:py-28 bg-secondary'>
            {/* Design Elements */}
            <div className='absolute w-40 bottom-7 md:w-44 lg:w-auto md:bottom-10 lg:bottom-16 left-0'>
                <img src={HorizontalRectangle} alt="Design Element" className='text-white' />
            </div>
            <div className='absolute w-14 top-20 right-0 md:w-20 lg:w-fit'>
                <img src={VerticalRectangle} alt="Design Element" className='w-full' />
            </div>

            {/* Content */}
            <div className='mb-10 md:mb-4 lg:mb-0' >
                <h2 className='font-heading text-xl md:text-2xl lg:text-3xl font-bold text-white text-center leading-relaxed lg:leading-12'>
                    Frequently Asked <br /> <span className='text-accent'>Questions</span>
                </h2>
                <p className='font-intro text-lg mt-3 text-center text-white/90'>
                    Got questions? We&apos;ve got answers.
                </p>
            </div>
            <FAQAccordian items={FAQ_ITEMS} />
        </section>
    )
}

export default FAQSection