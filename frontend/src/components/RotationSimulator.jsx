import React from 'react';
import { AlertCircle, CheckCircle2, HelpCircle, RotateCcw, Shield } from 'lucide-react';
import FarmerTooltip from './FarmerTooltip';
import { useI18n } from '../i18n/I18nContext';

const SW_CROP_DICTIONARY = {
  maize: 'Mahindi',
  corn: 'Mahindi',
  pigeonpea: 'Mbaazi',
  cowpea: 'Kunde',
  finger_millet: 'Ulezi',
  sorghum: 'Mtama',
  pearl_millet: 'Uwele',
  sesame: 'Ufuta',
  sunflower: 'Alizeti',
  chickpea: 'Dengu',
  alfalfa: 'Alfafaa',
  winter_wheat: 'Ngano',
  crimson_clover: 'Klova',
  tillage_radish: 'Figili ya Udongo',
  bare_fallow: 'Ardhi Tupu',
  cassava: 'Mhogo',
  groundnut: 'Karanga',
  teff: 'Tefi',
};

const SW_ARCHETYPE_DICTIONARY = {
  'Status Quo Baseline': 'Msimamo wa Sasa (Msingi)',
  'Resilience-First': 'Ustahimilivu wa Ukame',
  'Balanced Stewardship': 'Uwiano wa Mavuno na Udongo',
  'Yield-Maximizing': 'Mavuno ya Juu Zaidi',
};

const toShortCrop = (name, lang = 'en') => {
  if (!name) return '';
  const clean = name.split('(')[0].trim();
  if (lang === 'sw') {
    const lowerKey = clean.toLowerCase().replace(/[\s-]+/g, '_');
    return SW_CROP_DICTIONARY[lowerKey] || SW_CROP_DICTIONARY[clean.toLowerCase()] || clean;
  }
  return clean;
};

const toLocalizedArchetype = (archetype, lang = 'en') => {
  if (!archetype) return '';
  if (lang === 'sw') {
    return SW_ARCHETYPE_DICTIONARY[archetype] || archetype;
  }
  return archetype;
};

export default function RotationSimulator({
  optimization,
  climate,
  climatePerturb,
  onChangePerturb,
}) {
  const { lang, t } = useI18n();

  if (!optimization?.strategies?.length) {
    return (
      <div id="rotations-matrix" style={{ display: 'flex', flexDirection: 'column', gap: 14, scrollMarginTop: '76px' }}>
        <section className="swiss-panel p-4">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#DDD9CE]">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wide text-[#1C231F]">
              {t('rotation.section_title')}
            </h2>
            <span className="text-[10px] font-mono text-[#767E78]">{t('common.status_quo_baseline')}</span>
          </div>
          <div className="text-xs font-mono text-[#767E78] py-4">
            {t('rotation.sampling_notice')}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div id="rotations-matrix" style={{ display: 'flex', flexDirection: 'column', gap: 14, scrollMarginTop: '76px' }}>
      {/* Explicit Supportive Tool Notice */}
      <div
        style={{
          padding: '10px 14px',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-strong)',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 12,
        }}
      >
        <Shield size={16} color="var(--accent-canopy)" style={{ flexShrink: 0 }} />
        <div>
          <strong>{t('rotation.supportive_notice_title')}</strong> {optimization.advisory_notice}
        </div>
      </div>

      {/* What-If Climate Perturbation Bar */}
      <section className="swiss-panel p-3">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#DDD9CE]">
          <h2 className="text-xs font-mono font-semibold uppercase tracking-wide text-[#1C231F]">
            {t('rotation.climate_stress_title')}
          </h2>
          {(climatePerturb?.rainDeltaPct !== 0 || climatePerturb?.tempDeltaC !== 0) && (
            <button
              type="button"
              className="h-6 px-2 bg-white border border-[#DDD9CE] text-[10px] font-mono text-[#1C231F] hover:bg-[#E7E4DA] flex items-center gap-1 rounded-xs"
              onClick={() => onChangePerturb({ rainDeltaPct: 0, tempDeltaC: 0 })}
            >
              <RotateCcw size={10} /> {t('rotation.reset_scenario')}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div style={{ display: 'flex', justifyBetween: 'space-between', justifyContent: 'space-between', fontSize: 12, fontWeight: 600 }}>
              <span>{t('rotation.rainfall_change')}</span>
              <span className="font-mono-tabular">{climatePerturb?.rainDeltaPct > 0 ? `+${climatePerturb.rainDeltaPct}%` : `${climatePerturb?.rainDeltaPct || 0}%`}</span>
            </div>
            <input
              type="range"
              min="-30"
              max="20"
              step="5"
              value={climatePerturb?.rainDeltaPct || 0}
              onChange={(e) => onChangePerturb({ ...climatePerturb, rainDeltaPct: Number(e.target.value) })}
              className="w-full h-1.5 bg-white cursor-pointer mt-1"
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyBetween: 'space-between', justifyContent: 'space-between', fontSize: 12, fontWeight: 600 }}>
              <span>{t('rotation.temperature_shift')}</span>
              <span className="font-mono-tabular">+{Number(climatePerturb?.tempDeltaC || 0).toFixed(1)} C</span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="0.5"
              value={climatePerturb?.tempDeltaC || 0}
              onChange={(e) => onChangePerturb({ ...climatePerturb, tempDeltaC: Number(e.target.value) })}
              className="w-full h-1.5 bg-white cursor-pointer mt-1"
            />
          </div>
        </div>
      </section>

      {/* 4-Strategy Comparison Matrix */}
      <section className="swiss-panel p-3">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#DDD9CE]">
          <h2 className="text-xs font-mono font-semibold uppercase tracking-wide text-[#1C231F]">
            {t('rotation.section_title')}
          </h2>
          {optimization.regime?.ood_warning && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-[#FBECE9] text-[#9E3426] border border-[#E3B3AC] rounded-xs">
              {t('rotation.ood_alert', { dist: optimization.regime.mahalanobis_distance_proxy })}
            </span>
          )}
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs font-mono border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#DDD9CE] text-[10px] text-[#767E78] bg-[#F6F5F0]">
                <th className="py-2 px-2.5 whitespace-nowrap">{t('rotation.th_strategy')}</th>
                <th className="py-2 px-2.5 whitespace-nowrap">{t('rotation.th_sequence')}</th>
                <th className="py-2 px-2 whitespace-nowrap">{t('rotation.th_farmer_match')}</th>
                <th className="py-2 px-2.5 whitespace-nowrap">{t('rotation.th_income')}</th>
                <th className="py-2 px-2.5 whitespace-nowrap"><FarmerTooltip termKey="cvar10">{t('rotation.th_safety_floor')}</FarmerTooltip></th>
                <th className="py-2 px-2 whitespace-nowrap"><FarmerTooltip termKey="wsi">{t('rotation.th_water_stress')}</FarmerTooltip></th>
                <th className="py-2 px-2.5 whitespace-nowrap"><FarmerTooltip termKey="rusle">{t('rotation.th_topsoil_loss')}</FarmerTooltip></th>
                <th className="py-2 px-2.5 whitespace-nowrap"><FarmerTooltip termKey="n_balance">{t('rotation.th_soil_nitrogen')}</FarmerTooltip></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDD9CE] text-[#4E5851]">
              {optimization.strategies.map((s) => (
                <tr key={s.archetype} style={{ background: (s.archetype === 'Status Quo Baseline' || s.archetype === 'Msimamo wa Sasa (Msingi)') ? 'var(--bg-subtle)' : 'var(--bg-surface)' }}>
                  <td className="py-2 px-2.5 font-semibold text-[#1C231F] whitespace-nowrap">{toLocalizedArchetype(s.archetype, lang)}</td>
                  <td className="py-2 px-2.5 text-[11px] font-mono min-w-[180px] max-w-[280px] whitespace-normal leading-normal">{s.sequence_names.map((n) => toShortCrop(n, lang)).join(' → ')}</td>
                  <td className="py-2 px-2 font-mono-tabular">
                    <span style={{
                      padding: '2px 4px',
                      borderRadius: 2,
                      fontSize: 10,
                      fontWeight: 600,
                      background: s.priority_alignment_pct >= 75 ? 'var(--status-optimal-bg)' : 'var(--bg-subtle)',
                      color: s.priority_alignment_pct >= 75 ? 'var(--status-optimal-fg)' : 'inherit',
                      border: '1px solid var(--border-default)'
                    }}>
                      {s.priority_alignment_pct ?? 70}%
                    </span>
                  </td>
                  <td className="py-2 px-2.5 font-mono-tabular whitespace-nowrap">
                    <strong>${s.margin_p50_5y}</strong>/ha
                    <div style={{ fontSize: 10, color: 'var(--ink-muted)' }}>[${s.margin_p10_5y}, ${s.margin_p90_5y}]</div>
                  </td>
                  <td className="py-2 px-2.5 font-mono-tabular whitespace-nowrap">${s.cvar_10_margin_5y}/ha</td>
                  <td className="py-2 px-2 font-mono-tabular whitespace-nowrap">{s.mean_wsi}</td>
                  <td className="py-2 px-2.5 font-mono-tabular whitespace-nowrap">{s.mean_rusle_t_ha} t/ha/yr</td>
                  <td className="py-2 px-2.5 font-mono-tabular whitespace-nowrap font-medium text-[#1C231F]">{s.net_n_5y_kg_ha} kg N | {s.net_soc_5y_t_ha} t C</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4 Detailed Strategy Cards: Why Suggested, Evidence, Benefits, Gaps, Risks for Local Review */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {optimization.strategies.map((s) => (
          <article key={s.archetype} className="swiss-panel p-3">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#DDD9CE]">
              <div>
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wide text-[#1C231F]">{toLocalizedArchetype(s.archetype, lang)}</h3>
                <div className="flex flex-wrap items-center gap-1.5 my-2">
                  {s.sequence_names.map((name, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 bg-[#EFEDE6] border border-[#DDD9CE] text-[#1C231F] rounded-xs">
                      <span className="text-[9px] text-[#767E78]">Y{i+1}</span>
                      <span>{toShortCrop(name, lang)}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium bg-[#E7E4DA] text-[#1C231F] border border-[#DDD9CE] rounded-xs">
                  {s.resilience_tier}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-[#EAF3ED] text-[#265D3D] border border-[#B8D8C3] rounded-xs">
                  {s.priority_alignment_pct ?? 70}% {t('rotation.match')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              {/* Quantified Outcomes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, padding: '6px 8px', background: 'var(--bg-subtle)', borderRadius: 3, textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--ink-tertiary)' }}>{t('rotation.card_5y_margin')}</div>
                  <div className="font-mono-tabular" style={{ fontWeight: 600, color: 'var(--ink-primary)' }}>${s.margin_p50_5y}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--ink-tertiary)' }}>{t('rotation.card_safety_floor')}</div>
                  <div className="font-mono-tabular" style={{ fontWeight: 600, color: 'var(--ink-primary)' }}>${s.cvar_10_margin_5y}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--ink-tertiary)' }}>{t('rotation.card_water_deficit')}</div>
                  <div className="font-mono-tabular" style={{ fontWeight: 600, color: 'var(--accent-hydro)' }}>{s.mean_wsi}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--ink-tertiary)' }}>{t('rotation.card_erosion')}</div>
                  <div className="font-mono-tabular" style={{ fontWeight: 600, color: 'var(--status-stress-fg)' }}>{s.mean_rusle_t_ha} t</div>
                </div>
              </div>

              {/* Agronomic Rationale & Scientific Evidence */}
              {(s.why_suggested || s.rationale) && (
                <div>
                  <strong style={{ fontSize: 11, color: 'var(--ink-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('rotation.why_suggested')}</strong>
                  <p style={{ margin: '3px 0 0', lineHeight: 1.45, color: 'var(--ink-primary)' }}>{s.why_suggested || s.rationale}</p>
                </div>
              )}

              {/* Quantified Benefits */}
              {((s.benefits && s.benefits.length > 0) || (s.quantified_benefits && s.quantified_benefits.length > 0)) && (
                <div>
                  <strong style={{ fontSize: 11, color: 'var(--status-optimal-fg)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('rotation.key_benefits')}</strong>
                  <ul style={{ margin: '3px 0 0', paddingLeft: 16, lineHeight: 1.45 }}>
                    {(s.benefits || s.quantified_benefits || []).map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Scientific Evidence Citations */}
              {(s.supporting_evidence || s.scientific_evidence) && (
                <div style={{ padding: '6px 8px', background: 'var(--bg-subtle)', borderLeft: '3px solid var(--accent-canopy)', fontSize: 11 }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent-canopy)', marginBottom: 2 }}>{t('rotation.scientific_evidence')}</div>
                  {Array.isArray(s.supporting_evidence || s.scientific_evidence) ? (
                    (s.supporting_evidence || s.scientific_evidence).map((ev, idx) => (
                      <div key={idx} style={{ color: 'var(--ink-secondary)', marginTop: 2 }}>
                        {typeof ev === 'object' && ev !== null && ev.source ? (
                          <>
                            &bull; <strong>{ev.source}:</strong> {ev.finding}
                          </>
                        ) : (
                          <>&bull; {String(ev)}</>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--ink-secondary)', marginTop: 2 }}>
                      {String(s.supporting_evidence || s.scientific_evidence)}
                    </div>
                  )}
                </div>
              )}

              {/* Data Gaps & Uncertainty */}
              {((s.information_gaps && s.information_gaps.length > 0) || (s.data_gaps && s.data_gaps.length > 0)) && (
                <div style={{ padding: '6px 8px', background: 'var(--status-gap-bg)', border: '1px solid var(--status-gap-border)', borderRadius: 3, fontSize: 11 }}>
                  <div style={{ fontWeight: 600, color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <HelpCircle size={12} color="var(--status-watch-fg)" /> {t('rotation.data_gaps')}
                  </div>
                  <ul style={{ margin: '3px 0 0', paddingLeft: 16, color: 'var(--ink-secondary)' }}>
                    {(s.information_gaps || s.data_gaps || []).map((g, idx) => (
                      <li key={idx}>{g}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risks for Farmer/Extension Review */}
              {s.risks_for_local_review && s.risks_for_local_review.length > 0 && (
                <div style={{ padding: '6px 8px', background: 'var(--status-watch-bg)', border: '1px solid var(--status-watch-border)', borderRadius: 3, fontSize: 11 }}>
                  <div style={{ fontWeight: 600, color: 'var(--status-watch-fg)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={12} /> {t('rotation.local_review_risks')}
                  </div>
                  <ul style={{ margin: '3px 0 0', paddingLeft: 16, color: 'var(--ink-secondary)' }}>
                    {s.risks_for_local_review.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* Side-by-Side Comparison of Statistical & SI Methodologies */}
      {optimization.si_methods_comparison && (
        <section id="scientific-methodology" className="swiss-panel p-3" style={{ scrollMarginTop: '76px' }}>
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#DDD9CE]">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wide text-[#1C231F]">
              {t('rotation.methodology_title')}
            </h2>
            <span className="text-[10px] font-mono text-[#767E78]">{t('rotation.methodology_sub')}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full text-left text-xs font-mono border-collapse min-w-[560px]">
              <thead>
                <tr className="border-b border-[#DDD9CE] text-[10px] text-[#767E78] bg-[#F6F5F0]">
                  <th className="py-2 px-3 whitespace-nowrap">{t('rotation.th_methodology')}</th>
                  <th className="py-2 px-3 whitespace-nowrap">{t('rotation.th_core_principles')}</th>
                  <th className="py-2 px-3 whitespace-nowrap">{t('rotation.th_data_missions')}</th>
                  <th className="py-2 px-3 whitespace-nowrap">{t('rotation.th_telemetry_findings')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD9CE] text-[#4E5851]">
                {optimization.si_methods_comparison.map((m) => (
                  <tr key={m.methodology}>
                    <td className="py-2 px-3 font-semibold text-[#1C231F] whitespace-nowrap">{m.methodology}</td>
                    <td className="py-2 px-3 text-[11px]">{m.principles}</td>
                    <td className="py-2 px-3 text-[11px] font-medium text-[#234E36]">{m.data_sources}</td>
                    <td className="py-2 px-3 text-[11px]">{m.telemetry_findings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
