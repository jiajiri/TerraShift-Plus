import React, { useState } from 'react';
import { Sliders, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';

export default function BenchmarkMatrix({
  priorities,
  onPriorityChange,
  telemetry,
  overrides,
  onOverrideChange,
  onResetOverrides
}) {
  const [localPh, setLocalPh] = useState(overrides.soilPh || '');
  const [localClay, setLocalClay] = useState(overrides.clayFraction || '');
  const [localPrecip, setLocalPrecip] = useState(overrides.annualPrecip || '');

  const handleApplyOverrides = (e) => {
    e.preventDefault();
    onOverrideChange({
      soilPh: localPh !== '' ? parseFloat(localPh) : undefined,
      clayFraction: localClay !== '' ? parseFloat(localClay) : undefined,
      annualPrecip: localPrecip !== '' ? parseFloat(localPrecip) : undefined
    });
  };

  const handleReset = () => {
    setLocalPh('');
    setLocalClay('');
    setLocalPrecip('');
    onResetOverrides();
  };

  return (
    <div className="space-y-6">
      {/* Stage Introduction Banner */}
      <div className="bg-white p-4 border border-[#DDD9CE] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-mono font-semibold text-[#1C231F] uppercase tracking-wider">
            Operational Stage 02: Agronomic Priorities & Ground-Truth Calibration
          </h2>
          <p className="text-xs text-[#4E5851] mt-1 max-w-3xl">
            Spaceborne instruments provide coarse spatial grids (e.g. 250m soil grids, 0.5° weather grids).
            Calibrate decision weighting to farm-gate economic targets or override satellite estimates with in-situ field lab tests.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono text-[#767E78]">
          <span className="px-2 py-1 bg-[#EFEDE6] border border-[#DDD9CE]">
            MCDA WEIGHTS SUM: {Math.round(((priorities?.water ?? 0) + (priorities?.heat ?? 0) + (priorities?.soil ?? 0) + (priorities?.market ?? 0)) / 4)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Multicriteria Priority Weighting Sliders */}
        <div className="bg-white p-5 border border-[#DDD9CE] space-y-5">
          <div className="border-b border-[#DDD9CE] pb-3">
            <h3 className="text-xs font-mono font-semibold text-[#1C231F] uppercase tracking-wide">
              MCDA Agronomic Optimization Weighting
            </h3>
            <p className="text-[11px] text-[#767E78]">
              Adjust priority trade-offs for rotation ranking. Values automatically normalize during matrix evaluation.
            </p>
          </div>

          {/* Slider 1: Water Balance Weight */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="font-medium text-[#1C231F]">Water Conservation & Drought Survival</span>
              <span className="font-bold text-[#1F5673]">{priorities.water}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={priorities.water}
              onChange={(e) => onPriorityChange('water', parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-[#EFEDE6] appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#767E78] font-mono mt-1">
              <span>Standard Need</span>
              <span>Extreme Water Conservation</span>
            </div>
          </div>

          {/* Slider 2: Heat Tolerance Weight */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="font-medium text-[#1C231F]">Thermal Stress & Heatwave Resistance</span>
              <span className="font-bold text-[#9E3426]">{priorities.heat}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={priorities.heat}
              onChange={(e) => onPriorityChange('heat', parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-[#EFEDE6] appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#767E78] font-mono mt-1">
              <span>Moderate Tolerance</span>
              <span>Extreme Thermal Survival</span>
            </div>
          </div>

          {/* Slider 3: Soil Regeneration Weight */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="font-medium text-[#1C231F]">Soil Regeneration (Legume N-Fixation & Organic Matter)</span>
              <span className="font-bold text-[#234E36]">{priorities.soil}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={priorities.soil}
              onChange={(e) => onPriorityChange('soil', parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-[#EFEDE6] appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#767E78] font-mono mt-1">
              <span>Neutral Soil Impact</span>
              <span>Maximum Biological Restoration</span>
            </div>
          </div>

          {/* Slider 4: Market Resilience Weight */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="font-medium text-[#1C231F]">Market Value & Cash Flow Security</span>
              <span className="font-bold text-[#8C5710]">{priorities.market}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={priorities.market}
              onChange={(e) => onPriorityChange('market', parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-[#EFEDE6] appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#767E78] font-mono mt-1">
              <span>Subsistence Tolerance</span>
              <span>High Commercial Liquidity</span>
            </div>
          </div>
        </div>

        {/* Right Column: In-Situ Ground Truth Overrides */}
        <div className="bg-white p-5 border border-[#DDD9CE] space-y-4">
          <div className="border-b border-[#DDD9CE] pb-3">
            <h3 className="text-xs font-mono font-semibold text-[#1C231F] uppercase tracking-wide">
              Farmer In-Situ Ground-Truth Calibration
            </h3>
            <p className="text-[11px] text-[#767E78]">
              Override satellite predictions with actual soil sample reports or local rain-gauge observations.
            </p>
          </div>

          <form onSubmit={handleApplyOverrides} className="space-y-4">
            {/* Override Soil pH */}
            <div>
              <label className="block text-xs font-mono text-[#1C231F] mb-1">
                Measured Soil pH (H₂O)
                <span className="text-[#767E78] ml-2 text-[10px]">
                  [Satellite estimate: {telemetry.soil?.ph ?? telemetry.soil?.soilPh ?? 'N/A'}]
                </span>
              </label>
              <input
                type="number"
                step="0.1"
                min="3.0"
                max="10.0"
                value={localPh}
                onChange={(e) => setLocalPh(e.target.value)}
                placeholder="e.g. 6.4 (Leave blank to use satellite)"
                className="w-full h-8 px-2.5 bg-[#EFEDE6] border border-[#DDD9CE] text-xs font-mono text-[#1C231F] focus:outline-none focus:border-[#234E36]"
              />
            </div>

            {/* Override Clay Fraction */}
            <div>
              <label className="block text-xs font-mono text-[#1C231F] mb-1">
                Measured Clay Content (%)
                <span className="text-[#767E78] ml-2 text-[10px]">
                  [Satellite estimate: {telemetry.soil?.clay_pct != null ? `${telemetry.soil.clay_pct}%` : (telemetry.soil?.clayFractionPercent != null ? `${telemetry.soil.clayFractionPercent}%` : 'N/A')}]
                </span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={localClay}
                onChange={(e) => setLocalClay(e.target.value)}
                placeholder="e.g. 28.5 (Leave blank to use satellite)"
                className="w-full h-8 px-2.5 bg-[#EFEDE6] border border-[#DDD9CE] text-xs font-mono text-[#1C231F] focus:outline-none focus:border-[#234E36]"
              />
            </div>

            {/* Override Annual Rain Gauge */}
            <div>
              <label className="block text-xs font-mono text-[#1C231F] mb-1">
                On-Farm Rain Gauge Annual Total (mm)
                <span className="text-[#767E78] ml-2 text-[10px]">
                  [NASA estimate: {telemetry.power?.annual_precip_mm ?? telemetry.power?.annual_precipitation_mm ?? telemetry.power?.annualPrecipMm ?? 'N/A'} mm]
                </span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="5000"
                value={localPrecip}
                onChange={(e) => setLocalPrecip(e.target.value)}
                placeholder="e.g. 520 (Leave blank to use satellite)"
                className="w-full h-8 px-2.5 bg-[#EFEDE6] border border-[#DDD9CE] text-xs font-mono text-[#1C231F] focus:outline-none focus:border-[#234E36]"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#234E36] text-white text-xs font-mono font-medium hover:bg-[#1A3B29] transition-colors"
              >
                APPLY GROUND-TRUTH
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 bg-white border border-[#DDD9CE] text-xs font-mono text-[#767E78] hover:text-[#1C231F] transition-colors"
              >
                RESET TO SATELLITE
              </button>
            </div>
          </form>

          {telemetry.soil?.isOverridden && (
            <div className="p-2.5 bg-[#EAF3ED] border border-[#B8D8C3] flex items-center space-x-2 text-xs font-mono text-[#265D3D]">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Ground-truth parameters active. Satellite baselines are overridden.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
