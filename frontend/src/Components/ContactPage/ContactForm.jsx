import React from "react";
import Contact from "../../forms/Contact";
import { LuWaves, LuLeafyGreen } from "react-icons/lu";
import { TbBolt } from "react-icons/tb";

function ContactForm() {
  return (
    <section className="px-6 py-20 md:px-16 lg:px-32 md:py-24 bg-background">
      <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 max-w-7xl mx-auto">
        {/* Left: Steps and Testimonial */}
        <div className="flex-1 flex flex-col gap-10 justify-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold mb-8">
              What happens after you reach out?
            </h2>
            <ol className="space-y-7">
              <li className="flex items-start gap-4">
                <span className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white text-lg font-medium text-gray-500">
                  1
                </span>
                <div>
                  <div className="font-semibold">We analyze your needs</div>
                  <div className="text-gray-600 text-sm">
                    A real human reviews your business details to match you with
                    the right specialist.
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white text-lg font-medium text-gray-500">
                  2
                </span>
                <div>
                  <div className="font-semibold">Personalized response</div>
                  <div className="text-gray-600 text-sm">
                    You'll get a personal email or call (your choice) within
                    business hours. No automated fluff.
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white text-lg font-medium text-gray-500">
                  3
                </span>
                <div>
                  <div className="font-semibold">Actionable Plan</div>
                  <div className="text-gray-600 text-sm">
                    We'll offer a tailored demo or answer your specific
                    questions directly.
                  </div>
                </div>
              </li>
            </ol>
          </div>
          <div className="lg:mt-32">
            <div className="text-xs text-gray-400 tracking-widest mb-3">
              TRUSTED BY 4,500+ PROS
            </div>
            <div className="flex items-center gap-4 md:gap-6 mb-6">
              <span className="flex flex-col md:flex-row items-start md:items-center gap-1 text-gray-400 font-medium">
                <TbBolt className="w-5 h-5" /> POWERPRO
              </span>
              <span className="flex flex-col md:flex-row items-start md:items-center gap-1 text-gray-400 font-medium">
                <LuWaves className="w-4 h-4" /> FLOWMASTER
              </span>
              <span className="flex flex-col md:flex-row items-start md:items-center gap-1 text-gray-400 font-medium">
                <LuLeafyGreen className="w-4 h-4" /> GREENSKEEP
              </span>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md">
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">
                    ★
                  </span>
                ))}
              </div>
              <blockquote className="text-gray-700 italic mb-2">
                "Finally, software that doesn't feel like homework. Support
                actually answers the phone."
              </blockquote>
              <div className="text-xs text-gray-500">— Mike R., HVAC Owner</div>
            </div>
          </div>
        </div>
        {/* Right: Contact Form */}
        <div className="flex-1">
          <Contact />
        </div>
      </div>
    </section>
  );
}

export default ContactForm;
