import React from "react";
import IndustriesHero from "../Components/IndustriesPage/IndustriesHero.jsx";
import LandscapingStruggle from "../Components/IndustriesPage/LandscapingStruggle.jsx";
import Benefits from "../Components/IndustriesPage/Benefits.jsx";
import LandscapingFeatures from "../Components/IndustriesPage/LandscapingFeatures.jsx";
import JobFlow from "../Components/IndustriesPage/JobFlow.jsx";
import TrustedBy from "../Components/IndustriesPage/TrustedBy.jsx";
import WhyUs from "../Components/IndustriesPage/WhyUs.jsx";
import FAQSection from "../Components/HomePage/FAQSection.jsx";
import CTASection from "../Components/CTASection.jsx";
const AbstractImage = "/images/abstract-industries-image.png";

function Industries() {
  return (
    <main>
      <IndustriesHero />
      <div className="relative w-full px-6 md:px-16 lg:px-32">
        <img
          src={AbstractImage}
          alt="Abstract Industries Image"
          className="w-full h-full object-cover"
        />
      </div>
      <LandscapingStruggle />
      <Benefits />
      <LandscapingFeatures />
      <JobFlow />
      <TrustedBy />
      <WhyUs />
      <FAQSection />
      <CTASection />
    </main>
  );
}

export default Industries;
