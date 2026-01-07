import Hero from "../Components/Hero";
import TrustedCompanies from "../Components/TrustedCompanies";
import Testimonials from "../Components/Testimonials";
import Industries from "../Components/IndustriesSection";
import PricingPlans from "../Components/PricingPlans";
import FAQSection from "../Components/FAQSection";
import CTASection from "../Components/CTASection";


export default function Home() {
  return (
    <>
      <Hero />
      <TrustedCompanies />
      <Testimonials />
      <Industries />
      <PricingPlans />
      <FAQSection />
      <CTASection />
    </>
  );
}
