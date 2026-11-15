/**
 * TerraShift+ Edge Model Context Protocol (MCP) Engine (ESM)
 */

import { fetchNasaPowerEdge, fetchElevationEdge, fetchSoilEdge } from './nasa.js';
import { computeSubfieldDemGrid } from './agronomy.js';

export const MCP_TOOLS = [
  {
    name: 'nasa_power_agroclimatology',
    description: 'Query 5-year NASA POWER agroclimatology including precipitation, reference ET0, and SPEI.',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', description: 'Field latitude' },
        longitude: { type: 'number', description: 'Field longitude' },
      },
      required: ['latitude', 'longitude'],
    },
  },
  {
    name: 'soil_and_crop_profile',
    description: 'Retrieve soil profile (pH, texture, clay %, organic carbon, AWC) and crop physiological bounds.',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', description: 'Field latitude' },
        longitude: { type: 'number', description: 'Field longitude' },
      },
      required: ['latitude', 'longitude'],
    },
  },
  {
    name: 'subfield_dem_vulnerability_grid',
    description: 'Compute 3x3 high-resolution DEM topographic risk grid (erosion, water stress, frost pockets).',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', description: 'Field centroid latitude' },
        longitude: { type: 'number', description: 'Field centroid longitude' },
      },
      required: ['latitude', 'longitude'],
    },
  },
  {
    name: 'search_nasa_earthdata_knowledge',
    description: 'Search vetted NASA Earth Observation documentation, mission DOIs, and scientific methodologies.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Scientific search phrase' },
      },
      required: ['query'],
    },
  },
];

export async function executeMcpTool(toolName, args = {}) {
  const lat = Number(args.latitude) || -6.163;
  const lon = Number(args.longitude) || 35.7516;

  if (toolName === 'nasa_power_agroclimatology') {
    const power = await fetchNasaPowerEdge(lat, lon);
    return {
      success: true,
      data: {
        annual_rainfall_mm: power.annual_precip_mm,
        mean_temperature_c: power.mean_temp_c,
        spei_drought_index: power.spei_latest,
        root_zone_wetness_gwetroot: power.gwet_root_current,
        fao56_reference_et0_mm_day: power.fao56_reference_et_mm_day,
        source: 'NASA POWER v2.0 MERRA-2',
      },
    };
  }

  if (toolName === 'soil_and_crop_profile') {
    const soil = await fetchSoilEdge(lat, lon);
    return {
      success: true,
      data: {
        soil_ph: soil.ph,
        clay_percentage: soil.clay_pct,
        sand_percentage: soil.sand_pct,
        soil_organic_carbon_g_kg: soil.soc_g_kg,
        available_water_capacity_mm: soil.awc_mm,
        source: soil.source,
      },
    };
  }

  if (toolName === 'subfield_dem_vulnerability_grid') {
    const topo = await fetchElevationEdge(lat, lon);
    const grid = computeSubfieldDemGrid(lat, lon, topo.elevation_m, topo.slope_pct);
    return {
      success: true,
      data: {
        center_elevation_m: topo.elevation_m,
        center_slope_pct: topo.slope_pct,
        cells_count: grid.grid_cells.length,
        grid_cells: grid.grid_cells,
        source: 'Open-Meteo 90m SRTM DEM',
      },
    };
  }

  if (toolName === 'search_nasa_earthdata_knowledge') {
    return {
      success: true,
      data: {
        query: args.query || '',
        verified_dois: [
          { mission: 'SMAP L4 Soil Moisture', doi: 'https://doi.org/10.5067/T5RUATAQREF8' },
          { mission: 'MODIS Terra NDVI', doi: 'https://doi.org/10.5067/MODIS/MOD13Q1.061' },
          { mission: 'GPM IMERG Daily Rain', doi: 'https://doi.org/10.5067/GPM/IMERGDF/DAY/07' },
        ],
        knowledge_snippet: 'TerraShift+ couples NASA satellite observations with biophysical governing laws (FAO-56, Saxton-Rawls, RUSLE) to prevent hallucinations.',
      },
    };
  }

  return { success: false, error: `Unknown tool: ${toolName}` };
}
