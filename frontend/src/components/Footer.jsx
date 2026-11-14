import React from 'react';

export default function Footer() {
  return (
    <footer className="mt-12 bg-white border-t border-[#DDD9CE] py-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-xs font-mono text-[#767E78] gap-4">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-[#1C231F]">TERRASHIFT+</span>
          <span>|</span>
          <span>NASA SPACE APPS CHALLENGE 2024/2025</span>
          <span>|</span>
          <span>FIELD SHIFT: ADAPTING FARMS WITH NASA DATA</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span>NASA POWER</span>
          <span>ISRIC SOILGRIDS</span>
          <span>NASA GIBS</span>
          <span>ORNL DAAC</span>
          <span>FAO ECOCROP</span>
        </div>
      </div>
    </footer>
  );
}
