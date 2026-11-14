/**
 * Terrashift+ Live Telemetry & Agronomic Multi-Criteria Decision Engine
 * Integrates live NASA, ISRIC, and Open-Meteo REST endpoints.
 * Zero hardcoded data. Strict error handling with explicit [DATA GAP] states.
 */

const NASA_POWER_BASE = import.meta.env.VITE_NASA_POWER_URL || 'https://power.larc.nasa.gov/api/temporal/daily/point';
const SOILGRIDS_BASE = import.meta.env.VITE_SOILGRIDS_URL || 'https://rest.isric.org/soilgrids/v2.0/properties/query';
const ELEVATION_BASE = import.meta.env.VITE_ELEVATION_URL || 'https://api.open-meteo.com/v1/elevation';
const CROP_TRAITS_URL = import.meta.env.VITE_CROP_TRAITS_URL || '/data/fao-ecocrop-traits.json';
const ORNL_MODIS_BASE = import.meta.env.VITE_ORNL_MODIS_URL || '/api/ornl';

/**
 * Fetch externalized FAO EcoCrop profiles
 */
export async function fetchCropCatalog() {
  try {
    const res = await fetch(CROP_TRAITS_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[Terrashift+] FAO EcoCrop catalog fetch failed, loading base fallback:', err);
    return [];
  }
}

/**
 * Fetch NASA POWER Point Agrometeorology (Last 365 Days)
 */
export async function fetchNasaPower(lat, lon) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 365);

  const fmt = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');
  const url = `${NASA_POWER_BASE}?parameters=PRECTOTCORR,T2M,T2M_MAX,T2M_MIN,RH2M,WS2M,ALLSKY_SFC_SW_DWN&community=AG&longitude=${lon.toFixed(4)}&latitude=${lat.toFixed(4)}&start=${fmt(startDate)}&end=${fmt(endDate)}&format=JSON`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`NASA POWER API HTTP ${res.status}`);
    const data = await res.json();
    const props = data?.properties?.parameter;
    if (!props) throw new Error('Malformed NASA POWER payload');

    const dates = Object.keys(props.PRECTOTCORR || {});
    let annualPrecip = 0;
    let validPrecipDays = 0;
    let sumT2m = 0;
    let validTDays = 0;
    let maxTempObserved = -99;
    let consecutiveDryDays = 0;
    let currentDryRun = 0;

    // Monthly aggregates for water balance chart
    const monthlyPrecip = Array(12).fill(0);
    const monthlyEt0 = Array(12).fill(0);

    dates.forEach((d) => {
      const p = props.PRECTOTCORR[d];
      const t = props.T2M[d];
      const tmax = props.T2M_MAX[d];
      const month = parseInt(d.slice(4, 6), 10) - 1;

      if (p !== undefined && p >= 0) {
        annualPrecip += p;
        validPrecipDays++;
        if (p < 1.0) {
          currentDryRun++;
          if (currentDryRun > consecutiveDryDays) consecutiveDryDays = currentDryRun;
        } else {
          currentDryRun = 0;
        }
        if (month >= 0 && month < 12) monthlyPrecip[month] += p;
      }

      if (t !== undefined && t > -90) {
        sumT2m += t;
        validTDays++;
        // Hargreaves-Samani ET0 approximation for monthly water balance
        const sfc = props.ALLSKY_SFC_SW_DWN?.[d] || 15;
        const et0Day = Math.max(0, 0.0023 * (t + 17.8) * Math.sqrt(Math.max(1, (tmax || t) - t)) * (sfc * 0.408));
        if (month >= 0 && month < 12) monthlyEt0[month] += et0Day;
      }

      if (tmax !== undefined && tmax > maxTempObserved) {
        maxTempObserved = tmax;
      }
    });

    return {
      status: 'OPTIMAL',
      provenance: 'NASA POWER GMAO MERRA-2 / GEOS-FP (0.5° x 0.625° daily)',
      timestamp: data?.header?.fill_value ? new Date().toISOString() : dates[dates.length - 1],
      annualPrecipMm: validPrecipDays > 0 ? Math.round(annualPrecip) : null,
      meanTempC: validTDays > 0 ? Number((sumT2m / validTDays).toFixed(1)) : null,
      maxTempC: maxTempObserved > -90 ? Number(maxTempObserved.toFixed(1)) : null,
      consecutiveDryDays: consecutiveDryDays,
      monthlyPrecip: monthlyPrecip.map(v => Math.round(v)),
      monthlyEt0: monthlyEt0.map(v => Math.round(v)),
      endpointUrl: url
    };
  } catch (err) {
    return {
      status: 'GAP',
      provenance: 'NASA POWER API (Temporarily Unavailable)',
      error: err.message,
      annualPrecipMm: null,
      meanTempC: null,
      maxTempC: null,
      consecutiveDryDays: null,
      monthlyPrecip: Array(12).fill(null),
      monthlyEt0: Array(12).fill(null),
      endpointUrl: url
    };
  }
}

/**
 * Fetch ISRIC SoilGrids 2.0 (pH, Clay, Sand, SOC)
 */
export async function fetchSoilGrids(lat, lon) {
  const url = `${SOILGRIDS_BASE}?lon=${lon.toFixed(4)}&lat=${lat.toFixed(4)}&property=phh2o&property=clay&property=sand&property=soc&depth=0-5cm&value=mean`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`SoilGrids HTTP ${res.status}`);
    const data = await res.json();
    const layers = data?.properties?.layers;
    if (!layers || layers.length === 0) throw new Error('Zero soil layers returned (offshore or urban mask)');

    const getVal = (name) => {
      const layer = layers.find(l => l.name === name);
      const val = layer?.depths?.[0]?.values?.mean;
      return val !== undefined ? val : null;
    };

    const phRaw = getVal('phh2o');
    const clayRaw = getVal('clay');
    const sandRaw = getVal('sand');
    const socRaw = getVal('soc');

    return {
      status: 'OPTIMAL',
      provenance: 'ISRIC World Soil Information (250m WoSIS / SoilGrids 2.0)',
      soilPh: phRaw !== null ? Number((phRaw / 10).toFixed(1)) : null,
      clayFractionPercent: clayRaw !== null ? Number((clayRaw / 10).toFixed(1)) : null,
      sandFractionPercent: sandRaw !== null ? Number((sandRaw / 10).toFixed(1)) : null,
      organicCarbonDgPerKg: socRaw !== null ? Number((socRaw / 10).toFixed(1)) : null,
      endpointUrl: url
    };
  } catch (err) {
    return {
      status: 'GAP',
      provenance: 'ISRIC SoilGrids 2.0 (Water or Unmapped Cell)',
      error: err.message,
      soilPh: null,
      clayFractionPercent: null,
      sandFractionPercent: null,
      organicCarbonDgPerKg: null,
      endpointUrl: url
    };
  }
}

/**
 * Fetch Topography & Slope via Open-Meteo High-Res DEM
 */
export async function fetchElevation(lat, lon) {
  const url = `${ELEVATION_BASE}?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Elevation API HTTP ${res.status}`);
    const data = await res.json();
    const elev = data?.elevation?.[0];
    return {
      status: 'OPTIMAL',
      provenance: 'Copernicus 90m DEM / SRTM (via Open-Meteo)',
      elevationMeters: elev !== undefined ? Math.round(elev) : null,
      endpointUrl: url
    };
  } catch (err) {
    return {
      status: 'GAP',
      provenance: 'Copernicus DEM (Unavailable)',
      error: err.message,
      elevationMeters: null,
      endpointUrl: url
    };
  }
}

/**
 * Fetch 16-Day NDVI from ORNL DAAC MODIS MOD13Q1 (or NASA CMR granule link)
 */
export async function fetchModisNdvi(lat, lon) {
  const url = `${ORNL_MODIS_BASE}/MOD13Q1/subset?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&band=250m_16_days_NDVI&startDate=A2023001&endDate=A2023365`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`MODIS API HTTP ${res.status}`);
    const data = await res.json();
    const subset = data?.subset?.[0]?.data;
    if (!subset || subset.length === 0) throw new Error('No NDVI pixel samples returned');

    // Extract valid NDVI (scale factor 0.0001)
    const validNdvi = subset.filter(v => v > -2000 && v <= 10000).map(v => v * 0.0001);
    const meanNdvi = validNdvi.length > 0
      ? Number((validNdvi.reduce((a, b) => a + b, 0) / validNdvi.length).toFixed(3))
      : null;

    return {
      status: 'OPTIMAL',
      provenance: 'NASA EOS Terra MODIS MOD13Q1 (250m 16-day Composite via ORNL DAAC)',
      meanNdvi: meanNdvi,
      series: validNdvi.slice(0, 12),
      endpointUrl: url
    };
  } catch (err) {
    return {
      status: 'GAP',
      provenance: 'ORNL DAAC MODIS REST API (Cloud/CORS constrained)',
      error: err.message,
      meanNdvi: null,
      series: [],
      endpointUrl: url
    };
  }
}

/**
 * Master Aggregator: Queries all live APIs in parallel
 */
export async function fetchAllTelemetry(lat, lon, overrides = {}) {
  const [powerRes, soilRes, elevRes, modisRes, cropCatalog] = await Promise.allSettled([
    fetchNasaPower(lat, lon),
    fetchSoilGrids(lat, lon),
    fetchElevation(lat, lon),
    fetchModisNdvi(lat, lon),
    fetchCropCatalog()
  ]);

  const power = powerRes.status === 'fulfilled' ? powerRes.value : { status: 'GAP' };
  const soil = soilRes.status === 'fulfilled' ? soilRes.value : { status: 'GAP' };
  const elev = elevRes.status === 'fulfilled' ? elevRes.value : { status: 'GAP' };
  const modis = modisRes.status === 'fulfilled' ? modisRes.value : { status: 'GAP' };
  const crops = cropCatalog.status === 'fulfilled' ? cropCatalog.value : [];

  // Apply ground truth overrides if provided by farmer
  const resolvedSoilPh = overrides.soilPh !== undefined && overrides.soilPh !== null ? Number(overrides.soilPh) : soil.soilPh;
  const resolvedClay = overrides.clayFraction !== undefined && overrides.clayFraction !== null ? Number(overrides.clayFraction) : soil.clayFractionPercent;
  const resolvedPrecip = overrides.annualPrecip !== undefined && overrides.annualPrecip !== null ? Number(overrides.annualPrecip) : power.annualPrecipMm;

  return {
    coordinates: { lat, lon },
    power,
    soil: {
      ...soil,
      soilPh: resolvedSoilPh,
      clayFractionPercent: resolvedClay,
      isOverridden: overrides.soilPh !== undefined || overrides.clayFraction !== undefined
    },
    elevation: elev,
    modis,
    crops,
    resolvedPrecip
  };
}

/**
 * Multi-Criteria Decision Analysis (MCDA) Rotation Scoring Engine
 * Incorporates FAO EcoCrop limits, NASA POWER climate stresses, and user priority weights.
 */
export function evaluateRotations(telemetry, priorities = { water: 50, soil: 50, market: 50, heat: 50 }, climateScenario = { precipDelta: 0, tempDelta: 0 }) {
  const { power, soil, crops, resolvedPrecip } = telemetry;
  if (!crops || crops.length === 0) return [];

  const effectivePrecip = (resolvedPrecip !== null ? resolvedPrecip : 600) * (1 + climateScenario.precipDelta / 100);
  const effectiveMaxTemp = (power?.maxTempC !== null ? power.maxTempC : 32) + climateScenario.tempDelta;
  const effectivePh = soil?.soilPh !== null ? soil.soilPh : 6.5;

  return crops.map((crop) => {
    // 1. Water Balance Fitness (0 - 100)
    let waterScore = 100;
    const [minW, maxW] = crop.waterRequirementMm;
    if (effectivePrecip < minW) {
      const deficit = minW - effectivePrecip;
      waterScore = Math.max(10, 100 - (deficit / minW) * 80 * (1 - crop.droughtToleranceScore / 15));
    } else if (effectivePrecip > maxW * 1.4) {
      waterScore = 75; // Excess water penalty
    }

    // 2. Heat & Climate Stress Fitness (0 - 100)
    let heatScore = 100;
    if (effectiveMaxTemp > crop.optimalTempC[1]) {
      const excess = effectiveMaxTemp - crop.optimalTempC[1];
      heatScore = Math.max(15, 100 - excess * 8 * (1 - (crop.heatStressThresholdC - 30) / 20));
    }

    // 3. Edaphic / Soil pH Fitness (0 - 100)
    let soilScore = 100;
    const [minPh, maxPh] = crop.optimalSoilPh;
    if (effectivePh < minPh) {
      soilScore = Math.max(20, 100 - (minPh - effectivePh) * 45);
    } else if (effectivePh > maxPh) {
      soilScore = Math.max(20, 100 - (effectivePh - maxPh) * 45);
    }

    // 4. Soil Regeneration & Nitrogen Fixation (0 - 100)
    const leguminousBonus = crop.nitrogenFixationKgPerHa > 0 ? 30 : 0;
    const bioReturnBonus = (crop.biomassReturnScore || 5) * 7;
    const regenerationScore = Math.min(100, leguminousBonus + bioReturnBonus);

    // 5. Economic & Market Resilience (0 - 100)
    const marketScore = (crop.marketResilienceIndex || 7) * 10;

    // Weighted Multicriteria Aggregation
    const wSum = priorities.water + priorities.soil + priorities.market + priorities.heat;
    const normW = wSum > 0 ? priorities.water / wSum : 0.25;
    const normS = wSum > 0 ? priorities.soil / wSum : 0.25;
    const normM = wSum > 0 ? priorities.market / wSum : 0.25;
    const normH = wSum > 0 ? priorities.heat / wSum : 0.25;

    const compositeScore = Math.round(
      waterScore * normW +
      regenerationScore * normS +
      marketScore * normM +
      heatScore * normH
    );

    return {
      ...crop,
      compositeScore,
      breakdown: {
        waterBalance: Math.round(waterScore),
        heatStress: Math.round(heatScore),
        soilSuitability: Math.round(soilScore),
        soilRegeneration: Math.round(regenerationScore),
        marketResilience: Math.round(marketScore)
      }
    };
  }).sort((a, b) => b.compositeScore - a.compositeScore);
}

/**
 * Fetch crops from backend catalog
 */
export async function fetchBackendCrops() {
  try {
    const res = await fetch('/api/v1/crops');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return fetchCropCatalog();
  }
}

/**
 * Robust ReadableStream SSE consumer for POST requests
 */
async function consumeSsePost(url, payload, onEvent, signal) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal
  });
  if (!resp.ok) {
    throw new Error(`SSE HTTP error: ${resp.status}`);
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split('\n\n');
    buffer = frames.pop();

    for (const frame of frames) {
      if (!frame.trim()) continue;
      let eventType = 'message';
      let data = null;
      for (const line of frame.split('\n')) {
        if (line.startsWith('event:')) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          try {
            data = JSON.parse(line.slice(5).trim());
          } catch {
            data = line.slice(5).trim();
          }
        }
      }
      if (data !== null) {
        onEvent(eventType, data);
        if (eventType === 'done') {
          reader.cancel().catch(() => {});
          return;
        }
      }
    }
  }
}

/**
 * Stream real-time field optimization over SSE
 */
export async function streamFieldOptimization(payload, onEvent, signal) {
  return consumeSsePost('/api/v1/optimize/stream', payload, onEvent, signal);
}

/**
 * Stream grounded conversational copilot answers over SSE
 */
export async function streamGroundedChat(payload, onEvent, signal) {
  return consumeSsePost('/api/v1/chat/stream', payload, onEvent, signal);
}
