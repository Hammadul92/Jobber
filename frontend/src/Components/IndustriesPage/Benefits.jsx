import React from 'react'

function Benefits() {
  return (
    <section className="px-6 py-10 md:py-20 md:px-16 lg:px-32 bg-background">
      <h2 className="text-2xl lg:text-3xl font-extrabold text-primary md:mb-2">The real benefits for your team</h2>
      <p className="text-gray-500 md:text-lg mb-10">Simplify operations so you can focus on the field.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
        {/* Card 1 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-8 flex flex-col gap-3">
          <div className="bg-background w-12 h-12 flex items-center justify-center rounded-lg mb-2">
            {/* Clock Icon */}
            <svg width="28" height="28" fill="none" stroke="#101828" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
          </div>
          <div className=" text-xl text-[#101828]">Save Hours Every Week</div>
          <div className="text-gray-500 text-base">Automate quoting, scheduling, and invoicing so admin work doesn’t eat your evenings.</div>
        </div>
        {/* Card 2 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-8 flex flex-col gap-3">
          <div className="bg-background w-12 h-12 flex items-center justify-center rounded-lg mb-2">
            {/* Calendar Icon */}
            <svg width="28" height="28" fill="none" stroke="#101828" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 9h18"/></svg>
          </div>
          <div className=" text-xl text-[#101828]">Never Miss a Job</div>
          <div className="text-gray-500 text-base">Clear schedules and job details keep crews aligned and customers informed.</div>
        </div>
        {/* Card 3 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-8 flex flex-col gap-3">
          <div className="bg-background w-12 h-12 flex items-center justify-center rounded-lg mb-2">
            {/* Wallet Icon */}
            <svg width="28" height="28" fill="none" stroke="#101828" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 3h-8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"/><circle cx="16.5" cy="15.5" r="1.5"/></svg>
          </div>
          <div className=" text-xl text-[#101828]">Get Paid Faster</div>
          <div className="text-gray-500 text-base">Send invoices instantly and accept online payments without follow-ups.</div>
        </div>
        {/* Card 4 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-8 flex flex-col gap-3">
          <div className="bg-background w-12 h-12 flex items-center justify-center rounded-lg mb-2">
            {/* Check Icon */}
            <svg width="28" height="28" fill="none" stroke="#101828" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 12l3 3 5-5"/></svg>
          </div>
          <div className=" text-xl text-[#101828]">Look More Professional</div>
          <div className="text-gray-500 text-base">Branded quotes, invoices, and client communication build trust from day one.</div>
        </div>
        {/* Card 5 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-8 flex flex-col gap-3">
          <div className="bg-background w-12 h-12 flex items-center justify-center rounded-lg mb-2">
            {/* Growth Icon */}
            <svg width="28" height="28" fill="none" stroke="#101828" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 16v-4m4 4v-7m4 7v-2"/></svg>
          </div>
          <div className=" text-xl text-[#101828]">Run a Scalable Business</div>
          <div className="text-gray-500 text-base">Whether you have one crew or ten, Contractorz grows with you.</div>
        </div>
      </div>
    </section>
  )
}

export default Benefits