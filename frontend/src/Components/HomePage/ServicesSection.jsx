import React from 'react'
import { FiChevronRight } from 'react-icons/fi'
import {
  LuFan,
  LuBug,
  LuHouse,
  LuWrench,
  LuWifi,
  LuDroplet,
  LuZap,
  LuPaintRoller,
  LuFlower2,
  LuPackageOpen,
  LuHammer
} from "react-icons/lu";
import { BsStars } from "react-icons/bs";

const services = [
  {
    title: 'Plumbing',
    subtitle: 'Leaks, pipes & installs',
    icon: LuDroplet,
  },
  {
    title: 'Electrical',
    subtitle: 'Wiring, lighting & safety',
    icon: LuZap,
  },
  {
    title: 'Heating & Cooling',
    subtitle: 'AC repair & maintenance',
    icon: LuFan,
  },
  {
    title: 'House Cleaning',
    subtitle: 'Deep clean & recurring',
    icon: BsStars,
    badge: 'Popular',
  },
  {
    title: 'Roofing',
    subtitle: 'Inspection & repairs',
    icon: LuHouse,
  },
  {
    title: 'Landscaping',
    subtitle: 'Lawn care & design',
    icon: LuFlower2,
  },
  {
    title: 'Painting',
    subtitle: 'Interior & exterior',
    icon: LuPaintRoller,
  },
  {
    title: 'Smart Home',
    subtitle: 'Security & automation',
    icon: LuWifi,
  },
  {
    title: 'Moving',
    subtitle: 'Packing & transport',
    icon: LuPackageOpen,
  },
  {
    title: 'Renovations',
    subtitle: 'Kitchen & bath',
    icon: LuHammer,
  },
  {
    title: 'Pest Control',
    subtitle: 'Extermination & prevention',
    icon: LuBug,
  },
  {
    title: 'Handyman',
    subtitle: 'General repairs',
    icon: LuWrench,
  },
]

const iconStyles = 'h-5 w-5 text-slate-600'

function Services() {
  return (
    <section
      className='w-full px-6 py-12 md:px-16 lg:px-32 md:py-20 bg-cover bg-center min-h-[50dvh] lg:min-h-screen'
      style={{ backgroundImage: `url(/images/industries-section-bg.png)` }}
    >
      <div className='max-w-6xl'>
        <h2 className='font-heading text-2xl md:text-2xl lg:text-3xl max-w-2xl lg:pr-60 font-bold leading-relaxed lg:leading-[1.6] text-white'>
          Supporting home service businesses across <span className='text-accent'>50+ industries</span>.
        </h2>
        <div className='mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
          {services.map((service) => (
            <div
              key={service.title}
              className='relative rounded-2xl bg-white px-6 py-6 shadow-xl shadow-slate-900/10'
            >
              {service.badge ? (
                <span className='absolute right-4 top-4 rounded-full bg-teal-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-teal-700'>
                  {service.badge}
                </span>
              ) : null}
              <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50'>
                <service.icon className={iconStyles} />
              </div>
              <h3 className='mt-4 text-base font-semibold text-slate-900'>{service.title}</h3>
              <p className='mt-1 text-sm text-slate-500'>{service.subtitle}</p>
            </div>
          ))}
        </div>
        <div className='mt-20 flex flex-col items-center gap-3'>
          <button className='rounded-full bg-accent px-8 py-3 font-semibold text-white shadow-lg shadow-orange-500/30'>
            Explore all 50+ services <FiChevronRight className='ml-1 inline-flex h-6 w-6' />
          </button>
          <span className='text-xs text-slate-200'>Trusted by over 100,000 homeowners</span>
        </div>
      </div>
    </section>
  )
}

export default Services