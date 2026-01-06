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
        <div className='w-full px-32 py-8 bg-white text-center'>
            <span className='text-medium text-center mb-10'>
                Trusted by Over <b>100+</b> Trusted  Partners
            </span>
            <div className='mt-3 flex items-center justify-between gap-10'>
                {companies.map((company, index) => (
                    <div key={index} className='flex items-center justify-center p-5 gap-2'>
                        <img src={company.logo} alt={company.name} className='h-8 object-contain' />
                        <span className='font-heading text-sm'>{company.name}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default TrustedCompanies