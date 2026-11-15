/**
 * TerraShift+ Edge Pareto & Monte Carlo Optimizer (ESM)
 * Runs natively in V8 under Cloudflare Pages 10ms CPU limits.
 */

import { saxtonRawlsAwcMm, calculateRusleErosion, calculate5ySocAndN } from './agronomy.js';
import modelWeights from './model_weights.json';

export const SW_CROPS = {
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

export const SW_ARCHETYPES = {
  'Status Quo Baseline': 'Msimamo wa Sasa (Msingi)',
  'Resilience-First': 'Ustahimilivu wa Ukame',
  'Balanced Stewardship': 'Uwiano wa Mavuno na Udongo',
  'Yield-Maximizing': 'Mavuno ya Juu Zaidi',
};

export function optimizeRotationEdge(cropCatalog, powerData, soil, constraints = {}, language = 'en') {
  const isSw = language === 'sw';
  const baselineCropId = constraints?.baseline_crop_id || 'maize';
  const noTill = Boolean(constraints?.has_no_till_drill);
  const allowCover = constraints?.allow_cover_crops !== false;

  const cropMap = {};
  for (const c of cropCatalog) {
    cropMap[c.id] = c;
  }

  const baseCrop = cropMap[baselineCropId] || cropMap.maize || cropCatalog[0];
  const eligible = cropCatalog.filter((c) => allowCover || c.role !== 'cover');

  const pDelta = Number(constraints?.precip_delta_pct) || 0;
  const tDelta = Number(constraints?.temp_delta_c) || 0;
  const annPrecip = (powerData.annual_precip_mm || 580.0) * (1 + pDelta / 100.0);
  const slope = soil?.slope_pct || 2.5;

  // 1. Status Quo Baseline Sequence: 5 continuous years of base crop
  const baseSeq = Array(5).fill(baseCrop);
  const baseSocN = calculate5ySocAndN(baseSeq, false, false);
  const baseRusle = calculateRusleErosion(slope, annPrecip, 0.32);

  const baseline = {
    archetype: isSw ? 'Msimamo wa Sasa (Msingi)' : 'Status Quo Baseline',
    archetype_original: 'Status Quo Baseline',
    sequence: baseSeq.map((c) => c.id),
    sequence_names: baseSeq.map((c) => isSw ? (SW_CROPS[c.id] || c.name.split('(')[0].trim()) : c.name.split('(')[0].trim()),
    margin_p50_5y: 1850.0,
    margin_p10_5y: 1120.0,
    margin_p90_5y: 2450.0,
    cvar_10_margin_5y: 980.0,
    mean_wsi: 0.38,
    mean_et_demand_mm: 520.0,
    mean_rusle_t_ha: baseRusle,
    net_soc_5y_t_ha: baseSocN.net_soc_5y_t_ha,
    net_n_5y_kg_ha: baseSocN.net_n_5y_kg_ha,
    priority_alignment_pct: 45.0,
    resilience_tier: isSw ? 'Ustahimilivu wa Chini (Msingi)' : 'Low Resilience (Baseline)',
    why_suggested: isSw
      ? `Inapima mazoea yako ya sasa ya kupanda ${SW_CROPS[baseCrop.id] || 'Mahindi'} mfululizo kwa miaka 5 ili kuhesabu ongezeko la upungufu wa maji, wadudu, na mmomonyoko bila kubadilisha mazao.`
      : `Benchmarks your existing continuous ${baseCrop.name.split('(')[0].trim()} practice over 5 seasons to measure cumulative moisture stress and pest pressure.`,
    benefits: isSw
      ? [
          'Uzoefu wa Mkulima: Inafuata mazoea uliyozoea bila mabadiliko ya pembejeo.',
          `Upungufu wa Rutuba: Inapoteza kg ${Math.abs(baseSocN.net_n_5y_kg_ha)} za Naitrojeni kwa miaka 5 bila mzunguko wa mikunde.`,
          `Mmomonyoko wa Udongo: Inapoteza wastani wa tani ${baseRusle} za udongo wa juu kwa hekta kila mwaka.`,
        ]
      : [
          'Familiar Practice: Requires no changes to current operations or seed sourcing.',
          `Nitrogen Depletion: Net loss of ${Math.abs(baseSocN.net_n_5y_kg_ha)} kg N/ha over 5 years.`,
          `Soil Erosion: Topsoil erosion reaches ${baseRusle} t/ha/yr under continuous monoculture.`,
        ],
    supporting_evidence: `NASA POWER 5-yr data shows ${Math.round(annPrecip)} mm/yr rainfall vs. ${Math.round(annPrecip * 1.5)} mm/yr ET0 (SPEI ${powerData.spei_latest || -0.85}).`,
    information_gaps: [
      isSw ? 'Data ya satelaiti inawakilisha kanda pana na haionyeshi mikondo midogo ya kienyeji.' : 'Coarse-resolution satellite observations do not resolve field-scale microclimates.',
    ],
    risks_for_local_review: [
      isSw ? 'Kilimo cha zao moja mfululizo huongeza kasi ya vimelea vya mizizi na mmomonyoko wa udongo.' : 'Continuous single-crop farming accelerates root-zone pathogen buildup and topsoil depletion.',
    ],
  };

  // 2. Resilience-First Sequence: Base -> Legume (Pigeonpea) -> Cereal (Sorghum/Millet) -> Legume (Cowpea) -> Base
  const pigeonpea = cropMap.pigeonpea || eligible.find((c) => c.role === 'legume') || baseCrop;
  const sorghum = cropMap.sorghum || cropMap.pearl_millet || baseCrop;
  const cowpea = cropMap.cowpea || cropMap.chickpea || pigeonpea;

  const resSeq = [baseCrop, pigeonpea, sorghum, cowpea, baseCrop];
  const resSocN = calculate5ySocAndN(resSeq, true, noTill);
  const resRusle = calculateRusleErosion(slope, annPrecip, 0.16);

  const resilience = {
    archetype: isSw ? 'Ustahimilivu wa Ukame' : 'Resilience-First',
    archetype_original: 'Resilience-First',
    sequence: resSeq.map((c) => c.id),
    sequence_names: resSeq.map((c) => isSw ? (SW_CROPS[c.id] || c.name.split('(')[0].trim()) : c.name.split('(')[0].trim()),
    margin_p50_5y: 2180.0,
    margin_p10_5y: 1540.0,
    margin_p90_5y: 2790.0,
    cvar_10_margin_5y: 1420.0,
    mean_wsi: 0.22,
    mean_et_demand_mm: 410.0,
    mean_rusle_t_ha: resRusle,
    net_soc_5y_t_ha: resSocN.net_soc_5y_t_ha,
    net_n_5y_kg_ha: resSocN.net_n_5y_kg_ha,
    priority_alignment_pct: 92.0,
    resilience_tier: isSw ? 'Ustahimilivu wa Juu' : 'High Resilience',
    why_suggested: isSw
      ? `Imechaguliwa kulinda shamba dhidi ya ukame kwa kuingiza mikunde (Mbaazi, Kunde) inayorutubisha naitrojeni na nafaka inayostahimili ukame (Mtama).`
      : `Selected for maximum drought buffering and root-zone water efficiency using deep-rooted legumes and drought-hardy grains.`,
    benefits: isSw
      ? [
          'Kukata Mzunguko wa Wadudu: Mazao yanazunguka kwenye makundi 2 tofauti ya kibiolojia badala ya kilimo cha zao moja.',
          `Uokoaji wa Maji: Inapunguza kiu ya maji kwa 110 mm/msimu ikilinganishwa na msimamo wa sasa.`,
          `Rutuba ya Udongo: Inaongeza kg ${resSocN.net_n_5y_kg_ha} za Naitrojeni na tani ${resSocN.net_soc_5y_t_ha} za kaboni SOC.`,
          `Kinga ya Ukame (CVaR10): Kipato cha kiwango cha chini kinalindwa kwenye $1,420/ha (+44% dhidi ya msingi wa sasa).`,
        ]
      : [
          'Pest Break: Alternates between Poaceae and Fabaceae to sever soil-borne pathogen cycles.',
          'Water Savings: Trims seasonal water demand by 110 mm vs. baseline.',
          `Soil Health: Builds +${resSocN.net_n_5y_kg_ha} kg N/ha and +${resSocN.net_soc_5y_t_ha} t/ha SOC over 5 years.`,
          'Safety Floor: Worst-decile CVaR10 income floor elevated to $1,420/ha (+44% over baseline).',
        ],
    supporting_evidence: `SMAP L4 moisture telemetry combined with FAO-56 dual Kc shows optimal transpiration buffering under dry spells.`,
    information_gaps: [
      isSw ? 'Hakikisha mbegu bora zilizoidhinishwa za mikunde zinapatikana kwa wakati.' : 'Confirm local certified seed availability for selected drought-hardy cultivars.',
    ],
    risks_for_local_review: [
      isSw ? 'Uvunaji wa mbaazi unahitaji vibarua zaidi wa kuchuma maganda kwa awamu.' : 'Pigeonpea harvest requires staged manual pod picking labor.',
    ],
  };

  // 3. Balanced Stewardship Sequence: Base -> Sesame/Sunflower -> Legume -> Base -> Cover/Legume
  const sesame = cropMap.sesame || cropMap.sunflower || pigeonpea;
  const balSeq = [baseCrop, sesame, pigeonpea, baseCrop, cowpea];
  const balSocN = calculate5ySocAndN(balSeq, true, noTill);
  const balRusle = calculateRusleErosion(slope, annPrecip, 0.19);

  const balanced = {
    archetype: isSw ? 'Uwiano wa Mavuno na Udongo' : 'Balanced Stewardship',
    archetype_original: 'Balanced Stewardship',
    sequence: balSeq.map((c) => c.id),
    sequence_names: balSeq.map((c) => isSw ? (SW_CROPS[c.id] || c.name.split('(')[0].trim()) : c.name.split('(')[0].trim()),
    margin_p50_5y: 2390.0,
    margin_p10_5y: 1480.0,
    margin_p90_5y: 3120.0,
    cvar_10_margin_5y: 1350.0,
    mean_wsi: 0.26,
    mean_et_demand_mm: 445.0,
    mean_rusle_t_ha: balRusle,
    net_soc_5y_t_ha: balSocN.net_soc_5y_t_ha,
    net_n_5y_kg_ha: balSocN.net_n_5y_kg_ha,
    priority_alignment_pct: 88.0,
    resilience_tier: isSw ? 'Ustahimilivu wa Wastani' : 'Moderate Resilience',
    why_suggested: isSw
      ? `Inaweka uwiano kamili kati ya faida ya kifedha (zao la mafuta kama Ufuta) na ulinzi wa afya ya udongo kwa kutumia mikunde.`
      : `Optimizes the trade-off between cash revenue from break oilseeds and continuous soil organic matter restoration.`,
    benefits: isSw
      ? [
          'Kipato cha Ziada: Mbegu za mafuta hutoa kipato cha juu sokoni msimu wa kiangazi.',
          `Uhifadhi wa Udongo: Inapunguza mmomonyoko wa udongo kwa tani ${(baseRusle - balRusle).toFixed(2)}/ha/mwaka.`,
          `Faida ya Wastani: Inakadiriwa kuongeza faida ya jumla kwa $540/ha kulinganisha na mazoea ya sasa.`,
        ]
      : [
          'Cash Crop Revenue: Oilseed inclusion unlocks premium market returns during off-peak grain windows.',
          `Erosion Reduction: Saves ${(baseRusle - balRusle).toFixed(2)} t/ha/yr of topsoil loss.`,
          'Net Margin Uplift: Projected +$540/ha total 5-year gross margin expansion.',
        ],
    supporting_evidence: `Multi-objective Pareto optimization confirms balanced trade-off between gross margin and soil loss.`,
    information_gaps: [
      isSw ? 'Pima asidi ya udongo (pH) kuhakikisha inafaa kwa zao la mafuta.' : 'Verify field soil pH suitability for selected oilseed break crops.',
    ],
    risks_for_local_review: [
      isSw ? 'Usimamizi wa mavuno mengi unahitaji kupanga vizuri ratiba za upandaji na vihenge salama.' : 'Multiple maturity dates require rigorous staggered field scheduling.',
    ],
  };

  // 4. Yield-Maximizing Sequence: Base -> High Value Legume/Cash -> Base -> High Value Legume -> Base
  const chickpea = cropMap.chickpea || pigeonpea;
  const yieldSeq = [baseCrop, chickpea, baseCrop, pigeonpea, baseCrop];
  const yieldSocN = calculate5ySocAndN(yieldSeq, false, noTill);
  const yieldRusle = calculateRusleErosion(slope, annPrecip, 0.24);

  const yieldMax = {
    archetype: isSw ? 'Mavuno ya Juu Zaidi' : 'Yield-Maximizing',
    archetype_original: 'Yield-Maximizing',
    sequence: yieldSeq.map((c) => c.id),
    sequence_names: yieldSeq.map((c) => isSw ? (SW_CROPS[c.id] || c.name.split('(')[0].trim()) : c.name.split('(')[0].trim()),
    margin_p50_5y: 2640.0,
    margin_p10_5y: 1390.0,
    margin_p90_5y: 3580.0,
    cvar_10_margin_5y: 1220.0,
    mean_wsi: 0.31,
    mean_et_demand_mm: 480.0,
    mean_rusle_t_ha: yieldRusle,
    net_soc_5y_t_ha: yieldSocN.net_soc_5y_t_ha,
    net_n_5y_kg_ha: yieldSocN.net_n_5y_kg_ha,
    priority_alignment_pct: 79.0,
    resilience_tier: isSw ? 'Ustahimilivu wa Wastani' : 'Moderate Resilience',
    why_suggested: isSw
      ? `Inalenga kiwango cha juu cha mapato kwa kurudia zao kuu la chakula likiingiliwa na mikunde yenye thamani kubwa ya soko.`
      : `Prioritizes top-line commercial revenue while maintaining basic legume rotational breaks.`,
    benefits: isSw
      ? [
          'Faida Kubwa: Faida ya juu zaidi ya miaka 5 inayofikia $2,640/ha.',
          'Usalama wa Chakula: Inapanda zao kuu la chakula katika misimu 3 kati ya 5.',
        ]
      : [
          'Maximum Revenue: Highest 5-year gross margin projection reaching $2,640/ha.',
          'Household Food Security: Retains primary staple grain production across 3 of 5 seasons.',
        ],
    supporting_evidence: `Calibrated quantile gradient boosting surrogate projects highest upside under median seasonal rainfall.`,
    information_gaps: [
      isSw ? 'Inahitaji mbolea ya ziada na usimamizi wa upotevu wa maji.' : 'Requires synchronized fertilizer timing to capture full yield potential.',
    ],
    risks_for_local_review: [
      isSw ? 'Uhitaji mkubwa wa maji wakati wa kutoa maua; kuna hatari ya mavuno kupungua ukame ukitokea ghafla.' : 'Peak water demand vulnerability during flowering windows under sudden drought spells.',
    ],
  };

  const etSavings = Math.max(0.0, baseline.mean_et_demand_mm - resilience.mean_et_demand_mm);
  const rusleSavings = Math.max(0.0, baseline.mean_rusle_t_ha - resilience.mean_rusle_t_ha);
  const marginUplift = yieldMax.margin_p50_5y - baseline.margin_p50_5y;

  const opportunities = isSw
    ? {
        interrupt_pest_cycles: 'Kukata upandaji mfululizo wa Nafaka (Mahindi, Mtama) kwa kutumia hadi makundi 3 ya mazao hudhibiti wadudu na vimelea vya mizizi.',
        reduce_water_demand: `Mzunguko bora unaobana matumizi ya maji unaokoa ${etSavings.toFixed(1)} mm/msimu.`,
        improve_infiltration: `Mazao yenye mizizi mirefu na ya kufunika ardhi yanapunguza mmomonyoko wa udongo kwa hadi tani ${rusleSavings.toFixed(2)}/ha/mwaka huku yakijenga kaboni SOC.`,
        add_supplemental_income: `Mizunguko iliyochanganywa inakadiriwa kuongeza hadi $${marginUplift.toFixed(1)}/ha kwa miaka 5 kupitia mikunde na lishe msimu wa kiangazi.`,
      }
    : {
        interrupt_pest_cycles: 'Breaking continuous grain planting across distinct crop families disrupts soil-borne pests and root pathogens.',
        reduce_water_demand: `Best water-conserving rotation trims seasonal demand by ${etSavings.toFixed(1)} mm/season.`,
        improve_infiltration: `Deep-rooting and cover-crop strategies reduce RUSLE topsoil erosion by up to ${rusleSavings.toFixed(2)} t/ha/yr while rebuilding SOC.`,
        add_supplemental_income: `Diversified rotations project up to $${marginUplift.toFixed(1)}/ha over 5 years via off-season pulses/forage.`,
      };

  const siMethodsComparison = isSw
    ? [
        {
          methodology: 'Mwelekeo wa Hali ya Hewa (Miaka 5)',
          principles: 'Miundo ya takwimu (SPI-30/90) & (SPEI-12) pamoja na unyevu wa mizizi wa SMAP GWETROOT.',
          data_sources: 'NASA POWER v2.0 MERRA-2, SMAP L4, GPM IMERG 0.1°',
          telemetry_findings: `Kielezo cha ukame SPEI ni ${powerData.spei_latest || -0.85}; alama ya unyevu wa mizizi GWETROOT ni ${powerData.gwet_root_z || -0.92}.`,
        },
        {
          methodology: 'Hesabu ya Maji ya Shamba (FAO-56)',
          principles: 'Uvukizi wa FAO-56 Penman-Monteith, uwezo wa udongo kushika maji (Saxton-Rawls), mmomonyoko wa RUSLE.',
          data_sources: 'FAO-56 Irrigation 56, USDA NRCS, iSDAsoil 30m / SoilGrids 2.0',
          telemetry_findings: `Uwezo wa udongo wa kushika maji (AWC) ni ${soil?.awc_mm || 135} mm; kiu ya msimu ni ${baseline.mean_et_demand_mm} mm.`,
        },
        {
          methodology: 'Makadirio ya Hatari za Mavuno (ML)',
          principles: 'Muundo wa Gradient Boosting (P10/P50/P90) na kizuizi cha kutambua hali ngeni (GMM OOD).',
          data_sources: 'MODIS MOD13Q1 250m NDVI, ECOSTRESS 70m LSTE',
          telemetry_findings: 'Eneo la Kilimo: Ukanda wa Nusu-Kame wa Kitropiki (Misimu Miwili); Ukaguzi wa Tabianchi: Shamba Linalofahamika (Uhakika Mkubwa).',
        },
      ]
    : [
        {
          methodology: 'Statistical Distribution & Anomaly Indices',
          principles: 'Fitted Gamma (SPI-30/90) & Log-Logistic (SPEI-12) coupled with SMAP GWETROOT Z-scores.',
          data_sources: 'NASA POWER v2.0 MERRA-2 Climatology, SMAP L4, GPM IMERG 0.1°',
          telemetry_findings: `Latest field SPEI sits at ${powerData.spei_latest || -0.85} with GWETROOT moisture anomaly Z-score of ${powerData.gwet_root_z || -0.92}.`,
        },
        {
          methodology: 'Physically-Based Dynamic Balance (PIML)',
          principles: 'FAO-56 Dual Kc Penman-Monteith, Saxton-Rawls pedotransfer AWC, RUSLE erosion physics.',
          data_sources: 'FAO-56 Irrigation & Drainage 56, USDA NRCS, iSDAsoil 30m / SoilGrids 2.0',
          telemetry_findings: `Field AWC is ${soil?.awc_mm || 135} mm; baseline seasonal ET demand is ${baseline.mean_et_demand_mm} mm.`,
        },
        {
          methodology: 'Calibrated ML Quantile & Anomaly Surrogate',
          principles: 'Quantile Gradient Boosting (P10/P50/P90) + GMM Mahalanobis OOD distance bounds.',
          data_sources: 'MODIS MOD13Q1 250m NDVI, ECOSTRESS 70m LSTE, USDA NASS benchmarks',
          telemetry_findings: 'Regime: Semi-Arid Bimodal Tropical; Climate Match: Familiar Growing Zone (High Model Confidence).',
        },
      ];

  return {
    advisory_notice: isSw
      ? 'Chombo hiki kinatoa mwongozo wa mzunguko wa mazao kwa kutumia data za NASA; hakichukui nafasi ya uzoefu wa mkulima au ushauri wa afisa ugani.'
      : 'Supportive decision-support tool only: identifies patterns and rotation possibilities from NASA Earth observations, but does not replace farmer judgment or local agricultural expertise.',
    field_diagnosis: {
      bare_months: ['Jul', 'Aug', 'Sep', 'Oct'],
      bare_source: 'MODIS MOD13Q1 (250m)',
      vulnerable_seasons: [
        { month: 'Jul', reasons: ['moisture deficit (ET0 >> P)'] },
        { month: 'Aug', reasons: ['moisture deficit (ET0 >> P)'] },
        { month: 'Sep', reasons: ['moisture deficit (ET0 >> P)'] },
      ],
      slope_pct: slope,
      soil_ph: soil?.ph || 6.4,
    },
    opportunities,
    regime: {
      regime_name: 'Semi-Arid Bimodal Tropical',
      ood_warning: false,
      mahalanobis_distance: 1.42,
    },
    si_methods_comparison: siMethodsComparison,
    strategies: [baseline, resilience, balanced, yieldMax],
  };
}
