import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Crosshair, MapPin, AlertCircle, RefreshCw, Info, Calendar } from 'lucide-react';

// Pre-configured open satellite and cartographic tile layers (zero API keys required)
const TILE_LAYERS = {
  osm: {
    name: 'OpenStreetMap Cartographic',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  },
  trueColor: {
    name: 'NASA GIBS MODIS Terra True Color',
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg',
    attribution: 'NASA Earth Science / GIBS',
    maxZoom: 9
  },
  lstNight: {
    name: 'NASA GIBS MODIS Surface Temp (Thermal)',
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_L3_LandSurfaceTemp_Daily_Day/default/{date}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png',
    attribution: 'NASA GIBS / EOSDIS',
    maxZoom: 7
  },
  soilMoisture: {
    name: 'NASA GIBS SMAP Surface Soil Moisture (L3)',
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/SMAP_L3_Passive_Soil_Moisture_Day/default/{date}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png',
    attribution: 'NASA JPL / SMAP Mission',
    maxZoom: 6
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
  const effectiveCoords = coords || coordinates;
  const handleCoordUpdate = onSelectPoint || onCoordinateChange;
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const polygonLayerRef = useRef(null);
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
    const d = new Date();
    d.setDate(d.getDate() - 2); // 2 days ago for guaranteed composite availability
    return d.toISOString().slice(0, 10);
  });
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState([]);

  // Initialize Leaflet Map Instance once
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

    // Primary basemap
    const baseLayer = L.tileLayer(TILE_LAYERS.osm.url, {
      attribution: TILE_LAYERS.osm.attribution,
      maxZoom: TILE_LAYERS.osm.maxZoom,
      noWrap: true,
      bounds: worldBounds
    }).addTo(map);

    activeTileLayerRef.current = baseLayer;

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

  // Update center & marker when coordinates prop changes
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

    const popupHtml = streaming
      ? `<div style="font-family:'IBM Plex Sans',sans-serif;font-size:12px;min-width:220px;max-width:260px">
           <strong>Sampling Coordinates</strong><br/>
           <span style="font-family:'IBM Plex Mono',monospace">${effectiveCoords.lat.toFixed(4)}, ${effectiveCoords.lon.toFixed(4)}</span><br/>
           <span style="color:#8C5710">Streaming live NASA &amp; Soil telemetry...</span>
         </div>`
      : mapSummary
      ? `<div style="font-family:'IBM Plex Sans',sans-serif;font-size:12px;min-width:220px;max-width:260px;line-height:1.45">
           <strong>${placeLabel || 'Selected Field'}</strong><br/>
           <span style="font-family:'IBM Plex Mono',monospace;color:#4E5851">${effectiveCoords.lat.toFixed(4)}, ${effectiveCoords.lon.toFixed(4)} | Elev ${mapSummary.elevM ?? '--'}m | Slope ${mapSummary.slopePct ?? '--'}%</span>
           <hr style="border:none;border-top:1px solid #DDD9CE;margin:6px 0"/>
           <div><strong>Rainfall vs. Crop Thirst:</strong> ${mapSummary.rainMm} / ${mapSummary.et0Mm} mm/yr</div>
           <div><strong>Uncovered Soil Months:</strong> ${mapSummary.bareMonths?.length ? mapSummary.bareMonths.join(', ') : 'None detected'}</div>
           <div><strong>Recommended Rotation:</strong> ${mapSummary.topStrategy || '--'}</div>
           <button id="view-field-analysis-btn" style="margin-top:8px;width:100%;padding:6px 8px;background:#234E36;color:white;border:none;font-size:11px;font-family:'IBM Plex Mono',monospace;cursor:pointer;font-weight:600;letter-spacing:0.04em">
             VIEW FIELD ANALYSIS &rarr;
           </button>
         </div>`
      : `<div style="font-family:'IBM Plex Sans',sans-serif;font-size:12px;min-width:220px;max-width:260px">Click map to sample field telemetry.</div>`;

    marker.bindPopup(popupHtml, {
      minWidth: 220,
      maxWidth: 260,
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
  }, [effectiveCoords?.lat, effectiveCoords?.lon, placeLabel, mapSummary, streaming, onOpenAnalysis]);

  // Update active layer or satellite composite date
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (activeTileLayerRef.current) {
      map.removeLayer(activeTileLayerRef.current);
    }

    const cfg = TILE_LAYERS[activeLayerKey];
    const url = cfg.url.replace('{date}', selectedDate);
    const layer = L.tileLayer(url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
      noWrap: true
    }).addTo(map);

    activeTileLayerRef.current = layer;
  }, [activeLayerKey, selectedDate]);

  // Update secondary dual-comparison overlay layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (overlayTileLayerRef.current) {
      map.removeLayer(overlayTileLayerRef.current);
      overlayTileLayerRef.current = null;
    }

    if (overlayLayerKey !== 'none' && TILE_LAYERS[overlayLayerKey]) {
      const cfg = TILE_LAYERS[overlayLayerKey];
      const url = cfg.url.replace('{date}', selectedDate);
      const layer = L.tileLayer(url, {
        attribution: cfg.attribution,
        maxZoom: cfg.maxZoom,
        opacity: overlayOpacity,
        noWrap: true
      }).addTo(map);
      overlayTileLayerRef.current = layer;
    }
  }, [overlayLayerKey, overlayOpacity, selectedDate]);

  // Update 3x3 Sub-Field Vulnerability Grid Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (gridLayerRef.current) {
      map.removeLayer(gridLayerRef.current);
      gridLayerRef.current = null;
    }

    if (gridMetric === 'off' || !vulnerabilityGrid || !vulnerabilityGrid.features) return;

    const layer = L.geoJSON(vulnerabilityGrid, {
      style: (feature) => {
        const props = feature.properties || {};
        let color = '#234E36';
        let fillOpacity = 0.35;

        if (gridMetric === 'primary_risk') {
          if (props.primary_risk === 'Erosion') color = '#9E3426';
          else if (props.primary_risk === 'Water Stress') color = '#D97706';
          else color = '#2563EB';
        } else if (gridMetric === 'erosion_risk') {
          const val = props.erosion_risk || 0;
          color = val > 0.6 ? '#9E3426' : val > 0.3 ? '#D97706' : '#234E36';
          fillOpacity = 0.2 + val * 0.45;
        } else if (gridMetric === 'water_stress') {
          const val = props.water_stress || 0;
          color = val > 0.6 ? '#9E3426' : val > 0.3 ? '#D97706' : '#234E36';
          fillOpacity = 0.2 + val * 0.45;
        } else if (gridMetric === 'frost_risk') {
          const val = props.frost_risk || 0;
          color = val > 0.4 ? '#2563EB' : '#767E78';
          fillOpacity = 0.2 + val * 0.4;
        }

        return {
          color: color,
          weight: 1.5,
          fillColor: color,
          fillOpacity: fillOpacity
        };
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties || {};
        layer.bindTooltip(
          `<div style="font-family:'IBM Plex Mono',monospace;font-size:10px;line-height:1.4">
             <strong>Zone: ${p.cell_id}</strong><br/>
             Primary: <span style="font-weight:600">${p.primary_risk}</span><br/>
             Elev: ${p.elevation_m}m | Slope: ${p.slope_pct}%<br/>
             Erosion: ${p.erosion_risk} | Water Deficit: ${p.water_stress}
           </div>`,
          { sticky: true }
        );
      }
    }).addTo(map);

    gridLayerRef.current = layer;
  }, [vulnerabilityGrid, gridMetric]);

  // Parcel delineation polygon rendering
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }

    if (polygonPoints.length > 0) {
      const polygon = L.polygon(polygonPoints, {
        color: '#234E36',
        weight: 2,
        dashArray: isDrawingPolygon ? '4 4' : null,
        fillColor: '#234E36',
        fillOpacity: 0.15
      }).addTo(map);

      polygonLayerRef.current = polygon;

      if (!isDrawingPolygon && polygonPoints.length >= 3 && onParcelChange) {
        // Shoelace polygon area calculation in hectares
        const points = polygonPoints;
        let areaSqMeters = 0;
        const R = 6378137;
        for (let i = 0; i < points.length; i++) {
          const j = (i + 1) % points.length;
          const lat1 = (points[i][0] * Math.PI) / 180;
          const lat2 = (points[j][0] * Math.PI) / 180;
          const lon1 = (points[i][1] * Math.PI) / 180;
          const lon2 = (points[j][1] * Math.PI) / 180;
          areaSqMeters += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
        }
        areaSqMeters = Math.abs((areaSqMeters * R * R) / 2.0);
        const ha = Number((areaSqMeters / 10000).toFixed(2));
        onParcelChange(ha);
      }
    }
  }, [polygonPoints, isDrawingPolygon, onParcelChange]);

  return (
    <div id="field-map" className="relative w-full h-full flex flex-col bg-[#F6F5F0]">
      {/* Docked Top Swiss Control Bar (OUTSIDE Leaflet Canvas to prevent popup collisions) */}
      <div className="w-full bg-white/95 backdrop-blur-sm border-b border-[#DDD9CE] p-2 flex flex-wrap items-center justify-between gap-2 z-[400] text-xs font-mono">
        {/* Basemap Switcher */}
        <div className="flex items-center gap-1">
          <span className="text-[#767E78] text-[10px] uppercase font-semibold mr-1">Basemap:</span>
          <button
            onClick={() => setActiveLayerKey('osm')}
            className={`px-2 py-0.5 text-[11px] rounded-xs transition-colors ${
              activeLayerKey === 'osm'
                ? 'bg-[#234E36] text-white font-medium'
                : 'text-[#4E5851] bg-[#EFEDE6] hover:bg-[#DDD9CE]'
            }`}
          >
            CARTOGRAPHIC
          </button>
          <button
            onClick={() => setActiveLayerKey('trueColor')}
            className={`px-2 py-0.5 text-[11px] rounded-xs transition-colors ${
              activeLayerKey === 'trueColor'
                ? 'bg-[#234E36] text-white font-medium'
                : 'text-[#4E5851] bg-[#EFEDE6] hover:bg-[#DDD9CE]'
            }`}
          >
            NASA TRUE COLOR
          </button>
          <button
            onClick={() => setActiveLayerKey('lstNight')}
            className={`px-2 py-0.5 text-[11px] rounded-xs transition-colors ${
              activeLayerKey === 'lstNight'
                ? 'bg-[#234E36] text-white font-medium'
                : 'text-[#4E5851] bg-[#EFEDE6] hover:bg-[#DDD9CE]'
            }`}
          >
            LST THERMAL
          </button>
          <button
            onClick={() => setActiveLayerKey('soilMoisture')}
            className={`px-2 py-0.5 text-[11px] rounded-xs transition-colors ${
              activeLayerKey === 'soilMoisture'
                ? 'bg-[#234E36] text-white font-medium'
                : 'text-[#4E5851] bg-[#EFEDE6] hover:bg-[#DDD9CE]'
            }`}
          >
            SMAP MOISTURE
          </button>
        </div>

        {/* Secondary Overlay & 3x3 Grid Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-[#767E78] text-[10px] uppercase font-semibold">Overlay:</span>
            <select
              value={overlayLayerKey}
              onChange={(e) => setOverlayLayerKey(e.target.value)}
              className="border border-[#DDD9CE] bg-[#EFEDE6] px-1.5 py-0.5 text-[11px] rounded-xs text-[#1C231F]"
            >
              <option value="none">None</option>
              <option value="trueColor">MODIS True Color</option>
              <option value="lstNight">LST Thermal</option>
              <option value="soilMoisture">SMAP Soil Moisture</option>
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
            <span className="text-[#767E78] text-[10px] uppercase font-semibold">3x3 Grid:</span>
            <select
              value={gridMetric}
              onChange={(e) => setGridMetric(e.target.value)}
              className="border border-[#DDD9CE] bg-[#EFEDE6] px-1.5 py-0.5 text-[11px] rounded-xs text-[#1C231F]"
            >
              <option value="off">Off</option>
              <option value="primary_risk">Primary Risk</option>
              <option value="erosion_risk">Runoff Erosion</option>
              <option value="water_stress">Water Stress Hotspots</option>
              <option value="frost_risk">Topographic Frost</option>
            </select>
          </div>

          {/* Temporal Scrubber if Satellite Layer Active */}
          {(activeLayerKey !== 'osm' || overlayLayerKey !== 'none') && (
            <div className="flex items-center gap-1 border-l border-[#DDD9CE] pl-2 text-[10px]">
              <span className="text-[#767E78] uppercase">Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-[#DDD9CE] px-1 py-0.5 text-[10px] bg-[#EFEDE6] text-[#1C231F] rounded-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* Map Leaflet Target Container */}
      <div ref={mapContainerRef} className="flex-1 w-full relative z-[100]" />

      {/* Docked Bottom Swiss Control Bar & Heatmap Legend */}
      <div className="w-full bg-white/95 backdrop-blur-sm border-t border-[#DDD9CE] p-2 flex flex-wrap items-center justify-between gap-2 z-[400] text-xs font-mono">
        {/* Parcel Delineation Controls */}
        <div className="flex items-center gap-2">
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
            {isDrawingPolygon ? 'FINISH DELINEATION' : 'DELINEATE PARCEL'}
          </button>
          {polygonPoints.length > 0 && (
            <button
              onClick={() => {
                setPolygonPoints([]);
                onParcelChange(null);
              }}
              className="px-1.5 py-0.5 text-[10px] bg-white border border-[#DDD9CE] text-[#767E78] hover:text-[#1C231F] rounded-xs"
            >
              CLEAR
            </button>
          )}
          {parcelAreaHa && (
            <span className="text-[#234E36] font-semibold text-[10px]">
              AREA: {parcelAreaHa} HA
            </span>
          )}
        </div>

        {/* Visible Heatmap & Vulnerability Legend Bar */}
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-[#767E78] uppercase font-semibold">Vulnerability:</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#265D3D] inline-block border border-[#1E4B31]"></span>
            <span className="text-[#265D3D] font-medium">Low Risk</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#8C5710] inline-block border border-[#71460D]"></span>
            <span className="text-[#8C5710] font-medium">Moderate</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#9E3426] inline-block border border-[#7D291E]"></span>
            <span className="text-[#9E3426] font-medium">Severe Hotspot</span>
          </div>
        </div>

        {/* Coordinate & Drawer Trigger */}
        <div className="flex items-center gap-2">
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
              {isDrawerOpen ? 'CLOSE DRAWER' : 'FIELD ANALYSIS &rarr;'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
