import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, Droplets, Sprout, TrendingUp, Bug, X, ChevronRight } from 'lucide-react';
import FarmerTooltip from './FarmerTooltip';

function WaterBalanceNdviChart({ climate, ndvi }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  if (!climate?.monthly_climatology?.length) return null;

  const width = 560;
  const height = 200;
  const pad = { top: 16, right: 40, bottom: 26, left: 40 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const rows = climate.monthly_climatology.map((m, i) => ({
    month: months[i],
    precipMm: m.precip_mm,
    et0Mm: m.et0_mm,
    ndvi: ndvi?.monthly_ndvi?.[i]?.ndvi ?? null,
  }));

  const maxMm = Math.max(80, ...rows.map((r) => Math.max(r.precipMm, r.et0Mm)));
  const stepX = plotW / rows.length;
  const yMm = (val) => pad.top + plotH - (val / maxMm) * plotH;
  const yNdvi = (val) => pad.top + plotH - Math.max(0, Math.min(1, val)) * plotH;

  const et0Points = rows.map((r, i) => `${pad.left + stepX * (i + 0.5)},${yMm(r.et0Mm)}`).join(' ');
  const ndviCoords = rows
    .map((r, i) => (r.ndvi !== null ? `${pad.left + stepX * (i + 0.5)},${yNdvi(r.ndvi)}` : null))
    .filter(Boolean);

  const hovered = hoverIdx !== null ? rows[hoverIdx] : null;

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, color: 'var(--ink-secondary)' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span><FarmerTooltip termKey="rain_et0">Blue: Rainfall</FarmerTooltip></span>
          <span><FarmerTooltip termKey="et0">Dashed: Crop Thirst (ET0)</FarmerTooltip></span>
          <span>Green Line: Leaf Canopy (NDVI)</span>
          <span><FarmerTooltip termKey="bare_field">Red: Uncovered Bare Soil</FarmerTooltip></span>
        </div>
        {hovered && (
          <span className="font-mono-tabular" style={{ color: 'var(--ink-primary)' }}>
            {hovered.month}: P {hovered.precipMm}mm | ET0 {hovered.et0Mm}mm | NDVI {hovered.ndvi ?? 'N/A'}
          </span>
        )}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const y = pad.top + plotH * (1 - f);
          return (
            <g key={f}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#E6E3DA" strokeWidth="1" />
              <text x={pad.left - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#767E78" className="font-mono-tabular">
                {Math.round(maxMm * f)}
              </text>
              <text x={width - pad.right + 6} y={y + 3} textAnchor="start" fontSize="9" fill="#234E36" className="font-mono-tabular">
                {f.toFixed(2)}
              </text>
            </g>
          );
        })}

        {rows.map((r, i) => {
          const x0 = pad.left + i * stepX;
          const isBare = r.ndvi !== null && r.ndvi < 0.25;
          const barW = stepX * 0.56;
          const barX = x0 + (stepX - barW) / 2;
          const barH = plotH - (yMm(r.precipMm) - pad.top);

          return (
            <g key={r.month} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}>
              {isBare && <rect x={x0} y={pad.top} width={stepX} height={plotH} fill="rgba(158, 52, 38, 0.11)" />}
              <rect x={barX} y={yMm(r.precipMm)} width={barW} height={Math.max(0, barH)} fill="var(--accent-hydro)" opacity={0.82} />
              <text x={x0 + stepX / 2} y={height - 8} textAnchor="middle" fontSize="9.5" fill="#4E5851">
                {r.month}
              </text>
            </g>
          );
        })}

        <polyline fill="none" stroke="#B45309" strokeWidth="2" strokeDasharray="4 3" points={et0Points} />
        {ndviCoords.length > 1 && <polyline fill="none" stroke="var(--accent-canopy)" strokeWidth="2.2" points={ndviCoords.join(' ')} />}
      </svg>
    </div>
  );
}

export default function Hero({ streamLog = [], streaming, climate, ndvi, soil, terrain, optimization, onClose, onOpenProvenance }) {
  const diag = optimization?.field_diagnosis;
  const opps = optimization?.opportunities;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Top Header with Close Button for Drawer Mode */}
      {onClose && (
        <div className="flex items-center justify-between pb-1 mb-1">
          <span className="text-xs font-mono font-bold text-[#234E36] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#234E36] animate-pulse"></span>
            Field Agronomic Telemetry &amp; Vulnerability
          </span>
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono bg-[#EFEDE6] hover:bg-[#DDD9CE] text-[#1C231F] border border-[#DDD9CE] rounded transition-colors"
          >
            <span>CLOSE</span>
            <X size={13} />
          </button>
        </div>
      )}

      {/* Auto-Detected Bare-Field Windows & Vulnerable Seasons */}
      <section className="swiss-panel p-3">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#DDD9CE]">
          <h2 className="text-xs font-mono font-semibold uppercase tracking-wide text-[#1C231F]">
            Field Vulnerability &amp; Bare-Soil Detection
          </h2>
          {onOpenProvenance && (
            <button
              onClick={onOpenProvenance}
              className="px-2 py-0.5 text-[10px] font-mono bg-[#234E36] text-white hover:bg-[#1A3B29] transition-colors rounded-xs"
            >
              PROVENANCE
            </button>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
          <div style={{ padding: '8px 10px', background: 'var(--status-stress-bg)', border: '1px solid var(--status-stress-border)', borderRadius: 3 }}>
            <strong><FarmerTooltip termKey="bare_field">Uncovered Ground Months</FarmerTooltip> ({diag?.bare_source ? diag.bare_source : (climate ? 'NASA POWER & MODIS CMR Telemetry' : 'Analyzing...') }):</strong>{' '}
            {diag?.bare_months?.length ? diag.bare_months.join(', ') : 'No prolonged bare months detected (Soil is well protected)'}
          </div>

          <div style={{ padding: '8px 10px', background: 'var(--status-watch-bg)', border: '1px solid var(--status-watch-border)', borderRadius: 3 }}>
            <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <AlertTriangle size={13} />
              Current Crop Vulnerable Seasons:
            </strong>{' '}
            {diag?.vulnerable_seasons?.length
              ? diag.vulnerable_seasons.slice(0, 5).map((v) => `${v.month} (${v.reasons.join('; ')})`).join(' | ')
              : (climate ? 'Optimal thermal & moisture balance across active vegetative cycle' : 'Waiting for seasonal stress analysis...')}
          </div>

          {soil && !soil.available && (
            <div style={{ padding: '8px 10px', background: 'var(--status-gap-bg)', border: '1px solid var(--status-gap-border)', borderRadius: 3 }}>
              <strong>Soil Telemetry Gap:</strong> Remote soil API unavailable for this pixel. Use Ground-Truth Overrides below to calibrate pH &amp; texture.
            </div>
          )}

          <WaterBalanceNdviChart climate={climate} ndvi={ndvi} />

          {/* 5-Year Climatological Trajectory & Theil-Sen Slopes */}
          {climate?.yearly_trends && climate.yearly_trends.length > 0 && (
            <div id="climate-drift" style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-default)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 600, color: 'var(--ink-primary)' }}>
                  5-YEAR NASA POWER CLIMATIC DRIFT &amp; THEIL-SEN SLOPES
                </span>
                <span style={{ fontSize: 10, color: 'var(--ink-tertiary)', fontFamily: 'IBM Plex Mono, monospace' }}>
                  MERRA-2 POINT TELEMETRY
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--ink-secondary)', fontFamily: 'IBM Plex Mono, monospace' }}>
                      <th style={{ padding: '4px 6px' }} className="whitespace-nowrap">Year</th>
                      <th style={{ padding: '4px 6px' }} className="whitespace-nowrap"><FarmerTooltip termKey="rain_et0">Rain (mm)</FarmerTooltip></th>
                      <th style={{ padding: '4px 6px' }} className="whitespace-nowrap"><FarmerTooltip termKey="et0">Thirst (ET0 mm)</FarmerTooltip></th>
                      <th style={{ padding: '4px 6px' }} className="whitespace-nowrap"><FarmerTooltip termKey="gwetroot">Root Wetness</FarmerTooltip></th>
                      <th style={{ padding: '4px 6px' }} className="whitespace-nowrap">Heat (&gt;35C)</th>
                      <th style={{ padding: '4px 6px' }} className="whitespace-nowrap">Frost (&lt;2C)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {climate.yearly_trends.map((yr) => (
                      <tr key={yr.year} style={{ borderBottom: '1px solid rgba(221, 217, 206, 0.5)' }}>
                        <td style={{ padding: '4px 6px', fontWeight: 600 }} className="font-mono-tabular whitespace-nowrap">{yr.year}</td>
                        <td style={{ padding: '4px 6px' }} className="font-mono-tabular whitespace-nowrap">{yr.precip_mm}</td>
                        <td style={{ padding: '4px 6px' }} className="font-mono-tabular whitespace-nowrap">{yr.et0_mm}</td>
                        <td style={{ padding: '4px 6px' }} className="font-mono-tabular whitespace-nowrap">{yr.gwet_root || yr.gwet_root_mean}</td>
                        <td style={{ padding: '4px 6px', color: (yr.heat_days || yr.heat_days_gt35) > 15 ? 'var(--status-stress-fg)' : 'inherit' }} className="font-mono-tabular whitespace-nowrap">
                          {yr.heat_days ?? yr.heat_days_gt35} d
                        </td>
                        <td style={{ padding: '4px 6px' }} className="font-mono-tabular whitespace-nowrap">{yr.frost_days ?? yr.frost_days_lt2} d</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {climate.trend_slopes && (
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono">
                  <span className="px-2 py-1 bg-white border border-[#DDD9CE] rounded-xs text-[#1C231F]">
                    Rainfall Trend: <strong className="text-[#234E36]">{climate.trend_slopes.precip_slope_mm_yr ?? climate.trend_slopes.precip_mm_per_yr ?? '--'} mm/yr</strong>
                  </span>
                  <span className="px-2 py-1 bg-white border border-[#DDD9CE] rounded-xs text-[#1C231F]">
                    ET0 Trend: <strong>{climate.trend_slopes.et0_slope_mm_yr ?? climate.trend_slopes.et0_mm_per_yr ?? '--'} mm/yr</strong>
                  </span>
                  <span className="px-2 py-1 bg-white border border-[#DDD9CE] rounded-xs text-[#1C231F]">
                    Root Wetness: <strong>{climate.trend_slopes.gwet_slope_per_yr ?? climate.trend_slopes.gwet_per_yr ?? '--'}/yr</strong>
                  </span>
                  <span className="px-2 py-1 bg-white border border-[#DDD9CE] rounded-xs text-[#1C231F]">
                    Heatwave Drift: <strong className="text-[#9E3426]">{climate.trend_slopes.heat_days_slope_per_yr ?? climate.trend_slopes.heat_days_per_yr ?? '--'} d/yr</strong>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 4 Quantified Rotation Opportunities */}
      {opps && (
        <section className="swiss-panel p-3">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#DDD9CE]">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wide text-[#1C231F]">
              Identified Rotation Opportunities
            </h2>
            <ShieldCheck size={14} color="var(--accent-canopy)" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div style={{ border: '1px solid var(--border-default)', padding: 9, borderRadius: 3, background: 'var(--bg-subtle)' }}>
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <Bug size={13} color="var(--accent-canopy)" /> Interrupt Pest Cycles
              </div>
              <div style={{ color: 'var(--ink-secondary)' }}>{opps.interrupt_pest_cycles}</div>
            </div>
            <div style={{ border: '1px solid var(--border-default)', padding: 9, borderRadius: 3, background: 'var(--bg-subtle)' }}>
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <Droplets size={13} color="var(--accent-hydro)" /> Reduce Water Demand
              </div>
              <div style={{ color: 'var(--ink-secondary)' }}>{opps.reduce_water_demand}</div>
            </div>
            <div style={{ border: '1px solid var(--border-default)', padding: 9, borderRadius: 3, background: 'var(--bg-subtle)' }}>
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <Sprout size={13} color="var(--accent-canopy)" /> Improve Infiltration
              </div>
              <div style={{ color: 'var(--ink-secondary)' }}>{opps.improve_infiltration}</div>
            </div>
            <div style={{ border: '1px solid var(--border-default)', padding: 9, borderRadius: 3, background: 'var(--bg-subtle)' }}>
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <TrendingUp size={13} color="var(--status-watch-fg)" /> Supplemental Income
              </div>
              <div style={{ color: 'var(--ink-secondary)' }}>{opps.add_supplemental_income}</div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
