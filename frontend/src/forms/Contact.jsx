import React from 'react'


function Contact() {
  return (
    <form className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col gap-5 max-w-xl mx-auto">
      <h3 className="text-xl font-semibold mb-1">Send us a message</h3>
      <p className="text-gray-600 text-sm mb-4">Tell us a bit about your business so we can help you faster.</p>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
          <input type="text" placeholder="Jane" className="w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
          <input type="text" placeholder="Doe" className="w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Work Email</label>
        <input type="email" placeholder="jane@company.com" className="w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Company Name</label>
        <input type="text" placeholder="Acme Contracting" className="w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">How can we help?</label>
        <textarea placeholder="I'm interested in a demo and have a question about Quickbooks integration..." rows={4} className="w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent resize-none" />
      </div>
      <div className="flex items-start gap-2">
        <input type="checkbox" id="privacy" className="mt-1" />
        <label htmlFor="privacy" className="text-xs text-gray-600">I agree to Contractorz's <a href="#" className="underline">Privacy Policy</a>. We respect your inbox and never sell your data.</label>
      </div>
      <button type="submit" className="mt-2 bg-black text-white rounded-md py-3 font-semibold text-base hover:bg-gray-900 transition">Send Request</button>
    </form>
  );
}

export default Contact