import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, Droplets, Sprout, TrendingUp, Bug, X, ChevronRight } from 'lucide-react';
import FarmerTooltip from './FarmerTooltip';
import { useI18n } from '../i18n/I18nContext';

function WaterBalanceNdviChart({ climate, ndvi }) {
  const { t } = useI18n();
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
          <span><FarmerTooltip termKey="rain_et0">{t('telemetry.legend_rain')}</FarmerTooltip></span>
          <span><FarmerTooltip termKey="et0">{t('telemetry.legend_et0')}</FarmerTooltip></span>
          <span>{t('telemetry.legend_ndvi')}</span>
          <span><FarmerTooltip termKey="bare_field">{t('telemetry.legend_bare')}</FarmerTooltip></span>
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

export default function Hero({ streamLog = [], streaming, climate, ndvi, soil, terrain, optimization, onClose }) {
  const { t, lang } = useI18n();
  const diag = optimization?.field_diagnosis;
  const opps = optimization?.opportunities;

  const renderBareSource = (source) => {
    if (!source) return climate ? 'NASA POWER & MODIS CMR Telemetry' : t('advisor.analyzing');
    if (source.includes('Precipitation Proxy')) {
      return t('telemetry.precip_proxy');
    }
    return source;
  };

  const renderReason = (reason) => {
    if (typeof reason !== 'string') return String(reason);
    let out = reason;
    if (out.includes('heat stress')) {
      out = out.replace('heat stress', t('telemetry.stress_heat'));
    }
    if (out.includes('frost risk')) {
      out = out.replace('frost risk', t('telemetry.stress_frost'));
    }
    if (out.includes('moisture deficit')) {
      out = out.replace('moisture deficit (ET0 >> P)', t('telemetry.stress_moisture'));
    }
    return out;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Top Header with Close Button for Drawer Mode */}
      {onClose && (
        <div className="flex items-center justify-between pb-1 mb-1">
          <span className="text-xs font-mono font-bold text-[#234E36] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#234E36] animate-pulse"></span>
            {t('map.field_analysis')}
          </span>
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono bg-[#EFEDE6] hover:bg-[#DDD9CE] text-[#1C231F] border border-[#DDD9CE] rounded transition-colors"
          >
            <span>{t('common.close').toUpperCase()}</span>
            <X size={13} />
          </button>
        </div>
      )}

      {/* Auto-Detected Bare-Field Windows & Vulnerable Seasons */}
      <section className="swiss-panel p-3">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#DDD9CE]">
          <h2 className="text-xs font-mono font-semibold uppercase tracking-wide text-[#1C231F]">
            {t('telemetry.water_balance_ndvi_title')}
          </h2>

        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
          <div style={{ padding: '8px 10px', background: 'var(--status-stress-bg)', border: '1px solid var(--status-stress-border)', borderRadius: 3 }}>
            <strong><FarmerTooltip termKey="bare_field">{t('telemetry.legend_bare')}</FarmerTooltip> ({renderBareSource(diag?.bare_source)}):</strong>{' '}
            {diag?.bare_months?.length ? diag.bare_months.join(', ') : '0'}
          </div>

          {diag?.bare_months && diag.bare_months.length > 0 && (
            <div style={{ padding: '8px 10px', background: '#FBECE9', border: '1px solid #E3B3AC', borderRadius: 3, color: '#9E3426', fontSize: 11.5 }}>
              {t('telemetry.bare_soil_alert', { count: diag.bare_months.length })}
            </div>
          )}

          <div style={{ padding: '8px 10px', background: 'var(--status-watch-bg)', border: '1px solid var(--status-watch-border)', borderRadius: 3 }}>
            <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <AlertTriangle size={13} />
              {t('map.vulnerability')}
            </strong>{' '}
            {diag?.vulnerable_seasons?.length
              ? diag.vulnerable_seasons.slice(0, 5).map((v) => `${v.month} (${v.reasons.map(renderReason).join('; ')})`).join(' | ')
              : (climate ? (lang === 'sw' ? 'Hakuna msongo wa joto au ukame katika mzunguko mzima wa mazao' : 'Optimal thermal & moisture balance across active vegetative cycle') : (lang === 'sw' ? 'Inasubiri uchambuzi wa hali ya tabianchi...' : 'Waiting for seasonal stress analysis...'))}
          </div>

          {soil && !soil.available && (
            <div style={{ padding: '8px 10px', background: 'var(--status-gap-bg)', border: '1px solid var(--status-gap-border)', borderRadius: 3 }}>
              <strong>{t('hero.soil_gap') || 'Soil Telemetry Gap:'}</strong> {t('hero.soil_gap_desc') || 'Remote soil API unavailable for this pixel. Use Ground-Truth Overrides below to calibrate pH & texture.'}
            </div>
          )}

          <WaterBalanceNdviChart climate={climate} ndvi={ndvi} />

          {/* 5-Year Climatological Trajectory & Theil-Sen Slopes */}
          {climate?.yearly_trends && climate.yearly_trends.length > 0 && (
            <div id="climate-drift" style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-default)', scrollMarginTop: '76px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 600, color: 'var(--ink-primary)' }}>
                  {t('telemetry.five_year_table_title').toUpperCase()}
                </span>
                <span style={{ fontSize: 10, color: 'var(--ink-tertiary)', fontFamily: 'IBM Plex Mono, monospace' }}>
                  MERRA-2 POINT TELEMETRY
                </span>
              </div>
              
              {/* Wrapped in overflow-x-auto w-full with concise columns and compact cell padding to prevent clipping */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-[11px] font-mono border-collapse min-w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--ink-secondary)', fontFamily: 'IBM Plex Mono, monospace' }}>
                      <th className="px-1.5 py-1 whitespace-nowrap">{t('telemetry.col_year')}</th>
                      <th className="px-1.5 py-1 whitespace-nowrap"><FarmerTooltip termKey="rain_et0">{t('telemetry.col_rain')}</FarmerTooltip></th>
                      <th className="px-1.5 py-1 whitespace-nowrap"><FarmerTooltip termKey="et0">{t('telemetry.col_thirst')}</FarmerTooltip></th>
                      <th className="px-1.5 py-1 whitespace-nowrap"><FarmerTooltip termKey="gwetroot">{t('telemetry.col_root_wetness')}</FarmerTooltip></th>
                      <th className="px-1.5 py-1 whitespace-nowrap">{t('telemetry.col_heat')}</th>
                      <th className="px-1.5 py-1 whitespace-nowrap">{t('telemetry.col_frost')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {climate.yearly_trends.map((yr) => (
                      <tr key={yr.year} style={{ borderBottom: '1px solid rgba(221, 217, 206, 0.5)' }}>
                        <td className="px-1.5 py-1 font-semibold font-mono-tabular whitespace-nowrap">{yr.year}</td>
                        <td className="px-1.5 py-1 font-mono-tabular whitespace-nowrap">{yr.precip_mm}</td>
                        <td className="px-1.5 py-1 font-mono-tabular whitespace-nowrap">{yr.et0_mm}</td>
                        <td className="px-1.5 py-1 font-mono-tabular whitespace-nowrap">{yr.gwet_root || yr.gwet_root_mean}</td>
                        <td className="px-1.5 py-1 font-mono-tabular whitespace-nowrap" style={{ color: (yr.heat_days || yr.heat_days_gt35) > 15 ? 'var(--status-stress-fg)' : 'inherit' }}>
                          {yr.heat_days ?? yr.heat_days_gt35} d
                        </td>
                        <td className="px-1.5 py-1 font-mono-tabular whitespace-nowrap">{yr.frost_days ?? yr.frost_days_lt2} d</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {climate.trend_slopes && (
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono">
                  <span className="px-2 py-1 bg-white border border-[#DDD9CE] rounded-xs text-[#1C231F]">
                    {t('telemetry.trend_rainfall')} <strong className="text-[#234E36]">{climate.trend_slopes.precip_slope_mm_yr ?? climate.trend_slopes.precip_mm_per_yr ?? '--'} mm/yr</strong>
                  </span>
                  <span className="px-2 py-1 bg-white border border-[#DDD9CE] rounded-xs text-[#1C231F]">
                    {t('telemetry.trend_et0')} <strong>{climate.trend_slopes.et0_slope_mm_yr ?? climate.trend_slopes.et0_mm_per_yr ?? '--'} mm/yr</strong>
                  </span>
                  <span className="px-2 py-1 bg-white border border-[#DDD9CE] rounded-xs text-[#1C231F]">
                    {t('telemetry.trend_root_wetness')} <strong>{climate.trend_slopes.gwet_slope_per_yr ?? climate.trend_slopes.gwet_per_yr ?? '--'}/yr</strong>
                  </span>
                  <span className="px-2 py-1 bg-white border border-[#DDD9CE] rounded-xs text-[#1C231F]">
                    {t('telemetry.trend_heatwave')} <strong className="text-[#9E3426]">{climate.trend_slopes.heat_days_slope_per_yr ?? climate.trend_slopes.heat_days_per_yr ?? '--'} d/yr</strong>
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
              {t('telemetry.identified_opportunities')}
            </h2>
            <ShieldCheck size={14} color="var(--accent-canopy)" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div style={{ border: '1px solid var(--border-default)', padding: 9, borderRadius: 3, background: 'var(--bg-subtle)' }}>
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <Bug size={13} color="var(--accent-canopy)" /> {t('telemetry.opp_pest')}
              </div>
              <div style={{ color: 'var(--ink-secondary)' }}>{opps.interrupt_pest_cycles}</div>
            </div>
            <div style={{ border: '1px solid var(--border-default)', padding: 9, borderRadius: 3, background: 'var(--bg-subtle)' }}>
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <Droplets size={13} color="var(--accent-hydro)" /> {t('telemetry.opp_water')}
              </div>
              <div style={{ color: 'var(--ink-secondary)' }}>{opps.reduce_water_demand}</div>
            </div>
            <div style={{ border: '1px solid var(--border-default)', padding: 9, borderRadius: 3, background: 'var(--bg-subtle)' }}>
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <Sprout size={13} color="var(--accent-canopy)" /> {t('telemetry.opp_soil')}
              </div>
              <div style={{ color: 'var(--ink-secondary)' }}>{opps.improve_infiltration}</div>
            </div>
            <div style={{ border: '1px solid var(--border-default)', padding: 9, borderRadius: 3, background: 'var(--bg-subtle)' }}>
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <TrendingUp size={13} color="var(--status-watch-fg)" /> {t('telemetry.opp_income')}
              </div>
              <div style={{ color: 'var(--ink-secondary)' }}>{opps.add_supplemental_income}</div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
