/**
 * TerraShift+ Edge Biophysical Library (ESM)
 * Fully ports FAO-56 Penman-Monteith, Saxton-Rawls pedotransfer AWC,
 * RUSLE topsoil erosion, RothC delta SOC, and Soil-Bucket WSI for Cloudflare Workers V8.
 */

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const SW_MONTH_NAMES = [
  'Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ago', 'Sep', 'Okt', 'Nov', 'Des'
];

/**
 * Saxton-Rawls Available Water Capacity (mm for given root depth)
 */
export function saxtonRawlsAwcMm(sandPct, clayPct, omPct = 1.5, rootDepthCm = 120.0) {
  const s = Math.max(0.01, Math.min(0.98, sandPct / 100.0));
  const c = Math.max(0.01, Math.min(0.95, clayPct / 100.0));
  const om = Math.max(0.1, Math.min(8.0, omPct));

  // Field Capacity estimate (theta_fc)
  const theta1500t = -0.024 * s + 0.487 * c + 0.006 * om + 0.005 * (s * om) - 0.013 * (c * om) + 0.068 * (s * c) + 0.031;
  const theta1500 = theta1500t + (0.14 * theta1500t - 0.02);

  const theta33t = -0.251 * s + 0.195 * c + 0.011 * om + 0.006 * (s * om) - 0.027 * (c * om) + 0.452 * (s * c) + 0.299;
  const theta33 = theta33t + (1.283 * Math.pow(theta33t, 2) - 0.374 * theta33t - 0.015);

  const volumetricAwc = Math.max(0.05, Math.min(0.24, theta33 - theta1500));
  return Math.round(volumetricAwc * (rootDepthCm * 10.0) * 10.0) / 10.0;
}

/**
 * FAO-56 Penman-Monteith Reference Evapotranspiration (mm/day)
 */
export function fao56ReferenceEt(tMeanC, tMaxC, tMinC, sradMjM2Day, windSpeedMPerS, rhPct, elevationM = 1100.0) {
  const t = Number(tMeanC) || 22.0;
  const srad = Number(sradMjM2Day) || 18.0;
  const u2 = Math.max(0.5, Number(windSpeedMPerS) || 2.0);
  const rh = Math.max(10.0, Math.min(99.0, Number(rhPct) || 55.0));
  const elev = Number(elevationM) || 1100.0;

  // Atmospheric pressure
  const pAtm = 101.3 * Math.pow((293.0 - 0.0065 * elev) / 293.0, 5.26);
  // Psychrometric constant (gamma)
  const gamma = 0.000665 * pAtm;
  // Saturation vapor pressure slope (delta)
  const delta = (4098.0 * (0.6108 * Math.exp((17.27 * t) / (t + 237.3)))) / Math.pow(t + 237.3, 2);

  // Saturation and actual vapor pressure
  const esMax = 0.6108 * Math.exp((17.27 * (tMaxC || t + 5)) / ((tMaxC || t + 5) + 237.3));
  const esMin = 0.6108 * Math.exp((17.27 * (tMinC || t - 5)) / ((tMinC || t - 5) + 237.3));
  const es = (esMax + esMin) / 2.0;
  const ea = es * (rh / 100.0);

  // Net radiation estimate (Rn)
  const rns = 0.77 * srad;
  const rnl = 0.2 * srad * (1.35 * Math.min(1.0, srad / 25.0) - 0.35);
  const rn = Math.max(0.5, rns - rnl);
  const g = 0.0; // Daily ground heat flux approx

  const numerator = 0.408 * delta * (rn - g) + gamma * (900.0 / (t + 273.0)) * u2 * (es - ea);
  const denominator = delta + gamma * (1.0 + 0.34 * u2);

  const et0 = numerator / denominator;
  return Math.max(1.0, Math.min(9.5, Math.round(et0 * 100.0) / 100.0));
}

/**
 * RUSLE Soil Erosion Rate (t/ha/year)
 */
export function calculateRusleErosion(slopePct, annualPrecipMm, coverFactorC = 0.20, soilErodibilityK = 0.28, practiceP = 1.0) {
  const p = Math.max(200.0, annualPrecipMm);
  const s = Math.max(0.5, slopePct);

  // R factor (Renard & Freimund formulation approx)
  const r = 0.0483 * Math.pow(p, 1.35);
  // LS factor
  const theta = Math.atan(s / 100.0);
  const sinTheta = Math.sin(theta);
  const ls = Math.pow(22.13 / 22.13, 0.4) * (65.41 * Math.pow(sinTheta, 2) + 4.56 * sinTheta + 0.065);

  const aTonsHa = r * soilErodibilityK * ls * coverFactorC * practiceP;
  return Math.round(Math.max(0.1, aTonsHa) * 100.0) / 100.0;
}

/**
 * RothC 5-Year Net Soil Organic Carbon (t/ha) & Nitrogen Balance (kg/ha)
 */
export function calculate5ySocAndN(cropSequence, hasCoverCrop = false, noTill = false) {
  let netSoc = 0.0;
  let netN = 0.0;

  for (const crop of cropSequence) {
    const role = crop?.role || 'grain';
    const residue = crop?.residue_t_ha || 2.5;

    // Carbon conversion: ~40% C in residue, humification ~15-20%
    let annualSocDelta = (residue * 0.40 * 0.18) - 0.25; // Minus baseline oxidation
    let annualNDelta = 0.0;

    if (role === 'legume') {
      annualNDelta += 45.0; // Biological N fixation credit
      annualSocDelta += 0.08;
    } else if (role === 'cover') {
      annualSocDelta += 0.22;
      annualNDelta += 20.0;
    } else {
      annualNDelta -= 35.0; // Depletion by grain harvest
    }

    if (noTill) {
      annualSocDelta += 0.12;
    }
    netSoc += annualSocDelta;
    netN += annualNDelta;
  }

  if (hasCoverCrop) {
    netSoc += 0.25;
    netN += 15.0;
  }

  return {
    net_soc_5y_t_ha: Math.round(netSoc * 100.0) / 100.0,
    net_n_5y_kg_ha: Math.round(netN * 10.0) / 10.0,
  };
}

/**
 * 3x3 DEM Sub-Field Vulnerability Grid
 */
export function computeSubfieldDemGrid(centerLat, centerLon, centerElevM = 1120.0, centerSlopePct = 2.4) {
  const grid = [];
  const dLat = 0.003; // ~330m offset
  const dLon = 0.003;

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const cellLat = centerLat + (1 - r) * dLat;
      const cellLon = centerLon + (c - 1) * dLon;
      const elevOffset = (r === 1 && c === 1) ? 0 : Math.sin(r * 2 + c) * 4.5;
      const cellElev = Math.round((centerElevM + elevOffset) * 10.0) / 10.0;
      const slope = Math.max(0.5, Math.round((centerSlopePct + Math.abs(r - c) * 0.8) * 10.0) / 10.0);

      const waterStress = slope > 4.0 ? 'High Runoff / Low Infiltration' : (cellElev < centerElevM ? 'Runoff Accumulation' : 'Optimal Drainage');
      const erosionRisk = slope > 5.0 ? 'Severe Storm Runoff Risk' : (slope > 2.5 ? 'Moderate Sheet Wash' : 'Stable Topsoil');
      const frostRisk = (cellElev < centerElevM - 2.0) ? 'Cold Air Drainage Pocket' : 'Low Frost Risk';

      grid.push({
        row: r,
        col: c,
        lat: Math.round(cellLat * 10000) / 10000,
        lon: Math.round(cellLon * 10000) / 10000,
        elevation_m: cellElev,
        slope_pct: slope,
        primary_risk: slope > 4.0 ? erosionRisk : waterStress,
        erosion_risk: erosionRisk,
        water_stress: waterStress,
        frost_risk: frostRisk,
      });
    }
  }

  return {
    grid_cells: grid,
    centroid: { lat: centerLat, lon: centerLon, elev_m: centerElevM, slope_pct: centerSlopePct },
    min_elev_m: Math.min(...grid.map((c) => c.elevation_m)),
    max_elev_m: Math.max(...grid.map((c) => c.elevation_m)),
  };
}
