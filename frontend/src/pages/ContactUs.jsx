import React from 'react'
import ContactHero from '../Components/ContactPage/ContactHero.jsx'
import QuickActions from '../Components/ContactPage/QuickActions.jsx'
import ContactForm from '../Components/ContactPage/ContactForm.jsx'
import FAQSection from '../components/HomePage/FAQSection'
import CTASection from '../components/CTASection'

function ContactUs() {
    return (
        <main>
            <ContactHero />
            <QuickActions />
            <ContactForm />
            <FAQSection />
            <CTASection />
        </main>
    )
}

export default ContactUs