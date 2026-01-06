import React from 'react'

interface Props {
    title: string;
    content: string;
    userName: string;
    userRole: string;
    userImage: string;
    light?: false | true;
}

function TestimonialCard({ title, content, userName, userRole, userImage, light }: Props) {
    return (
        <div className={`${!light ? 'bg-card' : 'bg-cardLight'} p-6 rounded-3xl shadow-md`}>
            {/* Testimonial Card Content */}
            <h3 className='font-sans text-2xl mb-4 text-white'>{title}</h3>
            <p className='text-sm mb-6 text-muted'>{content}</p>
            {/* User Info */}
            <div className='flex items-center gap-4'>
                <img src={userImage} alt={userName} className='w-12 h-12 rounded-full object-cover' />
                <div>
                    <p className='font-bold text-muted'>{userName}</p>
                    <p className='text-3xs text-muted'>{userRole}</p>
                </div>
            </div>
        </div>
    )
}

export default TestimonialCard