import React from 'react'
import "../App.css"
import AboutHero from '../Components/AboutPage/AboutHero'
import ToolBelt from '../Components/AboutPage/ToolBelt'
import Features from '../Components/AboutPage/Features'
import Stats from '../Components/AboutPage/Stats'
import Team from '../Components/AboutPage/Team'
import CTASection from '../Components/CTASection'

function About() {
    return (
        <main>
            <AboutHero />
            <ToolBelt />
            <Features />
            <Stats />
            <Team />
            <CTASection />
        </main>
    )
}

export default About