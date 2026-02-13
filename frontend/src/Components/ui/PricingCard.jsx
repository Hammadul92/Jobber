import React from 'react'
import { IoCheckmarkCircle, IoCheckmarkCircleOutline } from "react-icons/io5";
import { IoIosArrowForward } from "react-icons/io";


export default function PricingCard({ plan, billing }) {
    const price = billing === 'monthly' ? plan.monthly : plan.yearly
    return (
        <div
            className={`flex h-full flex-col rounded-2xl px-14 py-8 md:px-6 md:py-4 lg:px-14 lg:py-8 shadow-md relative ${plan.featured ? 'md:scale-108 lg:scale-107 border-4 border-accent z-10' : ''}`}
            style={{ backgroundColor: 'var(--color-card)', borderColor: plan.featured ? 'var(--color-accent)' : 'transparent' }}
        >

            <h3 className={`font-Intro mb-4 ${plan.featured ? 'text-accent text-3xl font-bold' : 'text-white text-2xl font-bold'}`}>
                {plan.name}
            </h3>
            {plan.description && <p className="text-sm text-white/80 mb-6">{plan.description}</p>}

            <div className="mb-6">
                <div className="flex items-end lg:gap-3">
                    <div className="text-lg lg:text-4xl font-bold text-white">${price}</div>
                    <div className="text-sm text-white/80">/ {billing === 'monthly' ? 'month' : 'year'}</div>
                    {plan.discountPct && (
                        <div className="lg:ml-2 px-2 py-1 text-xs rounded-full bg-accent text-white">-{plan.discountPct}%</div>
                    )}
                </div>
            </div>

            <div className="mb-6 border-t-2 border-white/10 py-6">
                <h4 className="text-sm font-medium text-white/70 mb-3">What&apos;s included</h4>
                <ul className="space-y-2">
                    {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-3 mt-4 text-white/70">
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-black text-xs">
                                {plan.featured ? <IoCheckmarkCircle className='text-accent' size={20} /> : <IoCheckmarkCircleOutline className='text-white/70' size={20} />}
                            </span>
                            <span className="text-sm">{f}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="mt-auto pt-2 text-center">
                <button
                    className="cursor-pointer px-8 py-2.5 rounded-md bg-accent/20 border border-accent/50 text-white font-medium relative z-10 hover:scale-102 transition-all duration-200"
                    style={{ boxShadow: '0 0 58px 6px rgba(255,122,0,0.22)' }}
                >
                    Subscribe <IoIosArrowForward className="inline-block ml-2 mb-1" size={20} />
                </button>
            </div>
        </div>
    )
}
