"use client"
import React from 'react'

type Props = {
  value?: 'monthly' | 'yearly'
  onChange?: (v: 'monthly' | 'yearly') => void
}

export default function ToggleBilling({ value = 'monthly', onChange }: Props) {
  const isMonthly = value === 'monthly'

  return (
    <div className="inline-flex items-center justify-center">
      <div
        role="switch"
        aria-checked={isMonthly}
        onClick={() => onChange?.(isMonthly ? 'yearly' : 'monthly')}
        className="relative cursor-pointer select-none"
      >
        <div className="w-58 h-14 rounded-full bg-accent flex items-center px-3">
          <div className={`w-24 h-9 rounded-full bg-white/20 transition-transform duration-200 ${isMonthly ? 'translate-x-0' : 'translate-x-[calc(100%_+_1.1rem)]'}`}></div>
          <div className="absolute inset-0 flex items-center justify-between px-8 text-white font-medium">
            <span className={` ${isMonthly ? 'opacity-100' : 'opacity-70'}`}>Monthly</span>
            <span className={`pr-0.5 ${!isMonthly ? 'opacity-100' : 'opacity-70'}`}>Yearly</span>
          </div>
        </div>
      </div>
    </div>
  )
}
