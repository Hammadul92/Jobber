import React from 'react'

const companies = [
    { logo: "../../public/images/company1.png", name: 'LogoIpsum', },
    { logo: "../../public/images/company2.png", name: 'LogoIpsum', },
    { logo: "../../public/images/company3.png", name: 'LogoIpsum', },
    { logo: "../../public/images/company1.png", name: 'LogoIpsum', },
    { logo: "../../public/images/company2.png", name: 'LogoIpsum', },
    { logo: "../../public/images/company3.png", name: 'LogoIpsum', },
]

function TrustedCompanies() {
    return (
        <div className='w-full px-6 md:px-16 lg:px-32 py-8 bg-white text-center'>
            <span className='font-medium text-center text-lg mb-10'>
                Trusted by Over <b>100+</b> Trusted  Partners
            </span>
            <div className='md:mt-6 lg:mt-3 flex flex-wrap lg:flex-nowrap items-center justify-between gap-5 lg:gap-10'>
                {companies.map((company, index) => (
                    <div key={index} className='flex items-center justify-center px-5 gap-2'>
                        <img src={company.logo} alt={company.name} className='h-8 object-contain' />
                        <span className='font-heading text-sm'>{company.name}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default TrustedCompanies