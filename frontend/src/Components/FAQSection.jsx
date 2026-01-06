"use client"

import React from 'react'
import FAQAccordian from './ui/FAQAccordian'


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
        <section className='w-full min-h-screen px-32 py-28 bg-secondary'>
            <div>
                <h2 className='font-heading text-3xl font-bold text-white text-center leading-12'>
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