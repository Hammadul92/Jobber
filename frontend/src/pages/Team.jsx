import React from 'react'
import CTASection from '../Components/CTASection.jsx';

const teamMembers = [
    {
        name: 'Alex Carter',
        role: 'Founder & CEO',
        image: '../../public/images/user.png',
    },
    {
        name: 'Priya Desai',
        role: 'Chief Technology Officer',
        image: '../../public/images/user.png',
    },
    {
        name: 'Jordan Lee',
        role: 'Head of Product',
        image: '../../public/images/user.png    ',
    },
    {
        name: 'Taylor Nguyen',
        role: 'Design Lead',
        image: '../../public/images/user.png',
    },
    {
        name: 'Morgan Silva',
        role: 'Customer Success Manager',
        image: '../../public/images/user.png',
    },
    {
        name: 'Samir Khan',
        role: 'Engineering Manager',
        image: '../../public/images/user.png',
    },
];

function Team() {
    return (
        <>
            <section className="px-32 pt-40">
                <div className="text-center max-w-4xl mx-auto">
                    <p className="uppercase text-5xl font-heading text-accent">Our Team</p>
                    <h1 className="font-heading text-3xl mt-4 text-secondary">
                        Builders, Thinkers, Doers.
                    </h1>
                    <p className="mt-4 text-lg text-gray-600">
                        A multidisciplinary crew crafting reliable products and remarkable service experiences for our clients.
                    </p>
                </div>

                <div className="grid gap-8 sm:gap-10 mt-12 sm:mt-16 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {teamMembers.map((member) => (
                        <article
                            key={member.name}
                            className="rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow duration-200 overflow-hidden border border-gray-100"
                        >
                            <div className="aspect-[4/5] bg-gray-100 overflow-hidden">
                                <img
                                    src={member.image}
                                    alt={`${member.name} - ${member.role}`}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                            <div className="p-6 flex flex-col gap-2">
                                <h3 className="text-xl font-semibold text-secondary">{member.name}</h3>
                                <p className="text-accent font-medium">{member.role}</p>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Passionate about building human-first solutions, mentoring teams, and delivering reliable outcomes.
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <CTASection />
        </>
    )
}

export default Team
