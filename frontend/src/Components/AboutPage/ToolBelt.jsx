import React from 'react'

function ToolBelt() {
    return (
        <section className='bg-white px-6 py-40 md:px-16 lg:px-32 md:py-24 flex flex-col md:flex-row items-center justify-center gap-10 lg:gap-20'>
            <div>
                <h2 className='font-heading text-2xl lg:text-3xl max-w-lg leading-relaxed lg:leading-14 text-center md:text-left'>
                    The <span className='text-accent'>toolbelt</span> was full, but the office was empty.
                </h2>
                <p className='font-intro mt-4 text-lg text-black/70 max-w-md text-center md:text-left'>
                    For decades, the field service industry has been underserved by
                    technology. Skilled tradespeople, the backbone of our infrastructure,
                    were forced to rely on scattered spreadsheets, sticky notes on
                    dashboards, and evenings lost to manual invoicing.
                </p>
                <p className='font-intro mt-4 text-lg text-black/70 max-w-md text-center md:text-left'>
                    We saw brilliant contractors losing jobs because they missed a call, or
                    waiting months for payments because an invoice was lost in a glovebox.
                </p>
                <p className='font-intro mt-4 text-lg text-black/70 max-w-md text-center md:text-left'>
                    We built <strong>Contractorz</strong> to bridge that gap. We believe that running a service
                    business shouldn't feel like a second full-time job.
                </p>
            </div>
            <div>

            </div>
        </section>
    )
}

export default ToolBelt