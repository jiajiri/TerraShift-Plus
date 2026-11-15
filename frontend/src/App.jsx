import React, { useCallback, useEffect, useRef, useState } from 'react';
import { fetchBackendCrops, streamFieldOptimization } from './api';
import { useI18n } from './i18n/I18nContext';
import Navbar from './components/Navbar';

import GeospatialMap from './components/GeospatialMap';
import Hero from './components/Hero';
import BenchmarkMatrix from './components/BenchmarkMatrix';
import RotationSimulator from './components/RotationSimulator';
import FieldAdvisorFAB from './components/FieldAdvisorFAB';
import AboutModal from './components/AboutModal';
import FAQ from './components/FAQ';
import Footer from './components/Footer';

const DEFAULT_LAT = Number(import.meta.env.VITE_DEFAULT_LAT ?? -6.163);
const DEFAULT_LON = Number(import.meta.env.VITE_DEFAULT_LON ?? 35.7516);
const DEFAULT_ZOOM = Number(import.meta.env.VITE_DEFAULT_ZOOM ?? 11);

export default function App() {
  const { t, lang } = useI18n();
  const [coords, setCoords] = useState({ lat: DEFAULT_LAT, lon: DEFAULT_LON });
  const [placeLabel, setPlaceLabel] = useState('Central Semiarid Zone (Dodoma, TZ)');
  const [showCalibration, setShowCalibration] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Map layer & grid metric control states (can be manipulated via FAB actions)
  const [mapGridMetric, setMapGridMetric] = useState('primary_risk');
  const [mapOverlayKey, setMapOverlayKey] = useState('none');

  const [crops, setCrops] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [streamLog, setStreamLog] = useState([]);
  const [streamError, setStreamError] = useState(null);

  const [climate, setClimate] = useState(null);
  const [ndvi, setNdvi] = useState(null);
  const [soil, setSoil] = useState(null);
  const [terrain, setTerrain] = useState(null);
  const [vulnerabilityGrid, setVulnerabilityGrid] = useState(null);
  const [optimization, setOptimization] = useState(null);

  const [overrides, setOverrides] = useState({ soilPh: '', clayFraction: '', annualPrecip: '' });
  const [priorities, setPriorities] = useState({ water: 85, heat: 60, soil: 75, market: 70 });
  const [constraints, setConstraints] = useState({
    baselineCropId: 'maize',
    irrigation: 'rainfed',
    noTill: false,
    forageNeeded: true,
    avoidFrost: true,
  });
  const [climatePerturb, setClimatePerturb] = useState({ rainDeltaPct: 0, tempDeltaC: 0 });

  const abortRef = useRef(null);
  const activeRequestIdRef = useRef(0);

  useEffect(() => {
    fetchBackendCrops()
      .then((list) => setCrops(list))
      .catch((err) => setStreamError(err.message));
  }, []);

  const runLiveStream = useCallback(async (lat, lon) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const reqId = ++activeRequestIdRef.current;

    // Atomically reset all data states
    setClimate(null);
    setTerrain(null);
    setNdvi(null);
    setSoil(null);
    setVulnerabilityGrid(null);
    setOptimization(null);
    setStreamLog([]);
    setStreamError(null);
    setStreaming(true);

    const payload = {
      latitude: lat,
      longitude: lon,
      language: lang,
      precip_delta_pct: climatePerturb.rainDeltaPct,
      temp_delta_c: climatePerturb.tempDeltaC,
      soil_overrides: {
        ph: overrides.soilPh !== '' && overrides.soilPh !== undefined ? Number(overrides.soilPh) : null,
        clay_pct: overrides.clayFraction !== '' && overrides.clayFraction !== undefined ? Number(overrides.clayFraction) : null,
        annual_precip_override_mm: overrides.annualPrecip !== '' && overrides.annualPrecip !== undefined ? Number(overrides.annualPrecip) : null,
      },
      constraints: {
        baseline_crop_id: constraints.baselineCropId,
        irrigation_available_mm: constraints.irrigation === 'irrigated' ? 350 : constraints.irrigation === 'supplemental' ? 100 : 0,
        has_no_till_drill: constraints.noTill,
        allow_cover_crops: true,
        forage_needed: constraints.forageNeeded,
        avoid_frost: constraints.avoidFrost,
        priority_water: priorities.water,
        priority_heat: priorities.heat,
        priority_soil: priorities.soil,
        priority_market: priorities.market,
        priorities: {
          water_conservation: (priorities.water || 0) / 100.0,
          heat_tolerance: (priorities.heat || 0) / 100.0,
          soil_health: (priorities.soil || 0) / 100.0,
          income_stability: (priorities.market || 0) / 100.0,
        },
      },
    };

    try {
      await streamFieldOptimization(
        payload,
        (eventName, data) => {
          if (reqId !== activeRequestIdRef.current) return; // drop any packet from superseded requests
          if (eventName === 'step') {
            setStreamLog((prev) => [...prev, { stage: data.stage, status: data.status, duration_ms: data.duration_ms }]);
            if (data.stage === 'climate' && data.status === 'live') setClimate(data.data);
            if (data.stage === 'ndvi' && data.status === 'live') setNdvi(data.data);
            if (data.stage === 'soil') setSoil(data.data);
            if (data.stage === 'terrain' && data.status === 'live') setTerrain(data.data);
            if (data.stage === 'vulnerability_grid' && data.status === 'live') setVulnerabilityGrid(data.data);
          } else if (eventName === 'terrain') {
            setTerrain(data);
          } else if (eventName === 'vulnerability_grid') {
            setVulnerabilityGrid(data);
          } else if (eventName === 'soil') {
            setSoil(data);
          } else if (eventName === 'climate') {
            setClimate(data);
          } else if (eventName === 'ndvi') {
            setNdvi(data);
          } else if (eventName === 'optimization') {
            setStreamLog((prev) => [...prev, { stage: 'ml_pareto', status: 'live', duration_ms: data.duration_ms }]);
            setOptimization(data.result || data);
          } else if (eventName === 'error') {
            setStreamError(data.message);
          }
        },
        controller.signal
      );
    } catch (err) {
      if (err.name !== 'AbortError') setStreamError(err.message);
    } finally {
      if (reqId === activeRequestIdRef.current) setStreaming(false);
    }
  }, [climatePerturb, overrides, constraints, priorities, lang]);

  // Auto-run whenever map coordinates change
  useEffect(() => {
    runLiveStream(coords.lat, coords.lon);
  }, [coords.lat, coords.lon, runLiveStream]);

  const handleSelectLocation = useCallback((lat, lon, label = '') => {
    setCoords({ lat: Number(lat.toFixed(5)), lon: Number(lon.toFixed(5)) });
    setPlaceLabel(label || `Field (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
    setIsDrawerOpen(true);
  }, []);

  const handlePlaceResolved = useCallback((formattedLabel) => {
    if (formattedLabel) {
      setPlaceLabel(formattedLabel);
    }
  }, []);

  const mapSummary = optimization && climate ? {
    elevM: terrain?.elevation_m,
    slopePct: terrain?.slope_pct,
    rainMm: climate.annual_precip_mm,
    et0Mm: climate.annual_et0_mm || (climate.fao56_reference_et_mm_day ? Math.round(climate.fao56_reference_et_mm_day * 365) : 1400),
    bareMonths: optimization.field_diagnosis?.bare_months || [],
    topStrategy: optimization.strategies?.[1]?.sequence_names?.join(' -> '),
  } : null;

  const sourceHealth = {
    climate: climate ? 'live' : 'loading',
    ndvi: ndvi?.available ? 'live' : 'loading',
    soil: soil?.available ? 'live' : 'error',
    ml: optimization ? 'live' : 'loading',
  };

  return (
    <div className="min-h-screen bg-[#F6F5F0] text-[#1C231F] flex flex-col font-sans">
      <Navbar
        coords={coords}
        onSelectLocation={handleSelectLocation}
        onLocationSelect={handleSelectLocation}
        isRefreshing={streaming}
        streaming={streaming}
        onRefreshTelemetry={() => runLiveStream(coords.lat, coords.lon)}
        onPlaceResolved={handlePlaceResolved}
        onOpenAbout={() => setIsAboutModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4 pb-12 space-y-6">
        {streamError && (
          <div style={{ padding: '10px 14px', background: 'var(--status-stress-bg)', border: '1px solid var(--status-stress-border)', color: 'var(--status-stress-fg)', borderRadius: 4, fontSize: 12 }}>
            {t('common.pipeline_notice', { error: streamError })}
          </div>
        )}

        {/* Redesigned Field Status Header Card (Clean on sm, md, and lg) */}
        <div className="swiss-panel p-3 flex flex-col md:flex-row md:items-center justify-between text-xs font-mono gap-2.5">
          {/* Left Block: Location Identity with Unbreakable Monospace Coordinates */}
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#234E36] shrink-0"></span>
            <span className="font-semibold text-[#1C231F] text-xs sm:text-[13px] truncate max-w-[280px] sm:max-w-[400px] lg:max-w-[500px]" title={placeLabel}>
              {placeLabel}
            </span>
            <span className="inline-block px-1.5 py-0.5 bg-[#EFEDE6] border border-[#DDD9CE] text-[#4E5851] text-[11px] font-mono rounded-xs shrink-0 whitespace-nowrap">
              [{coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}]
            </span>
          </div>

          {/* Right Block: Compact Single-Row Telemetry Pills */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {streaming ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FBF3E4] text-[#8C5710] border border-[#E5C99B] font-semibold text-[10px] rounded-xs animate-pulse whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8C5710]"></span>
                <span>{t('advisor.analyzing') || 'Sampling...'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center px-1.5 py-0.5 bg-[#EAF3ED] text-[#265D3D] font-medium text-[10px] border border-[#B8D8C3] rounded-xs whitespace-nowrap">
                {t('common.sample_continuous') || 'Continuous 5Y'}
              </span>
            )}

            {terrain && (
              <span className="px-2 py-0.5 bg-white border border-[#DDD9CE] text-[#4E5851] rounded-xs font-mono text-[10.5px] whitespace-nowrap">
                {t('navbar.elev')}: {terrain.elevation_m}m | {t('navbar.slope')}: {terrain.slope_pct}%
              </span>
            )}

            <div className="flex items-center space-x-1 text-[10px] font-mono shrink-0">
              <span className={`px-1.5 py-0.5 border rounded-xs font-medium ${sourceHealth.climate === 'live' ? 'bg-[#EAF3ED] text-[#265D3D] border-[#B8D8C3]' : 'bg-[#FBF3E4] text-[#8C5710] border-[#E5C99B]'}`}>POWER</span>
              <span className={`px-1.5 py-0.5 border rounded-xs font-medium ${sourceHealth.ndvi === 'live' ? 'bg-[#EAF3ED] text-[#265D3D] border-[#B8D8C3]' : 'bg-[#FBF3E4] text-[#8C5710] border-[#E5C99B]'}`}>MODIS</span>
              <span className={`px-1.5 py-0.5 border rounded-xs font-medium ${sourceHealth.soil === 'live' ? 'bg-[#EAF3ED] text-[#265D3D] border-[#B8D8C3]' : 'bg-[#EEF0F2] text-[#4D555E] border-[#CFD4D9]'}`}>SOIL</span>
            </div>
          </div>
        </div>

        {/* Upper Body: Balanced Responsive 2-Column Grid on Large, Stacked on Med/Small */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Map Column (col-span-7 on desktop, 1fr on md/sm) */}
          <div className="lg:col-span-7 rounded-sm overflow-hidden border border-[#DDD9CE] bg-white shadow-sm flex flex-col h-full min-h-[520px]">
            <GeospatialMap
              coords={coords}
              coordinates={coords}
              placeLabel={placeLabel}
              zoom={DEFAULT_ZOOM}
              mapSummary={mapSummary}
              streaming={streaming}
              vulnerabilityGrid={vulnerabilityGrid}
              onSelectPoint={(lat, lon) => handleSelectLocation(lat, lon)}
              onCoordinateChange={(lat, lon) => handleSelectLocation(lat, lon)}
              isDrawerOpen={false}
              activeGridMetric={mapGridMetric}
              onGridMetricChange={setMapGridMetric}
              activeOverlayKey={mapOverlayKey}
              onOverlayKeyChange={setMapOverlayKey}
            />
          </div>

          {/* Field Vulnerability & Climate Drift Column (col-span-5 on desktop, 1fr on md/sm) */}
          <div className="lg:col-span-5 flex flex-col justify-start">
            <Hero
              streamLog={streamLog}
              streaming={streaming}
              climate={climate}
              ndvi={ndvi}
              soil={soil}
              terrain={terrain}
              optimization={optimization}
            />
          </div>
        </div>

        {/* Toggleable Farmer Ground-Truth Override & Priority Controls */}
        <div className="swiss-panel p-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wide text-[#1C231F]">
                {t('common.ground_truth_calibration_title')}
              </span>
              <p className="text-[11px] text-[#767E78]">
                {t('common.ground_truth_calibration_desc')}
              </p>
            </div>
            <button
              type="button"
              className="h-7 px-3 bg-white border border-[#DDD9CE] text-xs font-mono text-[#1C231F] hover:bg-[#E7E4DA] rounded-xs"
              onClick={() => setShowCalibration((v) => !v)}
            >
              {showCalibration ? t('common.hide_calibration') : t('common.calibrate_constraints')}
            </button>
          </div>

          {showCalibration && (
            <div className="mt-4 pt-4 border-t border-[#DDD9CE]">
              <BenchmarkMatrix
                priorities={priorities}
                onPriorityChange={(k, v) => setPriorities((p) => ({ ...p, [k]: v }))}
                telemetry={{ soil, power: climate }}
                overrides={overrides}
                onOverrideChange={(newOv) => setOverrides((prev) => ({ ...prev, ...newOv }))}
                onResetOverrides={() => setOverrides({ soilPh: '', clayFraction: '', annualPrecip: '' })}
              />
            </div>
          )}
        </div>

        {/* Automatic 4-Strategy Comparison & Evidence/Gaps/Local Review Risks */}
        {streaming && !optimization ? (
          <div className="swiss-panel p-6 flex flex-col items-center justify-center space-y-3 min-h-[220px] animate-pulse">
            <div className="w-8 h-8 rounded-full border-2 border-[#234E36] border-t-transparent animate-spin" />
            <div className="text-xs font-mono font-semibold uppercase tracking-wide text-[#1C231F]">
              Evaluating Agro-Ecological Rotations & Pareto Frontiers...
            </div>
            <p className="text-[11px] font-mono text-[#767E78] text-center max-w-md">
              Sampling NASA POWER, MODIS NDVI, SoilGrids, and SRTM elevation telemetry to construct 5-year multi-objective rotation sequences.
            </p>
          </div>
        ) : (
          <RotationSimulator
            optimization={optimization}
            climate={climate}
            climatePerturb={climatePerturb}
            onChangePerturb={setClimatePerturb}
          />
        )}

        <FAQ
          climate={climate}
          soil={soil}
          terrain={terrain}
          optimization={optimization}
        />
      </main>

      {/* Floating Action Button: Grounded NASA Field Advisor */}
      <FieldAdvisorFAB
        coords={coords}
        placeLabel={placeLabel}
        climate={climate}
        optimization={optimization}
        terrain={terrain}
        vulnerabilityGrid={vulnerabilityGrid}
        fusionGrid={optimization?.common_fusion_grid}
        onSetMapGrid={setMapGridMetric}
        onSetMapOverlay={setMapOverlayKey}
      />

      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />

      <Footer onOpenAbout={() => setIsAboutModalOpen(true)} />
    </div>
  );
}
