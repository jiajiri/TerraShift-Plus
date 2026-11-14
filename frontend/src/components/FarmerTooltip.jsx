import React from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * Farmer-Friendly Agricultural Glossary Definitions
 * Translates complex NASA / agrometeorological terms into intuitive, practical farming concepts.
 */
export const FARMER_TERMS = {
  rain_et0: {
    term: "Rain vs. Crop Thirst",
    short: "Rainfall vs. Sun Evaporation",
    plain: "Shows how much rainfall arrives compared to how much water the heat, sun, and wind pull out from your soil and crops. If water thirst exceeds rain, crops require stored soil moisture or irrigation."
  },
  et0: {
    term: "Crop Water Thirst (ET0)",
    short: "Atmospheric Water Demand",
    plain: "The total water that evaporates from bare soil and transpires through healthy leaves under current sun, wind, and heat conditions."
  },
  gwetroot: {
    term: "Root-Zone Soil Wetness",
    short: "Deep Soil Moisture",
    plain: "The percentage of water currently stored 0–100 cm deep in the soil where plant roots drink. Higher numbers protect your harvest during dry spells."
  },
  rusle: {
    term: "Topsoil Erosion Hazard",
    short: "Soil Loss During Storms",
    plain: "Estimated tons of fertile topsoil that wash away per hectare every year due to rainfall intensity and field slope without cover crops or contour bunds."
  },
  spei: {
    term: "Drought Severity Index",
    short: "Historical Moisture Anomaly",
    plain: "Compares current moisture to 30-year regional weather records. Negative values (below -1.0) signal moderate to extreme drought risk."
  },
  wsi: {
    term: "Water Stress Level",
    short: "Crop Thirst Deficit",
    plain: "Fraction of water deficiency experienced by the crop throughout its growing season. 0 means zero thirst; above 0.35 means yields will drop without rain or irrigation."
  },
  cvar10: {
    term: "Worst-Decile Safety Floor (CVaR10)",
    short: "1-in-10 Bad Year Income",
    plain: "The guaranteed minimum net income you can expect in the worst 10% of weather seasons. High numbers protect your family against drought bankruptcy."
  },
  bare_field: {
    term: "Uncovered Soil Months",
    short: "Vulnerable Bare Windows",
    plain: "Months when your field sits empty without growing plants. Uncovered soil bakes in the sun, loses organic nutrients, and washes away in the first rains."
  },
  soc_delta: {
    term: "Soil Organic Matter Growth",
    short: "Soil Carbon & Compost Rebuild",
    plain: "Tons of rich biological organic carbon restored back into your field over 5 years by leaving crop residues and growing deep-rooted legumes."
  },
  n_balance: {
    term: "Natural Nitrogen Added",
    short: "Fertilizer Saved from Legumes",
    plain: "Kilograms of free biological nitrogen pulled from the air and deposited into your soil by nitrogen-fixing legume nodules (like cowpea, pigeonpea, or chickpea)."
  },
  ood_reliability: {
    term: "Weather Model Confidence",
    short: "Local Climate Reliability",
    plain: "Confirms that current local weather patterns match reliable agricultural data models for accurate harvest forecasts."
  }
};

/**
 * Interactive Farmer Plain-Language Tooltip
 */
export default function FarmerTooltip({ termKey, label, children, className = '' }) {
  const item = FARMER_TERMS[termKey];
  const displayLabel = label || item?.term || termKey;

  return (
    <span className={`group relative inline-flex items-center gap-1 cursor-help ${className}`}>
      <span className="border-b border-dotted border-[#767E78] group-hover:border-[#234E36] transition-colors">
        {children || displayLabel}
      </span>
      <HelpCircle size={12} className="text-[#767E78] group-hover:text-[#234E36] transition-colors opacity-75" />
      
      {/* Tooltip Card */}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-[#1C231F] text-[#F6F5F0] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 text-left text-xs font-sans normal-case tracking-normal">
        <div className="font-mono font-semibold text-[11px] text-[#A3C9A8] uppercase tracking-wider mb-1">
          {item?.term || displayLabel}
        </div>
        <p className="text-[11px] leading-relaxed text-[#DDD9CE]">
          {item?.plain || "Agronomic field indicator for precision crop management."}
        </p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1C231F]" />
      </div>
    </span>
  );
}
