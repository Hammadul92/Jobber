import React from 'react'

function TrustedBy() {
    return (
        <section className="px-6 py-10 md:py-20 md:px-16 lg:px-0 bg-white border-b border-gray-200">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#101828] text-center mb-12">Trusted by landscaping professionals</h2>
            <div className="flex items-center justify-start flex-wrap lg:flex-nowrap overflow-hidden gap-5 lg:pl-32">
                {/* Card 1 */}
                <div className="w-full lg:min-w-4/11 bg-white rounded-2xl border border-[#e5eaf1] p-8 flex flex-col gap-4">
                    <div className="flex gap-1 md:mb-2">
                        {[...Array(5)].map((_, i) => (
                            <svg key={i} width="20" height="20" fill="#10b981" viewBox="0 0 20 20"><polygon points="10,1 12.59,7.36 19.51,7.64 14,12.14 15.82,18.99 10,15.27 4.18,18.99 6,12.14 0.49,7.64 7.41,7.36" /></svg>
                        ))}
                    </div>
                    <div className="text-primary text-lg md:text-xl font-medium">“Contractorz helped us cut admin time in half. Scheduling and invoicing are finally under control.”</div>
                    <div className="flex items-center gap-3 mt-4">
                        <span className="w-10 h-10 rounded-full bg-[#e5eaf1] flex items-center justify-center text-[#64748b] font-bold text-lg">BO</span>
                        <div>
                            <div className="font-semibold text-[#101828] text-sm md:text-base">Business Owner</div>
                            <div className="text-[#64748b] text-xs md:text-sm">Green Leaf Landscaping</div>
                        </div>
                    </div>
                </div>
                {/* Card 2 */}
                <div className="w-full lg:min-w-4/11 bg-white rounded-2xl border border-[#e5eaf1] p-8 flex flex-col gap-4">
                    <div className="flex gap-1 md:mb-2">
                        {[...Array(5)].map((_, i) => (
                            <svg key={i} width="20" height="20" fill="#10b981" viewBox="0 0 20 20"><polygon points="10,1 12.59,7.36 19.51,7.64 14,12.14 15.82,18.99 10,15.27 4.18,18.99 6,12.14 0.49,7.64 7.41,7.36" /></svg>
                        ))}
                    </div>
                    <div className="text-primary text-lg md:text-xl font-medium">“We look more professional, get paid faster, and our crews are always aligned. It's a game changer.”</div>
                    <div className="flex items-center gap-3 mt-4">
                        <span className="w-10 h-10 rounded-full bg-[#e5eaf1] flex items-center justify-center text-[#64748b] font-bold text-lg">LC</span>
                        <div>
                            <div className="font-semibold text-[#101828] text-sm md:text-base">Manager</div>
                            <div className="text-[#64748b] text-xs md:text-sm">Premier Lawn Care</div>
                        </div>
                    </div>
                </div>
                {/* Card 3 */}
                <div className="w-full lg:min-w-4/11 bg-white rounded-2xl border border-[#e5eaf1] p-8 flex flex-col gap-4">
                    <div className="flex gap-1 md:mb-2">
                        {[...Array(5)].map((_, i) => (
                            <svg key={i} width="20" height="20" fill="#10b981" viewBox="0 0 20 20"><polygon points="10,1 12.59,7.36 19.51,7.64 14,12.14 15.82,18.99 10,15.27 4.18,18.99 6,12.14 0.49,7.64 7.41,7.36" /></svg>
                        ))}
                    </div>
                    <div className="text-primary text-lg md:text-xl font-medium">“We look more professional, get paid faster, and our crews are always aligned. It's a game changer.”</div>
                    <div className="flex items-center gap-3 mt-4">
                        <span className="w-10 h-10 rounded-full bg-[#e5eaf1] flex items-center justify-center text-[#64748b] font-bold text-lg">LC</span>
                        <div>
                            <div className="font-semibold text-[#101828] text-sm md:text-base">Manager</div>
                            <div className="text-[#64748b] text-xs md:text-sm">Premier Lawn Care</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex flex-row-reverse items-center flex-wrap lg:flex-nowrap justify-start gap-5 mt-5 lg:pr-32">
                {/* Card 6 */}
                <div className="w-full lg:min-w-4/11 bg-white rounded-2xl border border-[#e5eaf1] p-8 flex flex-col gap-4">
                    <div className="flex gap-1 md:mb-2">
                        {[...Array(5)].map((_, i) => (
                            <svg key={i} width="20" height="20" fill="#10b981" viewBox="0 0 20 20"><polygon points="10,1 12.59,7.36 19.51,7.64 14,12.14 15.82,18.99 10,15.27 4.18,18.99 6,12.14 0.49,7.64 7.41,7.36" /></svg>
                        ))}
                    </div>
                    <div className="text-primary text-lg md:text-xl font-medium">“Contractorz helped us cut admin time in half. Scheduling and invoicing are finally under control.”</div>
                    <div className="flex items-center gap-3 mt-4">
                        <span className="w-10 h-10 rounded-full bg-[#e5eaf1] flex items-center justify-center text-[#64748b] font-bold text-lg">BO</span>
                        <div>
                            <div className="font-semibold text-[#101828] text-sm md:text-base">Business Owner</div>
                            <div className="text-[#64748b] text-xs md:text-sm">Green Leaf Landscaping</div>
                        </div>
                    </div>
                </div>
                {/* Card 5 */}
                <div className="w-full lg:min-w-4/11 bg-white rounded-2xl border border-[#e5eaf1] p-8 flex flex-col gap-4">
                    <div className="flex gap-1 md:mb-2">
                        {[...Array(5)].map((_, i) => (
                            <svg key={i} width="20" height="20" fill="#10b981" viewBox="0 0 20 20"><polygon points="10,1 12.59,7.36 19.51,7.64 14,12.14 15.82,18.99 10,15.27 4.18,18.99 6,12.14 0.49,7.64 7.41,7.36" /></svg>
                        ))}
                    </div>
                    <div className="text-primary text-lg md:text-xl font-medium">“Contractorz helped us cut admin time in half. Scheduling and invoicing are finally under control.”</div>
                    <div className="flex items-center gap-3 mt-4">
                        <span className="w-10 h-10 rounded-full bg-[#e5eaf1] flex items-center justify-center text-[#64748b] font-bold text-lg">BO</span>
                        <div>
                            <div className="font-semibold text-[#101828] text-sm md:text-base">Business Owner</div>
                            <div className="text-[#64748b] text-xs md:text-sm">Green Leaf Landscaping</div>
                        </div>
                    </div>
                </div>
                {/* Card 4 */}
                <div className="w-full lg:min-w-4/11 bg-white rounded-2xl border border-[#e5eaf1] p-8 flex flex-col gap-4 lg:opacity-40">
                    <div className="flex gap-1 md:mb-2">
                        {[...Array(5)].map((_, i) => (
                            <svg key={i} width="20" height="20" fill="#10b981" viewBox="0 0 20 20"><polygon points="10,1 12.59,7.36 19.51,7.64 14,12.14 15.82,18.99 10,15.27 4.18,18.99 6,12.14 0.49,7.64 7.41,7.36" /></svg>
                        ))}
                    </div>
                    <div className="text-primary text-lg md:text-xl font-medium">“Contractorz helped us cut admin time in half. Scheduling and invoicing are finally under control.”</div>
                    <div className="flex items-center gap-3 mt-4">
                        <span className="w-10 h-10 rounded-full bg-[#e5eaf1] flex items-center justify-center text-[#64748b] font-bold text-lg">BO</span>
                        <div>
                            <div className="font-semibold text-[#101828] text-sm md:text-base">Business Owner</div>
                            <div className="text-[#64748b] text-xs md:text-sm">Green Leaf Landscaping</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default TrustedBy