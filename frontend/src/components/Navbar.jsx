import React, { useState, useEffect, useRef } from 'react';
import { Search, Database, Layers, Sliders, BarChart3, RefreshCw, Crosshair, Map, Calendar, Compass, BookOpen } from 'lucide-react';

export default function Navbar({
  activeStep,
  setActiveStep,
  onLocationSelect,
  onSelectLocation,
  onOpenAuditModal,
  onOpenAudit,
  isRefreshing,
  streaming,
  onRefreshTelemetry,
  coords,
  terrain,
  sourceHealth,
  onPlaceResolved,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [geoPlaceName, setGeoPlaceName] = useState('');

  const handleSelect = onSelectLocation || onLocationSelect;
  const handleAudit = onOpenAudit || onOpenAuditModal;
  const lastGeocodedCoordRef = useRef(null);

  // Live reverse geocoding via Nominatim when coordinates change
  useEffect(() => {
    if (!coords?.lat || !coords?.lon) return;

    const coordKey = `${coords.lat.toFixed(4)},${coords.lon.toFixed(4)}`;
    if (lastGeocodedCoordRef.current === coordKey) return;
    lastGeocodedCoordRef.current = coordKey;

    let isMounted = true;
    const fetchPlaceName = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat.toFixed(5)}&lon=${coords.lon.toFixed(5)}&format=jsonv2`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        if (data && data.address) {
          const parts = [
            data.address.village || data.address.suburb || data.address.town || data.address.city || data.address.county || data.address.district,
            data.address.state || data.address.region,
            data.address.country
          ].filter(Boolean);

          const formatted = parts.length > 0
            ? `${parts.join(', ')} (${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)})`
            : `${data.display_name.split(',').slice(0, 3).join(',')} (${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)})`;

          setGeoPlaceName(formatted);
          if (onPlaceResolved) {
            onPlaceResolved(formatted);
          }
        }
      } catch (e) {
        // Fallback silently if geocoding fails or rate-limited
      }
    };

    fetchPlaceName();
    return () => {
      isMounted = false;
    };
  }, [coords?.lat, coords?.lon, onPlaceResolved]);

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setSearchError('Geolocation unsupported');
      return;
    }
    setIsLocating(true);
    setSearchError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        if (handleSelect) {
          handleSelect(lat, lon, `Farm GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        }
      },
      (err) => {
        setIsLocating(false);
        setSearchError('GPS permission denied');
      },
      { timeout: 8000 }
    );
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    // Check if user entered raw coordinates: e.g. "-6.1630, 35.7516"
    const coordMatch = searchQuery.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[3]);
      if (handleSelect) handleSelect(lat, lon, `Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      setIsSearching(false);
      return;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (handleSelect) handleSelect(lat, lon, data[0].display_name);
      } else {
        setSearchError('Location not resolved');
      }
    } catch (err) {
      setSearchError('Geocoder offline');
    } finally {
      setIsSearching(false);
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-b border-[#DDD9CE] z-[2000] flex items-center justify-between px-3 sm:px-6 shadow-xs">
      {/* Brand & Section Links */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-[#234E36] text-white tracking-widest uppercase rounded-xs">
            NASA
          </span>
          <span className="font-semibold text-sm sm:text-base text-[#1C231F] tracking-tight">
            TERRASHIFT+
          </span>
        </div>

        {/* Section Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1 pl-2 border-l border-[#DDD9CE] text-xs font-mono text-[#4E5851]">
          <button
            onClick={() => scrollToSection('field-map')}
            className="px-2 py-1 hover:text-[#234E36] hover:bg-[#EFEDE6] rounded-xs transition-colors flex items-center gap-1"
          >
            <Map size={12} />
            <span>Field Map</span>
          </button>
          <button
            onClick={() => scrollToSection('climate-drift')}
            className="px-2 py-1 hover:text-[#234E36] hover:bg-[#EFEDE6] rounded-xs transition-colors flex items-center gap-1"
          >
            <Calendar size={12} />
            <span>5-Yr Climate</span>
          </button>
          <button
            onClick={() => scrollToSection('rotations-matrix')}
            className="px-2 py-1 hover:text-[#234E36] hover:bg-[#EFEDE6] rounded-xs transition-colors flex items-center gap-1"
          >
            <Compass size={12} />
            <span>Rotations</span>
          </button>
          <button
            onClick={() => scrollToSection('scientific-methodology')}
            className="px-2 py-1 hover:text-[#234E36] hover:bg-[#EFEDE6] rounded-xs transition-colors flex items-center gap-1"
          >
            <BookOpen size={12} />
            <span>Methodology</span>
          </button>
        </nav>
      </div>

      {/* Coordinate & Place Search Input */}
      <div className="flex items-center space-x-2 flex-1 max-w-xs sm:max-w-md mx-2 sm:mx-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search farm site or lat, lon..."
              className="w-full h-8 pl-8 pr-16 bg-[#EFEDE6] border border-[#DDD9CE] text-xs font-mono text-[#1C231F] placeholder-[#767E78] focus:outline-none focus:border-[#234E36] transition-colors rounded-xs"
            />
            <Search className="w-3.5 h-3.5 text-[#767E78] absolute left-2.5 top-2.5" />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-1 top-1 h-6 px-2 bg-white border border-[#DDD9CE] text-[10px] font-mono font-medium text-[#1C231F] hover:bg-[#E7E4DA] transition-colors disabled:opacity-50 rounded-xs"
            >
              {isSearching ? 'FINDING' : 'RESOLVE'}
            </button>
          </div>
          {searchError && (
            <span className="absolute text-[10px] text-[#9E3426] font-mono mt-0.5">{searchError}</span>
          )}
        </form>

        <button
          type="button"
          onClick={handleUseGps}
          disabled={isLocating}
          title="Detect farm location from device GPS"
          className="h-8 px-2 bg-white border border-[#DDD9CE] text-xs font-mono text-[#234E36] hover:bg-[#E7E4DA] transition-colors flex items-center space-x-1 shrink-0 rounded-xs"
        >
          <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">USE FARM GPS</span>
        </button>
      </div>

      {/* Right Controls: Terrain, Source Health, and Provenance Modal Trigger */}
      <div className="flex items-center space-x-1 sm:space-x-2.5">
        {terrain && (
          <div className="hidden xl:flex items-center space-x-2 text-[11px] font-mono text-[#4E5851] bg-[#EFEDE6] px-2 py-1 border border-[#DDD9CE] rounded-xs">
            <span>Elev: {terrain.elevationM ?? '--'}m</span>
            <span>Slope: {terrain.slopePct ?? '--'}%</span>
          </div>
        )}

        {sourceHealth && (
          <div className="hidden md:flex items-center space-x-1 text-[10px] font-mono">
            <span className={`px-1.5 py-0.5 border rounded-xs ${sourceHealth.climate === 'live' ? 'bg-[#EAF3ED] text-[#265D3D] border-[#B8D8C3]' : 'bg-[#FBF3E4] text-[#8C5710] border-[#E5C99B]'}`}>POWER</span>
            <span className={`px-1.5 py-0.5 border rounded-xs ${sourceHealth.ndvi === 'live' ? 'bg-[#EAF3ED] text-[#265D3D] border-[#B8D8C3]' : 'bg-[#FBF3E4] text-[#8C5710] border-[#E5C99B]'}`}>MODIS</span>
            <span className={`px-1.5 py-0.5 border rounded-xs ${sourceHealth.soil === 'live' ? 'bg-[#EAF3ED] text-[#265D3D] border-[#B8D8C3]' : 'bg-[#EEF0F2] text-[#4D555E] border-[#CFD4D9]'}`}>SOIL</span>
          </div>
        )}

        {/* Scientific Data Provenance Audit Modal Trigger */}
        <button
          onClick={handleAudit}
          className="h-8 px-2.5 bg-[#234E36] text-white text-xs font-mono font-medium hover:bg-[#1A3B29] transition-colors flex items-center space-x-1.5 rounded-xs"
        >
          <Database className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">DATA PROVENANCE</span>
        </button>
      </div>
    </header>
  );
}
