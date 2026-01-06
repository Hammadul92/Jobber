import React from 'react'
import Image from 'next/image'
import contractorzLogo from '@/public/contractorz-logo-horizontal.svg'

function Header() {
    return (
        <>
            <header className='flex items-center bg-background justify-between px-32 pt-8 w-full absolute top-0 left-0 z-[2]'>
                <div>
                    <Image src={contractorzLogo} alt="Logo" width={160} height={0} />
                </div>
                <nav className='flex items-center gap-10 font-medium'>
                    <a href="#">Home</a>
                    <a href="#">About</a>
                    <a href="#">Product</a>
                    <a href="#">Industries</a>
                    <a href="#">Resources</a>
                    <a href="#">Prices</a>
                </nav>
                <button className='primary'>
                    Login
                </button>
            </header>
        </>
    )
}

export default Header