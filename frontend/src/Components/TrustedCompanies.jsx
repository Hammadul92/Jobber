import React from 'react'

const companies = [
    { logo: "/images/company1.png", name: 'LogoIpsum' },
    { logo: "/images/company2.png", name: 'LogoIpsum' },
    { logo: "/images/company3.png", name: 'LogoIpsum' },
    { logo: "/images/company1.png", name: 'LogoIpsum' },
    { logo: "/images/company2.png", name: 'LogoIpsum' },
    { logo: "/images/company3.png", name: 'LogoIpsum' },
]

const marqueeCompanies = [...companies, ...companies]

function TrustedCompanies() {
    return (
        <div className='w-full px-6 md:px-0 py-8 bg-white text-center'>
            <span className='font-medium text-center text-lg mb-10'>
                Trusted by Over <b>100+</b> Trusted  Partners
            </span>
            <div className='marquee-wrapper mt-6 lg:mt-3'>
                <div className='marquee-track'>
                    {marqueeCompanies.map((company, index) => (
                        <div key={`${company.name}-${index}`} className='flex items-center justify-center px-5 gap-2'>
                            <img src={company.logo} alt={company.name} className='h-8 object-contain' />
                            <span className='font-heading text-sm'>{company.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default TrustedCompanies