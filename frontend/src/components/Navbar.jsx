import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Crosshair,
  Map,
  Calendar,
  Compass,
  BookOpen,
  FileText,
  Menu,
  X,
  Info,
  AlertCircle
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export default function Navbar({
  onLocationSelect,
  onSelectLocation,
  isRefreshing,
  streaming,
  coords,
  onPlaceResolved,
  onOpenAbout,
}) {
  const { lang, setLang, t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResultsDropdown, setShowResultsDropdown] = useState(false);

  const handleSelect = onSelectLocation || onLocationSelect;
  const lastGeocodedCoordRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Live reverse geocoding via Nominatim when coordinates change
  useEffect(() => {
    if (!coords?.lat || !coords?.lon) return;

    const coordKey = `${coords.lat.toFixed(4)},${coords.lon.toFixed(4)}`;
    if (lastGeocodedCoordRef.current === coordKey) return;
    lastGeocodedCoordRef.current = coordKey;

    let isMounted = true;
    const fetchPlaceName = async () => {
      try {
        const acceptLang = lang === 'sw' ? 'sw,en;q=0.8' : 'en,sw;q=0.8';
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat.toFixed(5)}&lon=${coords.lon.toFixed(5)}&format=jsonv2`,
          {
            headers: {
              'Accept': 'application/json',
              'Accept-Language': acceptLang
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
            ? parts.join(', ')
            : data.display_name.split(',').slice(0, 3).join(', ');

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
  }, [coords?.lat, coords?.lon, lang, onPlaceResolved]);

  // Close mobile drawer and search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowResultsDropdown(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowResultsDropdown(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleUseGps = () => {
    setSearchError(null);
    if (!navigator.geolocation) {
      setSearchError(t('navbar.gps_unsupported'));
      return;
    }

    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setSearchError(t('navbar.gps_insecure'));
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const label = t('navbar.farm_gps', { lat: lat.toFixed(4), lon: lon.toFixed(4) });
        if (handleSelect) {
          handleSelect(lat, lon, label);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          // PERMISSION_DENIED
          setSearchError(t('navbar.gps_denied'));
        } else if (err.code === 3) {
          // TIMEOUT
          setSearchError(t('navbar.gps_timeout'));
        } else {
          setSearchError(t('navbar.gps_denied'));
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  const handleSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError(null);
    setShowResultsDropdown(false);

    // Direct Coordinate check: e.g. "-6.1630, 35.7516" or "-6.1630 35.7516"
    const coordMatch = query.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[3]);
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        if (handleSelect) handleSelect(lat, lon, t('navbar.coordinates', { lat: lat.toFixed(4), lon: lon.toFixed(4) }));
        setIsSearching(false);
        return;
      }
    }

    // Geocoding query via Nominatim OSM
    try {
      const acceptLang = lang === 'sw' ? 'sw,en;q=0.8' : 'en,sw;q=0.8';
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': acceptLang
        }
      });
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      if (data && data.length > 0) {
        if (data.length === 1) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          const shortName = data[0].display_name.split(',').slice(0, 3).join(', ');
          if (handleSelect) handleSelect(lat, lon, shortName);
        } else {
          setSearchResults(data);
          setShowResultsDropdown(true);
        }
      } else {
        setSearchError(t('navbar.location_not_resolved'));
      }
    } catch (err) {
      setSearchError(t('navbar.geocoder_offline'));
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const shortName = item.display_name.split(',').slice(0, 3).join(', ');
    setSearchQuery(shortName);
    setShowResultsDropdown(false);
    if (handleSelect) handleSelect(lat, lon, shortName);
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-[3000] w-full max-w-full bg-white/95 backdrop-blur-md border-b border-[#DDD9CE] shadow-xs box-border">
      {/* ========================================================= */}
      {/* ROW 1: CLEAN TOP NAVIGATION (56px)                        */}
      {/* ========================================================= */}
      <div className="h-14 max-w-7xl mx-auto w-full flex items-center justify-between px-4 sm:px-6">
        {/* Left: Brand mark + Desktop Nav Links */}
        <div className="flex items-center space-x-4 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-[#234E36] text-white tracking-widest uppercase rounded-xs">
              {t('common.nasa')}
            </span>
            <span className="font-semibold text-base text-[#1C231F] tracking-tight">
              {t('common.app_title')}
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-[#DDD9CE] text-xs font-mono text-[#4E5851]">
            <button
              onClick={() => scrollToSection('field-map')}
              className="px-2.5 py-1 hover:text-[#234E36] hover:bg-[#EFEDE6] rounded-xs transition-colors flex items-center gap-1.5"
            >
              <Map size={13} />
              <span>{t('navbar.field_map')}</span>
            </button>
            <button
              onClick={() => scrollToSection('climate-drift')}
              className="px-2.5 py-1 hover:text-[#234E36] hover:bg-[#EFEDE6] rounded-xs transition-colors flex items-center gap-1.5"
            >
              <Calendar size={13} />
              <span>{t('navbar.climate_drift')}</span>
            </button>
            <button
              onClick={() => scrollToSection('rotations-matrix')}
              className="px-2.5 py-1 hover:text-[#234E36] hover:bg-[#EFEDE6] rounded-xs transition-colors flex items-center gap-1.5"
            >
              <Compass size={13} />
              <span>{t('navbar.rotations')}</span>
            </button>
            <button
              onClick={() => scrollToSection('scientific-methodology')}
              className="px-2.5 py-1 hover:text-[#234E36] hover:bg-[#EFEDE6] rounded-xs transition-colors flex items-center gap-1.5"
            >
              <BookOpen size={13} />
              <span>{t('navbar.methodology')}</span>
            </button>
            {onOpenAbout && (
              <button
                onClick={onOpenAbout}
                className="px-2.5 py-1 hover:text-[#234E36] hover:bg-[#EFEDE6] rounded-xs transition-colors flex items-center gap-1.5"
              >
                <Info size={13} />
                <span>{t('navbar.about_us')}</span>
              </button>
            )}
          </nav>
        </div>

        {/* Right: [EN | SW] Toggle + Research Paper Button + Mobile Hamburger */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center bg-[#EFEDE6] border border-[#DDD9CE] rounded-xs p-0.5 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 rounded-xs transition-colors font-medium ${
                lang === 'en'
                  ? 'bg-[#234E36] text-white shadow-xs'
                  : 'text-[#4E5851] hover:text-[#1C231F]'
              }`}
              title="Switch to English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('sw')}
              className={`px-2 py-0.5 rounded-xs transition-colors font-medium ${
                lang === 'sw'
                  ? 'bg-[#234E36] text-white shadow-xs'
                  : 'text-[#4E5851] hover:text-[#1C231F]'
              }`}
              title="Badili kwenda Kiswahili (Tanzania)"
            >
              SW
            </button>
          </div>

          <a
            href="/research-paper.pdf"
            target="_blank"
            rel="noopener noreferrer"
            title="Open Peer-Reviewed Scientific Whitepaper"
            className="hidden sm:flex h-8 px-2.5 bg-[#234E36] text-white text-xs font-mono font-medium hover:bg-[#1A3B29] transition-colors items-center space-x-1.5 rounded-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t('navbar.research_paper')}</span>
          </a>

          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="flex md:hidden w-9 h-9 items-center justify-center text-[#1C231F] hover:bg-[#EFEDE6] rounded-xs transition-colors border border-[#DDD9CE]"
            aria-label="Toggle navigation drawer"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ROW 2: PROMINENT DOCKED FARM FINDER STRIP (Spacious)      */}
      {/* ========================================================= */}
      <div className="border-t border-[#DDD9CE] bg-[#FFFFFF] py-2 px-4 sm:px-6 shadow-xs relative">
        <div className="max-w-7xl mx-auto w-full" ref={searchContainerRef}>
          {/* Main Controls: Line 1 on mobile, single flex row on tablet & desktop */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input Box */}
            <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 min-w-0 relative">
              <div className="relative flex-1 min-w-0">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (searchError) setSearchError(null);
                  }}
                  placeholder={t('navbar.search_placeholder')}
                  className="w-full h-[42px] pl-9 pr-8 bg-[#F6F5F0] border border-[#DDD9CE] text-xs sm:text-sm font-mono text-[#1C231F] placeholder-[#767E78] focus:outline-none focus:border-[#234E36] focus:bg-white transition-all rounded-xs"
                />
                <Search className="w-4 h-4 text-[#767E78] absolute left-3 top-3" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setShowResultsDropdown(false);
                      setSearchError(null);
                    }}
                    className="absolute right-2.5 top-3 text-[#767E78] hover:text-[#1C231F] p-0.5 rounded-full"
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Primary Search Button */}
              <button
                type="submit"
                disabled={isSearching}
                className="h-[42px] px-4 bg-[#234E36] text-white hover:bg-[#1A3B29] text-xs font-mono font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0 rounded-xs shadow-xs"
              >
                <Search size={14} />
                <span>{isSearching ? t('navbar.searching') : t('navbar.find_farm')}</span>
              </button>
            </form>

            {/* GPS Detection Button */}
            <button
              type="button"
              onClick={handleUseGps}
              disabled={isLocating}
              title={t('navbar.detect_gps_title')}
              className="h-[42px] px-3.5 bg-white border border-[#DDD9CE] text-xs font-mono font-medium text-[#234E36] hover:bg-[#EFEDE6] hover:border-[#234E36] transition-colors flex items-center justify-center space-x-2 shrink-0 rounded-xs"
            >
              <Crosshair className={`w-4 h-4 text-[#234E36] ${isLocating ? 'animate-spin' : ''}`} />
              <span className="whitespace-nowrap">
                {isLocating ? t('navbar.locating_gps') : t('navbar.use_my_gps')}
              </span>
            </button>
          </div>

          {/* Autocomplete / Multi-match dropdown */}
          {showResultsDropdown && searchResults.length > 0 && (
            <div className="absolute left-4 right-4 sm:left-6 sm:right-6 top-[54px] bg-white border border-[#DDD9CE] shadow-xl rounded-xs z-[6000] overflow-hidden max-h-64 overflow-y-auto">
              <div className="p-1.5 bg-[#EFEDE6] border-b border-[#DDD9CE] text-[10px] font-mono font-semibold text-[#4E5851] uppercase tracking-wider">
                Select Matching Farm Location:
              </div>
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectSearchResult(item)}
                  className="w-full text-left px-3 py-2.5 text-xs font-mono hover:bg-[#F6F5F0] border-b border-[#EFEDE6] last:border-none flex items-center justify-between gap-2 transition-colors"
                >
                  <span className="truncate text-[#1C231F] font-medium">{item.display_name}</span>
                  <span className="text-[10.5px] text-[#767E78] shrink-0 font-mono">
                    [{parseFloat(item.lat).toFixed(4)}, {parseFloat(item.lon).toFixed(4)}]
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Inline Error / Status Notification Banner */}
          {searchError && (
            <div className="mt-2 p-2 bg-[#FDF2F0] border border-[#F5C2B8] text-[#9E3426] text-xs font-mono rounded-xs flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-1.5">
                <AlertCircle size={14} className="shrink-0" />
                <span>{searchError}</span>
              </div>
              <button
                type="button"
                onClick={() => setSearchError(null)}
                className="text-[#9E3426] hover:text-[#1C231F] p-0.5"
                title="Dismiss"
              >
                <X size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MOBILE NAVIGATION DRAWER (Slide-Down)                      */}
      {/* ========================================================= */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden w-full bg-white border-b border-[#DDD9CE] shadow-lg flex flex-col p-3 space-y-1 z-[5000]"
        >
          <button
            onClick={() => scrollToSection('field-map')}
            className="min-h-[44px] w-full px-3 flex items-center space-x-2 text-xs font-mono text-[#1C231F] hover:bg-[#EFEDE6] rounded-xs transition-colors"
          >
            <Map size={16} className="text-[#234E36]" />
            <span>{t('navbar.field_map')}</span>
          </button>

          <button
            onClick={() => scrollToSection('climate-drift')}
            className="min-h-[44px] w-full px-3 flex items-center space-x-2 text-xs font-mono text-[#1C231F] hover:bg-[#EFEDE6] rounded-xs transition-colors"
          >
            <Calendar size={16} className="text-[#234E36]" />
            <span>{t('navbar.climate_drift')}</span>
          </button>

          <button
            onClick={() => scrollToSection('rotations-matrix')}
            className="min-h-[44px] w-full px-3 flex items-center space-x-2 text-xs font-mono text-[#1C231F] hover:bg-[#EFEDE6] rounded-xs transition-colors"
          >
            <Compass size={16} className="text-[#234E36]" />
            <span>{t('navbar.rotations')}</span>
          </button>

          <button
            onClick={() => scrollToSection('scientific-methodology')}
            className="min-h-[44px] w-full px-3 flex items-center space-x-2 text-xs font-mono text-[#1C231F] hover:bg-[#EFEDE6] rounded-xs transition-colors"
          >
            <BookOpen size={16} className="text-[#234E36]" />
            <span>{t('navbar.methodology')}</span>
          </button>

          {onOpenAbout && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAbout();
              }}
              className="min-h-[44px] w-full px-3 flex items-center space-x-2 text-xs font-mono text-[#1C231F] hover:bg-[#EFEDE6] rounded-xs transition-colors"
            >
              <Info size={16} className="text-[#234E36]" />
              <span>{t('navbar.about_us')}</span>
            </button>
          )}

          <a
            href="/research-paper.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] w-full px-3 flex items-center space-x-2 text-xs font-mono text-white bg-[#234E36] hover:bg-[#1A3B29] rounded-xs transition-colors"
          >
            <FileText size={16} />
            <span>{t('navbar.research_paper')}</span>
          </a>
        </div>
      )}
    </header>
  );
}
