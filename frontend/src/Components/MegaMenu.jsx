import React from "react";
import { Link } from "react-router-dom";
import { SiCodeblocks } from "react-icons/si";
import { FaChevronRight } from "react-icons/fa";
import "./Components.css";

const MegaMenu = ({ onClose }) => (
  <div className="absolute left-0 top-full w-full bg-white shadow-lg z-40 py-8 px-10 flex flex-col lg:flex-row gap-8 border-t border-gray-200">
    <div className="min-w-45">
      <div className="flex items-center gap-2 mb-4 text-secondary font-heading text-lg">
        <SiCodeblocks />
        INDUSTRIES
      </div>
      <div className="flex flex-col gap-2 text-base">
        <span>HVAC</span>
        <span>Landscaping</span>
        <span>Painting</span>
        <span>Residential Cleaning</span>
      </div>
      <Link
        to="/industries"
        className="mt-8 text-secondary font-semibold flex items-center gap-1 hover:underline"
        onClick={onClose}
      >
        SEE ALL INDUSTRIES <FaChevronRight className="text-secondary mb-px" />
      </Link>
    </div>
    <div className="flex flex-col gap-2.5 min-w-45 text-base">
      <span>Plumbing</span>
      <span>Lawn Care</span>
      <span>Renovations</span>
      <span>Janitorial Cleaning</span>
      <span>Electrician</span>
    </div>
    <div className="flex flex-col gap-2.5 min-w-45 text-base">
      <span>Tree Care</span>
      <span>Appliance Repair</span>
      <span>Pressure Washing</span>
      <span>Roofing</span>
      <span>Pool Service</span>
    </div>
  </div>
);

export default MegaMenu;
