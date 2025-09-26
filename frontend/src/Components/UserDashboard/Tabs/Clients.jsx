import React from 'react'

function Clients() {
  return (
    <>
        <section>
            {/* Header with Add Client Button */}
            <div className='d-flex justify-content-between align-items-center mb-4'>
                <h1>Clients</h1>
                <button className='btn bg-accent text-white'>Add Client</button>
            </div>

            {/* Clients List in custom Table */}
            <div className='table-responsive'>
                {/* Table Head */}
                <div id="tHead" className="border-bottom px-2">
                    {/* Table Row */}
                    <div className="tr d-flex justify-content-between align-items-center">
                        <h5 className="th">Client Name</h5>
                        <h5 className="th">Email</h5>
                        <h5 className="th">Phone</h5>
                        <h5 className="th">Company</h5>
                        <h5 className="th">Actions</h5>
                    </div>
                </div>
                {/* Table Body */}
                <div id="tBody" className='overflow-scroll scrollbar-hidden' style={{maxHeight: '72vh'}}>
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className="tr p-2 d-flex justify-content-between align-items-center cursor-pointer" style={i % 2 === 0 ? { backgroundColor: 'rgba(25, 135, 84, 0.05)' } : {}}>
                            {/* Column 1 - Client Name */}
                            <div className="td">Client {i + 1}</div>
                            {/* Column 2 - Email */}
                            <div className="td">client{i + 1}@example.com</div>
                            {/* Column 3 - Phone */}
                            <div className="td">123-456-7890</div>
                            {/* Column 4 - Company */}
                            <div className="td">Company A</div>
                            {/* Column 5 - Actions */}
                            <div className="td">
                                <button className='btn btn-sm bg-accent text-white'>Edit</button>
                                <button className='btn btn-sm btn-outline-danger ms-lg-2'>Delete</button>
                            </div>
                        </div>
                    ))}
                    {/* Table Row */}
                    <div className="tr py-2 d-flex justify-content-between align-items-center">
                        {/* Colom 1 - Client Name */}
                        <div className="td">Client 1</div>
                        {/* Colom 2 - Email */}
                        <div className="td">client1@example.com</div>
                        {/* Colom 3 - Phone */}
                        <div className="td">123-456-7890</div>
                        {/* Colom 4 - Company */}
                        <div className="td">Company A</div>
                        {/* Colom 5 - Actions */}
                        <div className="td">
                            <button className='btn btn-sm bg-accent text-white'>Edit</button>
                            <button className='btn btn-sm btn-outline-danger ms-lg-2'>Delete</button>
                        </div>
                    </div>
                </div>
            </div>

        </section>
    </>
  )
}

export default Clients