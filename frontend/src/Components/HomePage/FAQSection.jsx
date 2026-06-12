"use client";

import React from "react";
import FAQAccordian from "../ui/FAQAccordian";
import { useFetchFaqsQuery } from "../../store";

const HorizontalRectangle = "/images/rounded-horizontal-rectangle-white.svg";
const VerticalRectangle = "/images/rounded-vertical-rectangle.svg";

function FAQSection() {
  const { data: faqItems = [], isLoading, isError } = useFetchFaqsQuery();

  return (
    <section className="relative w-full lg:min-h-screen px-6 py-12 md:px-16 lg:px-32 md:py-28 bg-secondary">
      {/* Design Elements */}
      <div className="absolute w-40 bottom-7 md:w-44 lg:w-auto md:bottom-10 lg:bottom-16 left-0">
        <img
          src={HorizontalRectangle}
          alt="Design Element"
          className="text-white"
        />
      </div>
      <div className="absolute w-14 top-20 right-0 md:w-20 lg:w-fit">
        <img src={VerticalRectangle} alt="Design Element" className="w-full" />
      </div>

      {/* Content */}
      <div className="mb-10 md:mb-4 lg:mb-0">
        <h2 className="font-heading text-xl md:text-2xl lg:text-3xl font-bold text-white text-center leading-relaxed lg:leading-12">
          Frequently Asked <br /> <span className="text-accent">Questions</span>
        </h2>
        <p className="font-intro text-lg mt-3 text-center text-white/90">
          Got questions? We&apos;ve got answers.
        </p>
      </div>

      {isLoading ? (
        <div className="z-20 w-full px-6 md:px-16 lg:px-32">
          <div className="mx-auto max-w-4xl py-6 text-center text-white/80">
            Loading FAQs...
          </div>
        </div>
      ) : isError ? (
        <div className="z-20 w-full px-6 md:px-16 lg:px-32">
          <div className="mx-auto max-w-4xl py-6 text-center text-white/80">
            We couldn&apos;t load the FAQs right now.
          </div>
        </div>
      ) : faqItems.length ? (
        <FAQAccordian items={faqItems} />
      ) : (
        <div className="z-20 w-full px-6 md:px-16 lg:px-32">
          <div className="mx-auto max-w-4xl py-6 text-center text-white/80">
            No FAQs available yet.
          </div>
        </div>
      )}
    </section>
  );
}

export default FAQSection;
