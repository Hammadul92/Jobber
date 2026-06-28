import React, { useMemo } from "react";
import { useFetchBusinessMarqueeLogosQuery } from "../../store";

const fallbackCompanies = [
  { logo: "/images/company1.png", name: "LogoIpsum" },
  { logo: "/images/company2.png", name: "LogoIpsum" },
  { logo: "/images/company3.png", name: "LogoIpsum" },
  { logo: "/images/company1.png", name: "LogoIpsum" },
  { logo: "/images/company2.png", name: "LogoIpsum" },
  { logo: "/images/company3.png", name: "LogoIpsum" },
];

function TrustedCompanies() {
  const { data: businessLogos = [] } = useFetchBusinessMarqueeLogosQuery();

  const companies = useMemo(() => {
    const dynamicCompanies = Array.isArray(businessLogos)
      ? businessLogos
          .filter((business) => business?.logo)
          .slice(0, 10)
          .map((business) => ({
            logo: business.logo,
            name: business.name || "Contractorz Business",
          }))
      : [];

    const baseCompanies =
      dynamicCompanies.length > 0
        ? dynamicCompanies
        : fallbackCompanies.map((company, index) => ({
            ...company,
            key: `fallback-${index}`,
          }));

    const minimumItemsForFullMarquee = 12;

    if (baseCompanies.length >= minimumItemsForFullMarquee) {
      return baseCompanies;
    }

    const repeatedCompanies = [];
    for (let index = 0; index < minimumItemsForFullMarquee; index += 1) {
      const company = baseCompanies[index % baseCompanies.length];
      repeatedCompanies.push({
        ...company,
        key: `${company.key || company.name}-${index}`,
      });
    }

    return repeatedCompanies;
  }, [businessLogos]);

  const marqueeCompanies = [...companies, ...companies];

  return (
    <div className="w-full px-6 md:px-0 py-8 bg-white text-center">
      <span className="font-medium text-center text-lg mb-10">
        Trusted by Over <b>100+</b> Trusted Partners
      </span>
      <div className="marquee-wrapper mt-6 lg:mt-3">
        <div className="marquee-track gap-10 md:gap-14 lg:gap-20">
          {marqueeCompanies.map((company, index) => (
            <div
              key={`${company.key || company.name}-${index}`}
              className="flex items-center justify-center gap-2 px-5"
            >
              <img
                src={company.logo}
                alt={company.name}
                className="h-8 w-auto max-w-[140px] object-contain md:max-w-[160px]"
              />
              <span className="font-heading text-sm">{company.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TrustedCompanies;
