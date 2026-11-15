import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Image as ImageIcon, Map as MapIcon, ExternalLink, RefreshCw } from 'lucide-react';

/**
 * High-Clarity Mini Field Map & NASA Worldview Snapshot Dual-View Widget
 * Renders inside the Field Advisor chat bubbles with 0 blur, ESRI World Imagery,
 * NASA GIBS SMAP L4 layer overlay, and HD Snapshot API fallback.
 */
export default function MiniSatelliteView({
  lat = -6.163,
  lon = 35.7516,
  layerType = 'smap',
  gwetMean = 0.38,
  ph = 6.4,
  clay = 24.0,
  nsidcUrl = 'https://nsidc.org/data/spl4smgp',
  nsidcDoi = 'https://doi.org/10.5067/T5RUATAQREF8',
  onViewFullMap
}) {
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'snapshot'
  const [imgDateOffset, setImgDateOffset] = useState(14);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Compute snapshot date (today - imgDateOffset days)
  const d = new Date();
  d.setDate(d.getDate() - imgDateOffset);
  const snapshotDate = d.toISOString().slice(0, 10);

  // HD Snapshot URL from NASA Worldview Snapshots API
  const bbox = `${(lat - 1.2).toFixed(4)},${(lon - 1.2).toFixed(4)},${(lat + 1.2).toFixed(4)},${(lon + 1.2).toFixed(4)}`;
  const snapshotUrl = `https://wvs.earthdata.nasa.gov/api/v1/snapshot?REQUEST=GetSnapshot&TIME=${snapshotDate}&BBOX=${bbox}&CRS=EPSG:4326&LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor,SMAP_L4_Analyzed_Root_Zone_Soil_Moisture,Coastlines_15m,Reference_Features_15m&FORMAT=image/png&WIDTH=640&HEIGHT=360`;

  // Initialize interactive Leaflet mini map when viewMode === 'map'
  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [lat, lon],
      zoom: 11,
      minZoom: 4,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: true,
      touchZoom: true
    });
    mapInstanceRef.current = map;

    // Crisp high-resolution base imagery: ESRI World Imagery
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18,
      maxNativeZoom: 18,
      zIndex: 1
    }).addTo(map);

    // NASA GIBS SMAP L4 Layer Overlay
    L.tileLayer(
      `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/SMAP_L4_Analyzed_Root_Zone_Soil_Moisture/default/${snapshotDate}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,
      {
        maxNativeZoom: 6,
        maxZoom: 18,
        opacity: 0.65,
        zIndex: 10
      }
    ).addTo(map);

    // Reference labels on top
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
      zIndex: 20
    }).addTo(map);

    // Center Field Pin Marker
    const icon = L.divIcon({
      className: 'mini-field-pin',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;">
          <div style="position: absolute; width: 24px; height: 24px; border: 2px solid #2563EB; border-radius: 50%; background: rgba(37, 99, 235, 0.25); animation: pulse 2s infinite;"></div>
          <div style="width: 8px; height: 8px; background: #2563EB; border: 2px solid #FFFFFF; border-radius: 50%;"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    L.marker([lat, lon], { icon }).addTo(map);

    // Invalidate size after mount to prevent blank tiles
    const timer = setTimeout(() => {
      map.invalidateSize({ animate: false });
    }, 120);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [viewMode, lat, lon, snapshotDate]);

  return (
    <div className="my-2.5 p-2.5 bg-white border border-[#DDD9CE] rounded-sm text-[10px] font-mono shadow-xs">
      {/* Header bar with Mode Toggles */}
      <div className="flex items-center justify-between text-[#767E78] mb-1.5 font-sans font-semibold">
        <div className="flex items-center gap-1 text-[#1C231F]">
          <Layers size={13} className="text-[#2563EB]" />
          <span>NASA SMAP L4 Satellite Composite</span>
        </div>

        {/* Dual Mode Switcher */}
        <div className="flex items-center bg-[#EFEDE6] border border-[#DDD9CE] rounded-xs p-0.5 font-mono text-[9.5px]">
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`px-1.5 py-0.5 rounded-xs flex items-center gap-1 transition-colors ${
              viewMode === 'map' ? 'bg-[#234E36] text-white' : 'text-[#4E5851] hover:text-[#1C231F]'
            }`}
          >
            <MapIcon size={10} />
            <span>Interactive Map</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('snapshot');
              setImgLoading(true);
              setImgError(false);
            }}
            className={`px-1.5 py-0.5 rounded-xs flex items-center gap-1 transition-colors ${
              viewMode === 'snapshot' ? 'bg-[#234E36] text-white' : 'text-[#4E5851] hover:text-[#1C231F]'
            }`}
          >
            <ImageIcon size={10} />
            <span>NASA HD Snapshot</span>
          </button>
        </div>
      </div>

      {/* Map / Snapshot Canvas */}
      <div className="relative h-44 w-full bg-[#EFEDE6] border border-[#DDD9CE] rounded-xs overflow-hidden">
        {viewMode === 'map' ? (
          <div ref={mapContainerRef} className="w-full h-full" style={{ isolation: 'isolate' }} />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center bg-black/5">
            {imgLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#EFEDE6] text-[#767E78] text-[10px] font-mono">
                Loading NASA Worldview Snapshot ({snapshotDate})...
              </div>
            )}
            <img
              src={snapshotUrl}
              alt="NASA Worldview HD Snapshot"
              className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setImgLoading(false)}
              onError={() => {
                setImgLoading(false);
                setImgError(true);
                // Step back 5 days if this date lacks a full granule
                if (imgDateOffset < 35) setImgDateOffset((prev) => prev + 5);
              }}
            />
            {imgError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-2 bg-[#FDF2F0] text-[#9E3426] text-center">
                <span>Retrying prior satellite pass...</span>
                <button
                  onClick={() => {
                    setImgError(false);
                    setImgLoading(true);
                    setImgDateOffset((prev) => prev + 5);
                  }}
                  className="mt-1 px-2 py-0.5 bg-white border border-[#DDD9CE] text-[9px] flex items-center gap-1"
                >
                  <RefreshCw size={10} /> Retry with -5 days
                </button>
              </div>
            )}
          </div>
        )}

        {/* Location & Overlay Badge */}
        <div className="absolute bottom-1.5 left-1.5 bg-black/75 backdrop-blur-xs text-white text-[8.5px] px-1.5 py-0.5 rounded-xs font-mono pointer-events-none z-[400]">
          {lat.toFixed(4)}, {lon.toFixed(4)} | {viewMode === 'map' ? 'ESRI Imagery + SMAP L4' : `Worldview Snapshot (${snapshotDate})`}
        </div>

        {/* Root Wetness Pill */}
        <div className="absolute top-1.5 right-1.5 bg-white/95 border border-[#B8D8C3] text-[#265D3D] text-[9px] px-1.5 py-0.5 rounded-xs font-mono font-semibold shadow-xs z-[400]">
          GWET: {gwetMean}
        </div>
      </div>

      {/* SMAP Dry-to-Saturated Color Gradient */}
      <div className="mt-2 space-y-1">
        <div className="flex justify-between text-[8px] text-[#767E78]">
          <span>Dry (0.02)</span>
          <span>Saxton-Rawls Sandy Clay Loam (pH {ph}, Clay {clay}%)</span>
          <span>Saturated (0.50)</span>
        </div>
        <div
          className="w-full h-2 rounded-xs border border-[#DDD9CE]"
          style={{ background: 'linear-gradient(to right, #ffffcc, #a1dab4, #41b6c4, #225ea8)' }}
        />
      </div>

      {/* Footer Links & Map Synchronization */}
      <div className="mt-2 pt-1 flex justify-between items-center text-[9px] text-[#767E78] border-t border-[#EFEDE6]">
        <a
          href={nsidcDoi}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#2563EB] hover:underline flex items-center gap-1 font-semibold"
          title="Open Official NSIDC SMAP L4 Dataset Catalog (Version 8)"
        >
          <ExternalLink size={10} /> NSIDC DOI: 10.5067/T5RUATAQREF8
        </a>
        <button
          type="button"
          onClick={() => {
            if (onViewFullMap) onViewFullMap();
            const el = document.getElementById('field-map');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="text-[9.5px] font-mono text-[#234E36] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <MapIcon size={10} /> View on Full Map →
        </button>
      </div>
    </div>
  );
}
