import React, { useState } from 'react'

function ChevronIcon({ open }) {
  return (
    <svg
      className={`w-5 h-5 transform transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FAQAccordian({ items, defaultOpenIndex = 0 }) {
  const [openIndex, setOpenIndex] = useState(defaultOpenIndex ?? null)

  return (
    <section
      className="w-full py-16 px-32"
    >
      <div className="max-w-4xl mx-auto">
        {items.map((item, idx) => {
          const isOpen = openIndex === idx
          return (
            <div key={idx} className="border-b border-[rgba(255,255,255,0.08)] py-6">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between text-left cursor-pointer"
              >
                <h3 className={`text-xl font-intro ${isOpen ? 'text-accent' : 'text-white'}`}>
                  {item.question}
                </h3>
                <span className="text-white/80">
                  <ChevronIcon open={isOpen} />
                </span>
              </button>

              <div
                className={`mt-4 overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out`}
                style={{
                  maxHeight: isOpen ? '500px' : '0px',
                  opacity: isOpen ? 1 : 0,
                }}
              >
                <p className="text-sm text-white/80">{item.answer}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default FAQAccordian