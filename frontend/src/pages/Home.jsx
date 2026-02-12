import Hero from "../Components/HomePage/Hero";
import TrustedCompanies from "../Components/HomePage/TrustedCompanies";
import Testimonials from "../Components/HomePage/Testimonials";
import Services from "../Components/HomePage/ServicesSection";
import PricingPlans from "../Components/HomePage/PricingPlans";
import FAQSection from "../Components/HomePage/FAQSection";
import CTASection from "../Components/HomePage/CTASection";


export default function Home() {
  return (
    <main>
      <Hero />
      <TrustedCompanies />
      <Testimonials />
      <Services />
      <PricingPlans />
      <FAQSection />
      <CTASection />
    </main>
  );
}
