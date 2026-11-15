import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Crosshair, MapPin, AlertCircle, RefreshCw, Info, Calendar } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

// Pre-configured open satellite and cartographic tile layers (zero API keys required)
const TILE_LAYERS = {
  osm: {
    name: 'OpenStreetMap Cartographic',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
    maxNativeZoom: 19
  },
  trueColor: {
    name: 'NASA GIBS MODIS Terra True Color',
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg',
    attribution: 'NASA Earth Science / GIBS',
    maxZoom: 18,
    maxNativeZoom: 9
  },
  lstNight: {
    name: 'NASA GIBS MODIS Surface Temp (Thermal)',
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Land_Surface_Temp_Day/default/{date}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png',
    attribution: 'NASA GIBS / EOSDIS',
    maxZoom: 18,
    maxNativeZoom: 7
  },
  soilMoisture: {
    name: 'NASA GIBS SMAP Surface Soil Moisture',
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/SMAP_L4_Analyzed_Root_Zone_Soil_Moisture/default/{date}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png',
    attribution: 'NASA JPL / SMAP Mission',
    maxZoom: 18,
    maxNativeZoom: 6
  }
};

export default function GeospatialMap({
  coordinates,
  coords,
  onCoordinateChange,
  onSelectPoint,
  placeLabel,
  parcelAreaHa,
  onParcelChange,
  mapSummary,
  streaming,
  vulnerabilityGrid,
  onOpenAnalysis,
  isDrawerOpen,
  activeGridMetric,
  onGridMetricChange,
  activeOverlayKey,
  onOverlayKeyChange,
  zoom = 11
}) {
  const { t, lang } = useI18n();
  const effectiveCoords = coords || coordinates;
  const handleCoordUpdate = onSelectPoint || onCoordinateChange;
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const polygonLayerRef = useRef(null);
  const baseTileLayerRef = useRef(null);
  const activeTileLayerRef = useRef(null);
  const overlayTileLayerRef = useRef(null);
  const gridLayerRef = useRef(null);

  const [activeLayerKey, setActiveLayerKey] = useState('osm');
  const [internalOverlayLayerKey, setInternalOverlayLayerKey] = useState('none');
  const [overlayOpacity, setOverlayOpacity] = useState(0.55);
  const [internalGridMetric, setInternalGridMetric] = useState('primary_risk'); // 'off', 'primary_risk', 'erosion_risk', 'water_stress', 'frost_risk'
  
  // Controlled or uncontrolled gridMetric & overlayLayerKey
  const gridMetric = activeGridMetric !== undefined ? activeGridMetric : internalGridMetric;
  const setGridMetric = (val) => {
    setInternalGridMetric(val);
    if (onGridMetricChange) onGridMetricChange(val);
  };

  const overlayLayerKey = activeOverlayKey !== undefined ? activeOverlayKey : internalOverlayLayerKey;
  const setOverlayLayerKey = (val) => {
    setInternalOverlayLayerKey(val);
    if (onOverlayKeyChange) onOverlayKeyChange(val);
  };

  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to 14 days ago for guaranteed NASA GIBS composite tile availability
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().slice(0, 10);
  });

  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState([]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Strict non-wrapping world bounds
    const worldBounds = L.latLngBounds(L.latLng(-85, -180), L.latLng(85, 180));

    const map = L.map(mapContainerRef.current, {
      center: [effectiveCoords.lat, effectiveCoords.lon],
      zoom: zoom,
      minZoom: 3,
      maxZoom: 18,
      maxBounds: worldBounds,
      maxBoundsViscosity: 1.0,
      worldCopyJump: false
    });

    mapInstanceRef.current = map;

    // Permanent underlying Cartographic basemap (always active at zIndex 1)
    const baseLayer = L.tileLayer(TILE_LAYERS.osm.url, {
      attribution: TILE_LAYERS.osm.attribution,
      maxZoom: TILE_LAYERS.osm.maxZoom,
      maxNativeZoom: TILE_LAYERS.osm.maxNativeZoom,
      noWrap: true,
      bounds: worldBounds,
      zIndex: 1
    }).addTo(map);

    baseTileLayerRef.current = baseLayer;

    // Field survey coordinate marker
    const marker = L.circleMarker([effectiveCoords.lat, effectiveCoords.lon], {
      radius: 8,
      fillColor: '#234E36',
      fillOpacity: 0.92,
      color: '#1C231F',
      weight: 2
    }).addTo(map);

    markerRef.current = marker;

    // Map click handler for farm parcel sampling
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      if (isDrawingPolygon) {
        setPolygonPoints((prev) => [...prev, [lat, lng]]);
      } else {
        if (handleCoordUpdate) {
          handleCoordUpdate(lat, lng);
        }
        if (onOpenAnalysis) {
          onOpenAnalysis();
        }
      }
    });

    return () => {
      map.remove();
    };
  }, []);

  // Update center & marker when coordinates prop or language changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !effectiveCoords) return;

    if (markerRef.current) {
      map.removeLayer(markerRef.current);
    }

    const marker = L.circleMarker([effectiveCoords.lat, effectiveCoords.lon], {
      radius: 8,
      color: '#1C231F',
      weight: 2,
      fillColor: '#234E36',
      fillOpacity: 0.92,
    }).addTo(map);

    // Format short legible strategy name (strip Latin names in parentheses)
    const cleanStrategy = mapSummary?.topStrategy
      ? mapSummary.topStrategy.replace(/\s*\([^)]*\)/g, '').trim()
      : '--';

    const popupHtml = streaming
      ? `<div style="font-family:'IBM Plex Sans',sans-serif;font-size:12px;min-width:210px;max-width:270px;word-break:break-word;padding:2px">
           <strong style="color:#234E36;font-size:11px;text-transform:uppercase;letter-spacing:0.04em">${t('map.popup_field_centroid')}</strong><br/>
           <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#4E5851">${effectiveCoords.lat.toFixed(4)}, ${effectiveCoords.lon.toFixed(4)}</span><br/>
           <span style="color:#8C5710;font-size:11px;font-weight:600">${t('advisor.analyzing')}</span>
         </div>`
      : mapSummary
      ? `<div style="font-family:'IBM Plex Sans',sans-serif;font-size:11.5px;min-width:220px;max-width:270px;word-break:break-word;line-height:1.45;padding:2px">
           <strong style="font-size:12px;color:#1C231F">${placeLabel || t('map.popup_field_centroid')}</strong><br/>
           <span style="font-family:'IBM Plex Mono',monospace;color:#4E5851;font-size:10.5px">${effectiveCoords.lat.toFixed(4)}, ${effectiveCoords.lon.toFixed(4)} | Elev ${mapSummary.elevM ?? '--'}m | Slope ${mapSummary.slopePct ?? '--'}%</span>
           <hr style="border:none;border-top:1px solid #DDD9CE;margin:5px 0"/>
           <div style="font-size:11px"><strong style="color:#1F5673">${t('telemetry.legend_rain')}:</strong> ${mapSummary.rainMm} mm/yr</div>
           <div style="font-size:11px"><strong style="color:#8C5710">${t('telemetry.legend_et0')}:</strong> ${mapSummary.et0Mm} mm/yr</div>
           <div style="font-size:11px"><strong style="color:#9E3426">${t('telemetry.legend_bare')}:</strong> ${mapSummary.bareMonths?.length ? mapSummary.bareMonths.join(', ') : '0'}</div>
           <div style="font-size:11px;margin-top:2px"><strong>${t('rotation.th_strategy')}:</strong> <span style="color:#234E36;font-weight:600">${cleanStrategy}</span></div>
           <button id="view-field-analysis-btn" style="margin-top:8px;width:100%;padding:6px 8px;background:#234E36;color:white;border:none;font-size:11px;font-family:'IBM Plex Mono',monospace;cursor:pointer;font-weight:600;letter-spacing:0.04em;border-radius:2px">
             ${t('map.field_analysis')}
           </button>
         </div>`
      : `<div style="font-family:'IBM Plex Sans',sans-serif;font-size:12px;min-width:210px;max-width:270px;word-break:break-word">${t('map.popup_click_tip')}</div>`;

    marker.bindPopup(popupHtml, {
      minWidth: 220,
      maxWidth: 270,
      autoPan: true,
      autoPanPadding: [24, 24]
    }).openPopup();
    
    // Attach listener for the button inside Leaflet popup
    setTimeout(() => {
      const btn = document.getElementById('view-field-analysis-btn');
      if (btn && onOpenAnalysis) {
        btn.onclick = (e) => {
          e.preventDefault();
          onOpenAnalysis();
        };
      }
    }, 50);

    markerRef.current = marker;
    map.panTo([effectiveCoords.lat, effectiveCoords.lon], { animate: true });
  }, [effectiveCoords?.lat, effectiveCoords?.lon, placeLabel, mapSummary, streaming, onOpenAnalysis, lang, t]);

  // ResizeObserver to keep Leaflet canvas size synced with dynamic card expansion
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;

    let rafId = null;
    const ro = new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize({ animate: false });
        }
      });
    });

    ro.observe(el);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  // Also trigger invalidateSize whenever map summary or streaming state updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) {
      const timer = setTimeout(() => {
        map.invalidateSize({ animate: false });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mapSummary, streaming]);
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (activeTileLayerRef.current) {
      map.removeLayer(activeTileLayerRef.current);
      activeTileLayerRef.current = null;
    }

    if (activeLayerKey !== 'osm') {
      const cfg = TILE_LAYERS[activeLayerKey];
      const url = cfg.url.replace('{date}', selectedDate);
      const layer = L.tileLayer(url, {
        attribution: cfg.attribution,
        maxZoom: cfg.maxZoom,
        maxNativeZoom: cfg.maxNativeZoom,
        opacity: activeLayerKey === 'trueColor' ? 1.0 : 0.82,
        zIndex: 10,
        noWrap: true
      }).addTo(map);

      activeTileLayerRef.current = layer;
    }
  }, [activeLayerKey, selectedDate]);

  // Update secondary dual-comparison overlay layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (overlayTileLayerRef.current) {
      map.removeLayer(overlayTileLayerRef.current);
      overlayTileLayerRef.current = null;
    }

    if (overlayLayerKey !== 'none') {
      const cfg = TILE_LAYERS[overlayLayerKey];
      const url = cfg.url.replace('{date}', selectedDate);
      const ovLayer = L.tileLayer(url, {
        attribution: cfg.attribution,
        opacity: overlayOpacity,
        maxZoom: cfg.maxZoom,
        maxNativeZoom: cfg.maxNativeZoom,
        noWrap: true,
        zIndex: 250
      }).addTo(map);
      overlayTileLayerRef.current = ovLayer;
    }
  }, [overlayLayerKey, overlayOpacity, selectedDate]);

  // Render 3x3 Micro-Vulnerability Grid Overlays
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (gridLayerRef.current) {
      map.removeLayer(gridLayerRef.current);
      gridLayerRef.current = null;
    }

    if (gridMetric === 'off' || !vulnerabilityGrid?.cells?.length) {
      return;
    }

    const group = L.layerGroup();

    // Map cell risks with Swiss-palette semi-transparent boxes
    vulnerabilityGrid.cells.forEach((cell) => {
      let fillColor = '#265D3D'; // Low risk
      let fillOpacity = 0.35;
      let label = cell.subgrid_pos;

      if (gridMetric === 'primary_risk') {
        if (cell.primary_risk === 'severe_erosion' || cell.primary_risk === 'water_stress_hotspot') {
          fillColor = '#9E3426';
          fillOpacity = 0.5;
        } else if (cell.primary_risk === 'moderate_erosion' || cell.primary_risk === 'frost_pocket') {
          fillColor = '#8C5710';
          fillOpacity = 0.45;
        }
      } else if (gridMetric === 'erosion_risk') {
        const er = cell.erosion_risk_t_ha_yr || 0;
        if (er > 12) fillColor = '#9E3426';
        else if (er > 6) fillColor = '#8C5710';
        else fillColor = '#265D3D';
        fillOpacity = 0.45;
        label += ` (${er}t)`;
      } else if (gridMetric === 'water_stress') {
        const ws = cell.water_stress_index || 0;
        if (ws > 0.4) fillColor = '#9E3426';
        else if (ws > 0.25) fillColor = '#8C5710';
        else fillColor = '#265D3D';
        fillOpacity = 0.45;
        label += ` (WSI ${ws})`;
      } else if (gridMetric === 'frost_risk') {
        const fr = cell.frost_days_est || 0;
        if (fr > 5) fillColor = '#1F5673';
        else if (fr > 1) fillColor = '#5D8CAE';
        else fillColor = '#265D3D';
        fillOpacity = 0.45;
        label += ` (${fr}d)`;
      }

      const rect = L.rectangle(cell.bounds, {
        color: '#1C231F',
        weight: 1,
        fillColor: fillColor,
        fillOpacity: fillOpacity,
        dashArray: '2, 3'
      });

      const tooltipContent = `
        <div style="font-family:'IBM Plex Mono',monospace;font-size:10px">
          <strong>${cell.subgrid_pos}</strong><br/>
          Elevation: ${cell.elevation_m}m | Slope: ${cell.slope_pct}%<br/>
          Soil: ${cell.soil_texture} (Clay ${cell.clay_pct}%)<br/>
          Erosion: ${cell.erosion_risk_t_ha_yr} t/ha/yr<br/>
          Water Stress (WSI): ${cell.water_stress_index}<br/>
          Primary Alert: ${cell.primary_risk}
        </div>
      `;
      rect.bindTooltip(tooltipContent, { sticky: true, opacity: 0.95 });
      group.addLayer(rect);
    });

    group.addTo(map);
    gridLayerRef.current = group;
  }, [gridMetric, vulnerabilityGrid]);

  // Parcel delineation polygon handler
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }

    if (polygonPoints.length > 0) {
      const poly = L.polygon(polygonPoints, {
        color: '#9E3426',
        weight: 2,
        fillColor: '#9E3426',
        fillOpacity: 0.18,
        dashArray: '4, 4'
      }).addTo(map);

      polygonLayerRef.current = poly;

      // Approximate polygon area in hectares using Shoelace formula on equirectangular projection
      if (polygonPoints.length >= 3 && onParcelChange) {
        let areaSqM = 0;
        const numPoints = polygonPoints.length;
        for (let i = 0; i < numPoints; i++) {
          const [lat1, lon1] = polygonPoints[i];
          const [lat2, lon2] = polygonPoints[(i + 1) % numPoints];
          // meters per degree
          const y1 = lat1 * 111132;
          const x1 = lon1 * 111132 * Math.cos((lat1 * Math.PI) / 180);
          const y2 = lat2 * 111132;
          const x2 = lon2 * 111132 * Math.cos((lat2 * Math.PI) / 180);
          areaSqM += x1 * y2 - x2 * y1;
        }
        const ha = Math.abs(areaSqM) / 2 / 10000;
        onParcelChange(ha.toFixed(2));
      }
    }
  }, [polygonPoints, onParcelChange]);

  return (
    <div id="field-map" style={{ scrollMarginTop: '76px', isolation: 'isolate' }} className="relative z-1 w-full h-full flex-1 flex flex-col bg-[#F6F5F0]">
      {/* Docked Top Swiss Control Bar (2 Neat Non-Overlapping Rows) */}
      <div className="w-full bg-white/95 backdrop-blur-sm border-b border-[#DDD9CE] px-3 py-2 flex flex-col gap-2 z-[400] text-xs font-mono min-w-0 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Basemap Switcher */}
        <div className="flex flex-wrap items-center gap-1 min-w-0">
          <span className="text-[#767E78] text-[10px] uppercase font-semibold mr-1">{t('map.basemap') || 'Basemap:'}</span>
          <button
            onClick={() => setActiveLayerKey('osm')}
            className={`px-2 py-0.5 text-[11px] rounded-xs transition-colors ${
              activeLayerKey === 'osm'
                ? 'bg-[#234E36] text-white font-medium'
                : 'text-[#4E5851] bg-[#EFEDE6] hover:bg-[#DDD9CE]'
            }`}
          >
            {t('map.osm')}
          </button>
          <button
            onClick={() => setActiveLayerKey('trueColor')}
            className={`px-2 py-0.5 text-[11px] rounded-xs transition-colors ${
              activeLayerKey === 'trueColor'
                ? 'bg-[#234E36] text-white font-medium'
                : 'text-[#4E5851] bg-[#EFEDE6] hover:bg-[#DDD9CE]'
            }`}
          >
            {t('map.true_color')}
          </button>
          <button
            onClick={() => setActiveLayerKey('lstNight')}
            className={`px-2 py-0.5 text-[11px] rounded-xs transition-colors ${
              activeLayerKey === 'lstNight'
                ? 'bg-[#234E36] text-white font-medium'
                : 'text-[#4E5851] bg-[#EFEDE6] hover:bg-[#DDD9CE]'
            }`}
          >
            {t('map.lst_night')}
          </button>
          <button
            onClick={() => setActiveLayerKey('soilMoisture')}
            className={`px-2 py-0.5 text-[11px] rounded-xs transition-colors ${
              activeLayerKey === 'soilMoisture'
                ? 'bg-[#234E36] text-white font-medium'
                : 'text-[#4E5851] bg-[#EFEDE6] hover:bg-[#DDD9CE]'
            }`}
          >
            {t('map.soil_moisture')}
          </button>
        </div>
        </div>

        {/* Row 2: Secondary Overlay, 3x3 Grid, and Date Scrubber */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1.5 border-t border-[#EFEDE6] text-[11px] min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[#767E78] text-[10px] uppercase font-semibold">{t('map.overlay')}</span>
            <select
              value={overlayLayerKey}
              onChange={(e) => setOverlayLayerKey(e.target.value)}
              className="border border-[#DDD9CE] bg-white px-2 py-0.5 text-[11px] rounded-xs text-[#1C231F] shadow-xs cursor-pointer focus:outline-none focus:border-[#234E36]"
            >
              <option value="none">{t('map.none')}</option>
              <option value="trueColor">{t('map.modis_true_color')}</option>
              <option value="lstNight">{t('map.lst_thermal')}</option>
              <option value="soilMoisture">{t('map.smap_soil_moisture')}</option>
            </select>
            {overlayLayerKey !== 'none' && (
              <div className="flex items-center space-x-1 pl-1">
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                  className="w-14 h-1 accent-[#234E36]"
                />
                <span className="text-[10px]">{Math.round(overlayOpacity * 100)}%</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 border-l border-[#DDD9CE] pl-2">
            <span className="text-[#767E78] text-[10px] uppercase font-semibold">{t('map.subgrid_mode')}</span>
            <select
              value={gridMetric}
              onChange={(e) => setGridMetric(e.target.value)}
              className="border border-[#DDD9CE] bg-white px-2 py-0.5 text-[11px] rounded-xs text-[#1C231F] shadow-xs cursor-pointer focus:outline-none focus:border-[#234E36]"
            >
              <option value="off">{t('map.grid_off')}</option>
              <option value="primary_risk">{t('map.grid_primary_risk')}</option>
              <option value="erosion_risk">{t('map.grid_erosion_risk')}</option>
              <option value="water_stress">{t('map.grid_water_stress')}</option>
              <option value="frost_risk">{t('map.grid_frost_risk')}</option>
            </select>
          </div>

          {/* Temporal Scrubber if Satellite Layer Active */}
          {(activeLayerKey !== 'osm' || overlayLayerKey !== 'none') && (
            <div className="flex items-center gap-1 border-l border-[#DDD9CE] pl-2 text-[10px]">
              <span className="text-[#767E78] uppercase">{t('map.date')}</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-[#DDD9CE] px-1.5 py-0.5 text-[10px] bg-white text-[#1C231F] rounded-xs shadow-xs focus:outline-none focus:border-[#234E36]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Map Leaflet Target Container with Absolute Inset Fill */}
      <div className="flex-1 w-full relative min-h-[440px] sm:min-h-[480px] lg:min-h-[520px]">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-[100]" />
      </div>

      {/* Active Satellite Thermal/Moisture Dynamic Legend */}
      {(activeLayerKey === 'lstNight' || overlayLayerKey === 'lstNight') && (
        <div className="w-full bg-[#FCFBF9] border-t border-[#DDD9CE] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono z-[350] shrink-0">
          <span className="text-[#767E78] font-semibold uppercase">{t('map.scale_lst')}</span>
          <div className="flex items-center gap-2">
            <span className="text-[#1F5673] font-medium">10°C</span>
            <div className="w-32 h-2.5 rounded-xs border border-[#DDD9CE]" style={{ background: 'linear-gradient(to right, #313695, #74add1, #e0f3f8, #fee090, #f46d43, #a50026)' }} />
            <span className="text-[#9E3426] font-medium">48°C</span>
          </div>
        </div>
      )}
      {(activeLayerKey === 'soilMoisture' || overlayLayerKey === 'soilMoisture') && (
        <div className="w-full bg-[#FCFBF9] border-t border-[#DDD9CE] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono z-[350] shrink-0">
          <span className="text-[#767E78] font-semibold uppercase">{t('map.scale_smap')}</span>
          <div className="flex items-center gap-2">
            <span className="text-[#8C5710] font-medium">0.02 (Dry)</span>
            <div className="w-32 h-2.5 rounded-xs border border-[#DDD9CE]" style={{ background: 'linear-gradient(to right, #ffffcc, #a1dab4, #41b6c4, #225ea8)' }} />
            <span className="text-[#1F5673] font-medium">0.50 (Saturated)</span>
          </div>
        </div>
      )}

      {/* Docked Bottom Swiss Control Bar & Heatmap Legend */}
      <div className="w-full bg-white/95 backdrop-blur-sm border-t border-[#DDD9CE] p-2 flex flex-wrap items-center justify-between gap-2 z-[400] text-xs font-mono min-w-0 shrink-0">
        {/* Parcel Delineation Controls */}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <button
            onClick={() => {
              if (isDrawingPolygon) {
                setIsDrawingPolygon(false);
              } else {
                setPolygonPoints([]);
                setIsDrawingPolygon(true);
              }
            }}
            className={`px-2 py-0.5 text-[10px] font-medium border border-[#DDD9CE] rounded-xs transition-colors ${
              isDrawingPolygon
                ? 'bg-[#9E3426] text-white'
                : 'bg-white text-[#1C231F] hover:bg-[#EFEDE6]'
            }`}
          >
            {isDrawingPolygon ? t('map.finish_delineation') : t('map.delineate_parcel')}
          </button>
          {polygonPoints.length > 0 && (
            <button
              onClick={() => {
                setPolygonPoints([]);
                onParcelChange(null);
              }}
              className="px-1.5 py-0.5 text-[10px] bg-white border border-[#DDD9CE] text-[#767E78] hover:text-[#1C231F] rounded-xs"
            >
              {t('common.clear')}
            </button>
          )}
          {parcelAreaHa && (
            <span className="text-[#234E36] font-semibold text-[10px]">
              {t('common.area')}: {parcelAreaHa} {t('common.ha')}
            </span>
          )}
        </div>

        {/* Visible Heatmap & Vulnerability Legend Bar */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] min-w-0">
          <span className="text-[#767E78] uppercase font-semibold">{t('map.vulnerability')}</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#265D3D] inline-block border border-[#1E4B31]"></span>
            <span className="text-[#265D3D] font-medium">{t('map.low_risk')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#8C5710] inline-block border border-[#71460D]"></span>
            <span className="text-[#8C5710] font-medium">{t('map.moderate')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#9E3426] inline-block border border-[#7D291E]"></span>
            <span className="text-[#9E3426] font-medium">{t('map.severe_hotspot')}</span>
          </div>
        </div>

        {/* Coordinate & Drawer Trigger */}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="text-[10px] text-[#4E5851] bg-[#EFEDE6] px-1.5 py-0.5 border border-[#DDD9CE] rounded-xs">
            {effectiveCoords.lat.toFixed(4)}, {effectiveCoords.lon.toFixed(4)}
          </span>
          {onOpenAnalysis && (
            <button
              onClick={onOpenAnalysis}
              className={`px-2 py-0.5 text-[10px] font-medium rounded-xs border transition-colors ${
                isDrawerOpen
                  ? 'bg-[#1C231F] text-white border-[#1C231F]'
                  : 'bg-[#234E36] text-white border-[#234E36] hover:bg-[#1A3B29]'
              }`}
            >
              {isDrawerOpen ? t('map.close_drawer') : t('map.field_analysis')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
