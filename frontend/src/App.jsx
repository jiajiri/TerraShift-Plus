import React, { useCallback, useEffect, useRef, useState } from 'react';
import { fetchBackendCrops, streamFieldOptimization } from './api';
import Navbar from './components/Navbar';
import GeospatialMap from './components/GeospatialMap';
import Hero from './components/Hero';
import BenchmarkMatrix from './components/BenchmarkMatrix';
import RotationSimulator from './components/RotationSimulator';
import FieldAdvisorFAB from './components/FieldAdvisorFAB';
import PresentationModal from './components/PresentationModal';
import FAQ from './components/FAQ';
import Footer from './components/Footer';

const DEFAULT_LAT = Number(import.meta.env.VITE_DEFAULT_LAT ?? -6.163);
const DEFAULT_LON = Number(import.meta.env.VITE_DEFAULT_LON ?? 35.7516);
const DEFAULT_ZOOM = Number(import.meta.env.VITE_DEFAULT_ZOOM ?? 11);

export default function App() {
  const [coords, setCoords] = useState({ lat: DEFAULT_LAT, lon: DEFAULT_LON });
  const [placeLabel, setPlaceLabel] = useState('Central Semiarid Zone (Dodoma, TZ)');
  const [showCalibration, setShowCalibration] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
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

  useEffect(() => {
    fetchBackendCrops()
      .then((list) => setCrops(list))
      .catch((err) => setStreamError(err.message));
  }, []);

  const runLiveStream = useCallback(async (lat, lon) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStreaming(true);
    setStreamError(null);
    setStreamLog([]);
    // Reset previous point data so stale summary is not shown while new point loads
    setClimate(null);
    setTerrain(null);
    setNdvi(null);
    setSoil(null);
    setVulnerabilityGrid(null);
    setOptimization(null);

    const payload = {
      latitude: lat,
      longitude: lon,
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
          if (eventName === 'step') {
            setStreamLog((prev) => [...prev, { stage: data.stage, status: data.status, duration_ms: data.duration_ms }]);
            if (data.stage === 'climate' && data.status === 'live') setClimate(data.data);
            if (data.stage === 'ndvi' && data.status === 'live') setNdvi(data.data);
            if (data.stage === 'soil') setSoil(data.data);
            if (data.stage === 'terrain' && data.status === 'live') setTerrain(data.data);
            if (data.stage === 'vulnerability_grid' && data.status === 'live') setVulnerabilityGrid(data.data);
          } else if (eventName === 'optimization') {
            setStreamLog((prev) => [...prev, { stage: 'ml_pareto', status: 'live', duration_ms: data.duration_ms }]);
            setOptimization(data.result);
          } else if (eventName === 'error') {
            setStreamError(data.message);
          }
        },
        controller.signal
      );
    } catch (err) {
      if (err.name !== 'AbortError') setStreamError(err.message);
    } finally {
      setStreaming(false);
    }
  }, [climatePerturb, overrides, constraints, priorities]);

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
        terrain={terrain ? { elevationM: terrain.elevation_m, slopePct: terrain.slope_pct } : null}
        sourceHealth={sourceHealth}
        onSelectLocation={handleSelectLocation}
        onLocationSelect={handleSelectLocation}
        onOpenAudit={() => setIsAuditModalOpen(true)}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
        isRefreshing={streaming}
        streaming={streaming}
        onRefreshTelemetry={() => runLiveStream(coords.lat, coords.lon)}
        onPlaceResolved={handlePlaceResolved}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-20 pb-12 space-y-6">
        {streamError && (
          <div style={{ padding: '10px 14px', background: 'var(--status-stress-bg)', border: '1px solid var(--status-stress-border)', color: 'var(--status-stress-fg)', borderRadius: 4, fontSize: 12 }}>
            Pipeline Notice: {streamError}
          </div>
        )}

        {/* Active Location Info Bar */}
        <div className="swiss-panel p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-mono gap-2">
          <div>
            <span className="text-[#767E78]">ACTIVE FIELD LOCATION: </span>
            <span className="font-semibold text-[#1C231F]">{placeLabel}</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] text-[#4E5851]">
            <span>LAT: {coords.lat.toFixed(4)}</span>
            <span>LON: {coords.lon.toFixed(4)}</span>
            <span className="px-1.5 py-0.5 bg-[#EAF3ED] text-[#265D3D] font-semibold rounded-xs">
              SAMPLE: CONTINUOUS
            </span>
          </div>
        </div>

        {/* Top Row: Map Prominent & Full-Width with Docked Swiss Controls */}
        <div className="relative w-full rounded-sm overflow-hidden border border-[#DDD9CE] bg-white shadow-sm" style={{ height: '580px' }}>
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
            onOpenAnalysis={() => setIsDrawerOpen(true)}
            isDrawerOpen={isDrawerOpen}
            activeGridMetric={mapGridMetric}
            onGridMetricChange={setMapGridMetric}
            activeOverlayKey={mapOverlayKey}
            onOverlayKeyChange={setMapOverlayKey}
          />

          {/* Animated Slide-in Telemetry & Vulnerability Drawer from Right to Center */}
          <div
            className={`absolute top-0 right-0 h-full w-full sm:w-[500px] md:w-[560px] bg-[#F6F5F0] border-l border-[#DDD9CE] shadow-2xl z-[450] transform transition-transform duration-300 ease-in-out overflow-y-auto p-4 ${
              isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <Hero
              streamLog={streamLog}
              streaming={streaming}
              climate={climate}
              ndvi={ndvi}
              soil={soil}
              terrain={terrain}
              optimization={optimization}
              onClose={() => setIsDrawerOpen(false)}
              onOpenProvenance={() => setIsAuditModalOpen(true)}
            />
          </div>
        </div>

        {/* Toggleable Farmer Ground-Truth Override & Priority Controls */}
        <div className="swiss-panel p-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wide text-[#1C231F]">
                Ground-Truth Calibration &amp; Farm Constraints
              </span>
              <p className="text-[11px] text-[#767E78]">
                Adjust soil tests, irrigation access, or priority weights to refine the PIML Pareto optimizer.
              </p>
            </div>
            <button
              type="button"
              className="h-7 px-3 bg-white border border-[#DDD9CE] text-xs font-mono text-[#1C231F] hover:bg-[#E7E4DA] rounded-xs"
              onClick={() => setShowCalibration((v) => !v)}
            >
              {showCalibration ? 'HIDE CALIBRATION' : 'CALIBRATE CONSTRAINTS'}
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
        <RotationSimulator
          optimization={optimization}
          climate={climate}
          climatePerturb={climatePerturb}
          onChangePerturb={setClimatePerturb}
        />

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
        onSetMapGrid={setMapGridMetric}
        onSetMapOverlay={setMapOverlayKey}
        onOpenProvenance={() => setIsAuditModalOpen(true)}
      />

      <PresentationModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        telemetry={{ power: climate, soil, elevation: terrain, modis: ndvi, coordinates: coords }}
      />

      <Footer />
    </div>
  );
}
