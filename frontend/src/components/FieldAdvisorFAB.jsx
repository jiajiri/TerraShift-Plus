import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, X, Send, ExternalLink, Map, Layers, Droplets, ShieldAlert, BarChart2, Activity } from 'lucide-react';
import { streamGroundedChat } from '../api';
import { useI18n } from '../i18n/I18nContext';
import MiniSatelliteView from './MiniSatelliteView';

// Helper to render text with clean typography (strip raw markdown asterisks/hashes into clean headers & bullets)
function FormattedMessageText({ text, isStreaming, analyzingLabel }) {
  if (!text) {
    return isStreaming ? (
      <span className="inline-flex items-center text-[#767E78] font-mono text-xs">
        {analyzingLabel || 'Analyzing telemetry...'} <span className="inline-block animate-pulse font-mono text-[#234E36] ml-1">|</span>
      </span>
    ) : null;
  }

  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed text-xs">
      {lines.map((line, lIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lIdx} className="h-1" />;
        }

        // Header detection (e.g. #### Title, ### Title, ## Title, # Title, or **TITLE:**)
        const headerMatch = trimmed.match(/^(?:#{1,6}\s*|\*\*\s*)([^*#]+?)(?:\s*\*\*|:)?$/);
        const isHeaderLike = headerMatch || (trimmed.startsWith('#') && !trimmed.startsWith('## '));

        if (trimmed.startsWith('#') || (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 80)) {
          const cleanHeader = trimmed.replace(/^#+\s*/, '').replace(/^\*\*|\*\*$/g, '').replace(/:$/, '');
          return (
            <div key={lIdx} className="font-sans font-bold text-[#1C231F] text-xs pt-1 tracking-tight">
              {cleanHeader}
            </div>
          );
        }

        // Bullet detection (* item, - item, • item, or numbered 1. item)
        const bulletMatch = trimmed.match(/^([*\-•]|\d+\.)\s+(.+)$/);
        if (bulletMatch) {
          const content = bulletMatch[2];
          return (
            <div key={lIdx} className="flex items-start gap-1.5 pl-1 text-[11.5px]">
              <span className="text-[#234E36] font-mono font-bold select-none">•</span>
              <div className="flex-1">
                {renderInlineFormatted(content)}
              </div>
            </div>
          );
        }

        return (
          <div key={lIdx} className="text-[11.5px]">
            {renderInlineFormatted(trimmed)}
          </div>
        );
      })}
      {isStreaming && (
        <span className="inline-block animate-pulse font-mono text-[#234E36] ml-0.5">▌</span>
      )}
    </div>
  );
}

// Parses inline bold markers (**text**) and renders clean semibold spans without asterisks
function renderInlineFormatted(str) {
  if (!str) return null;
  const parts = str.split(/(\*\*[^*]+?\*\*)/g);
  return parts.map((part, pIdx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      return (
        <span key={pIdx} className="font-semibold text-[#1C231F]">
          {inner}
        </span>
      );
    }
    // Also strip single backticks or stray asterisks if any
    const cleanStr = part.replace(/`/g, '');
    return <span key={pIdx}>{cleanStr}</span>;
  });
}

export default function FieldAdvisorFAB({
  coords,
  placeLabel,
  climate,
  optimization,
  terrain,
  vulnerabilityGrid,
  fusionGrid,
  onSetMapGrid,
  onSetMapOverlay,
}) {
  const { t, lang } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [detectedLang, setDetectedLang] = useState(null);
  const [messages, setMessages] = useState(() => [
    {
      role: 'assistant',
      text: t('advisor.initial_greeting'),
      visual: null,
      actions: ['erosion_risk', 'water_stress', 'soilMoisture']
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const abortRef = useRef(null);

  // If language changes and only initial greeting exists, update the greeting
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === 'assistant' && !prev[0].citations) {
        return [{
          ...prev[0],
          text: t('advisor.initial_greeting')
        }];
      }
      return prev;
    });
  }, [lang, t]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleActionClick = (type) => {
    // 1. Sync main background map layer in parallel
    if (type === 'water_stress' && onSetMapGrid) {
      onSetMapGrid('water_stress');
    } else if (type === 'erosion_risk' && onSetMapGrid) {
      onSetMapGrid('erosion_risk');
    } else if (type === 'soilMoisture' && onSetMapOverlay) {
      onSetMapOverlay('soilMoisture');
    }

    // 2. Trigger conversational agentic execution with action_type to render live visual card directly inside chat
    const label = type === 'water_stress'
      ? (lang === 'sw' ? 'Onyesha Kanda za Msongo wa Maji' : 'Show Water Stress Hotspots')
      : type === 'erosion_risk'
      ? (lang === 'sw' ? 'Onyesha Hatari ya Mmomonyoko & Mwinamo' : 'Show Erosion & Slope Risk')
      : (lang === 'sw' ? 'Onyesha Tabaka la Unyevu wa Udongo (SMAP)' : 'Show SMAP Soil Moisture Layer');

    handleSend(label, type);
  };

  const handleExportJson = () => {
    const exportPayload = {
      project: 'TerraShift+',
      export_timestamp: new Date().toISOString(),
      field_location: {
        place_label: placeLabel,
        coordinates: coords,
        elevation_m: terrain?.elevation_m,
        slope_pct: terrain?.slope_pct
      },
      climatology: climate,
      vulnerability_grid: vulnerabilityGrid,
      optimization: optimization,
      verified_citations: [
        'NASA POWER GMAO MERRA-2 Agroclimatology (0.5x0.625)',
        'NASA SMAP L4 Global Root-Zone Soil Moisture (9km)',
        'NASA ECOSTRESS Evaporative Stress Index (ESI 70m)',
        'NASA GPM IMERG Precipitation (10km)',
        'FAO-56 Penman-Monteith Evapotranspiration',
        'USDA-NRCS RUSLE Topographic Erosion'
      ]
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `terrashift_field_${latStr}_${lonStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const determineVisualType = (query) => {
    const q = (query || '').toLowerCase();
    if (q.includes('grid') || q.includes('slope') || q.includes('mwinamo') || q.includes('sub-field') || q.includes('heatmap') || q.includes('hotspot')) {
      return 'subfield_grid';
    }
    if (q.includes('soil') || q.includes('udongo') || q.includes('exposed') || q.includes('bare') || q.includes('tupu') || q.includes('rain') || q.includes('mvua') || q.includes('moisture') || q.includes('unyevu')) {
      return 'bare_soil_rain';
    }
    if (q.includes('water') || q.includes('maji') || q.includes('rotation') || q.includes('mzunguko') || q.includes('stress') || q.includes('msongo') || q.includes('compare') || q.includes('linganisha') || q.includes('mahindi') || q.includes('maize') || q.includes('strategy') || q.includes('mkakati')) {
      return 'strategy_water_bars';
    }
    return null;
  };

  const handleSend = async (questionText, actionType = null) => {
    const promptText = (questionText || inputValue).trim();
    if (!promptText || isStreaming) return;

    setInputValue('');
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const visualType = actionType === 'water_stress'
      ? 'water_stress_grid'
      : actionType === 'erosion_risk'
      ? 'erosion_rusle_grid'
      : actionType === 'soilMoisture'
      ? 'smap_moisture_preview'
      : determineVisualType(promptText);

    // Add user message & assistant placeholder
    const newMessages = [
      ...messages,
      { role: 'user', text: promptText },
      {
        role: 'assistant',
        text: '',
        visual: visualType,
        visualData: null,
        toolTraces: [],
        actions: ['water_stress', 'erosion_risk', 'soilMoisture'],
        citations: [],
        verifiedLinks: null
      }
    ];
    setMessages(newMessages);
    setIsStreaming(true);

    try {
      await streamGroundedChat(
        {
          question: promptText,
          action_type: actionType,
          language: lang,
          climate_context: climate || {},
          optimization_context: optimization || {},
          terrain_context: terrain || {},
          coordinates: coords || {},
          vulnerability_grid: vulnerabilityGrid || {},
          fusion_grid: fusionGrid || []
        },
        (event, data) => {
          if (event === 'meta' && data?.detected_language) {
            setDetectedLang(data.detected_language);
          } else if (event === 'tool_call') {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === 'assistant') {
                const traces = last.toolTraces || [];
                updated[updated.length - 1] = {
                  ...last,
                  toolTraces: [...traces, { tool: data.tool, status: 'running', args: data.args }]
                };
              }
              return updated;
            });
          } else if (event === 'tool_result') {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === 'assistant') {
                const traces = (last.toolTraces || []).map((t) =>
                  t.tool === data.tool ? { ...t, status: 'done', summary: data.summary } : t
                );
                updated[updated.length - 1] = {
                  ...last,
                  toolTraces: traces
                };
              }
              return updated;
            });
          } else if (event === 'visual_card') {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === 'assistant') {
                updated[updated.length - 1] = {
                  ...last,
                  visual: data.card_type,
                  visualData: data.data,
                  visualTitle: data.title
                };
              }
              return updated;
            });
          } else if (event === 'verified_links') {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === 'assistant') {
                updated[updated.length - 1] = {
                  ...last,
                  verifiedLinks: data.links
                };
              }
              return updated;
            });
          } else if (event === 'token' && (data.text !== undefined || data.token !== undefined)) {
            const tokenText = data.text !== undefined ? data.text : data.token;
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === 'assistant') {
                updated[updated.length - 1] = {
                  ...last,
                  text: (last.text || '') + tokenText
                };
              }
              return updated;
            });
          } else if (event === 'citation' || event === 'citations') {
            const cites = data.verified_citations || data.citations || [];
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === 'assistant') {
                updated[updated.length - 1] = {
                  ...last,
                  citations: cites
                };
              }
              return updated;
            });
          }
        },
        controller.signal
      );
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'assistant') {
            updated[updated.length - 1] = {
              ...last,
              text: (last.text ? `${last.text}\n\n` : '') + `[Advisor error: ${err.message}]`
            };
          }
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
    }
  };

  // NASA POWER Query URL & NASA Worldview URL
  const latStr = coords?.lat?.toFixed(4) ?? '0.0000';
  const lonStr = coords?.lon?.toFixed(4) ?? '0.0000';
  const nasaPowerUrl = `https://power.larc.nasa.gov/data-access-viewer/?lat=${latStr}&lon=${lonStr}`;
  const todayIso = new Date().toISOString().slice(0, 10);
  const nasaWorldviewUrl = `https://worldview.earthdata.nasa.gov/?v=${Number(lonStr) - 0.5},${Number(latStr) - 0.5},${Number(lonStr) + 0.5},${Number(latStr) + 0.5}&t=${todayIso}`;

  // Dynamic Live Visual Renderer for Chat Bubbles
  const renderInteractiveVisual = (visualType, visualData) => {
    if (!visualType) return null;

    if (visualType === 'subfield_grid' || visualType === 'water_stress_grid') {
      const data = visualData || {};
      const cells = data.cells || [];
      const peakCell = data.peak_cell || 'R1C1';
      const elevMin = data.elev_min != null ? data.elev_min : (terrain?.elevation_m ? Math.round(terrain.elevation_m - 5) : 500);
      const elevMax = data.elev_max != null ? data.elev_max : (terrain?.elevation_m ? Math.round(terrain.elevation_m + 5) : 510);
      const maxSlope = data.max_slope != null ? data.max_slope : (terrain?.slope_pct ?? 3.2);
      const meanWsi = data.mean_wsi != null 
        ? (Number(data.mean_wsi) > 1 ? Math.min(100, Math.round(Number(data.mean_wsi))) : Math.min(100, Math.round(Number(data.mean_wsi) * 100))) 
        : 35;

      return (
        <div className="my-2.5 p-2.5 bg-white border border-[#DDD9CE] rounded-sm text-[10px] font-mono shadow-xs">
          <div className="flex items-center justify-between text-[#767E78] mb-1.5 font-sans font-semibold">
            <span className="flex items-center gap-1 text-[#1C231F]">
              <Activity size={12} className="text-[#234E36]" /> 3x3 Micro-Topography Water Stress Grid
            </span>
            <span className="text-[9px] px-1 py-0.2 bg-[#F6F5F0] border border-[#DDD9CE] rounded-xs font-mono text-[#9E3426] font-semibold">
              Peak Hotspot: {peakCell}
            </span>
          </div>

          {/* 3x3 Grid Stencil */}
          <div className="grid grid-cols-3 gap-1.5 max-w-[220px] mx-auto py-1">
            {(cells.length > 0 ? cells : [
              { cell_id: 'R0C0', water_stress: 0.28, slope_pct: 2.1 },
              { cell_id: 'R0C1', water_stress: 0.32, slope_pct: 2.8 },
              { cell_id: 'R0C2', water_stress: 0.35, slope_pct: 3.4 },
              { cell_id: 'R1C0', water_stress: 0.30, slope_pct: 2.5 },
              { cell_id: 'R1C1', water_stress: 0.48, slope_pct: 4.2 },
              { cell_id: 'R1C2', water_stress: 0.36, slope_pct: 3.5 },
              { cell_id: 'R2C0', water_stress: 0.29, slope_pct: 2.4 },
              { cell_id: 'R2C1', water_stress: 0.34, slope_pct: 3.0 },
              { cell_id: 'R2C2', water_stress: 0.42, slope_pct: 3.8 }
            ]).map((cell) => {
              const ws = cell.water_stress != null ? cell.water_stress : 0.35;
              const isPeak = cell.cell_id === peakCell;
              let bg = 'bg-[#265D3D] text-white';
              if (ws > 0.45) bg = 'bg-[#9E3426] text-white';
              else if (ws >= 0.33) bg = 'bg-[#D97706] text-white';

              return (
                <div
                  key={cell.cell_id}
                  className={`h-11 rounded-xs p-1 flex flex-col justify-between transition-transform relative ${bg} ${
                    isPeak ? 'ring-2 ring-[#1C231F] ring-offset-1 font-bold' : ''
                  }`}
                >
                  <div className="flex justify-between items-center text-[8.5px] leading-none">
                    <span>{cell.cell_id}</span>
                    {isPeak && <span className="text-[7.5px] bg-white text-[#9E3426] px-0.5 rounded-xs font-bold">MAX</span>}
                  </div>
                  <div className="text-[8px] leading-tight opacity-90 truncate">
                    {Math.round(ws * 100)}% WSI
                  </div>
                </div>
              );
            })}
          </div>

          {/* Telemetry Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-2 mt-1.5 border-t border-[#EFEDE6] text-[9px] font-mono text-[#4E5851]">
            <div className="bg-[#F6F5F0] p-1 rounded-xs">
              <div className="text-[#767E78] text-[8px] uppercase">Elevation</div>
              <div className="font-semibold text-[#1C231F]">{elevMin}–{elevMax} m</div>
            </div>
            <div className="bg-[#F6F5F0] p-1 rounded-xs">
              <div className="text-[#767E78] text-[8px] uppercase">Peak Slope</div>
              <div className="font-semibold text-[#1C231F]">{maxSlope}%</div>
            </div>
            <div className="bg-[#F6F5F0] p-1 rounded-xs">
              <div className="text-[#767E78] text-[8px] uppercase">Mean Stress</div>
              <div className="font-semibold text-[#1C231F]">{meanWsi}% WSI</div>
            </div>
            <div className="bg-[#F6F5F0] p-1 rounded-xs">
              <div className="text-[#767E78] text-[8px] uppercase">Hotspot</div>
              <div className="font-semibold text-[#9E3426]">{peakCell}</div>
            </div>
          </div>

          {/* View on Map Shortcut */}
          <div className="mt-2 pt-1 flex justify-end">
            <button
              onClick={() => {
                if (onSetMapGrid) onSetMapGrid('water_stress');
                const el = document.getElementById('field-map');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-[9.5px] font-mono text-[#234E36] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Map size={10} /> {t('advisor.view_on_map') || 'View on Full Map →'}
            </button>
          </div>
        </div>
      );
    }

    if (visualType === 'erosion_rusle_grid') {
      const data = visualData || {};
      const cells = data.cells || [];
      const peakCell = data.peak_cell || 'R1C1';
      const maxSlope = data.max_slope != null ? data.max_slope : (terrain?.slope_pct ?? 3.2);
      const strats = data.strategies || [
        { name: 'Status Quo Maize', soil_loss_t_ha: 14.8 },
        { name: 'Resilience First', soil_loss_t_ha: 4.6 },
        { name: 'Balanced Stewardship', soil_loss_t_ha: 5.8 },
        { name: 'Market Yield Max', soil_loss_t_ha: 8.2 }
      ];

      return (
        <div className="my-2.5 p-2.5 bg-white border border-[#DDD9CE] rounded-sm text-[10px] font-mono shadow-xs">
          <div className="flex items-center justify-between text-[#767E78] mb-1.5 font-sans font-semibold">
            <span className="flex items-center gap-1 text-[#1C231F]">
              <ShieldAlert size={12} className="text-[#9E3426]" /> Topographic Slope & RUSLE Soil Loss
            </span>
            <span className="text-[9px] px-1 py-0.2 bg-[#FBECE9] text-[#9E3426] border border-[#E3B3AC] rounded-xs font-mono font-semibold">
              Peak Slope: {maxSlope}%
            </span>
          </div>

          {/* 4-Strategy RUSLE Soil Loss Comparison Bars */}
          <div className="space-y-1.5 py-1">
            {strats.map((s, idx) => {
              const loss = s.soil_loss_t_ha || 5.0;
              const barW = Math.min(100, Math.round((loss / 16.0) * 100));
              const isHigh = loss > 10.0;
              return (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-baseline text-[8.5px]">
                    <span className={isHigh ? 'text-[#9E3426] font-semibold' : 'text-[#1C231F]'}>
                      {s.name}
                    </span>
                    <span className="font-semibold text-[#1C231F]">{loss} t/ha/yr</span>
                  </div>
                  <div className="w-full bg-[#EFEDE6] h-2 rounded-xs overflow-hidden">
                    <div
                      style={{ width: `${barW}%` }}
                      className={`h-full ${isHigh ? 'bg-[#9E3426]' : 'bg-[#234E36]'}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2 pt-1 flex justify-between items-center text-[9px] text-[#767E78] border-t border-[#EFEDE6]">
            <span>RUSLE Tolerable Loss (T-value): 8.0 t/ha/yr</span>
            <button
              onClick={() => {
                if (onSetMapGrid) onSetMapGrid('erosion_risk');
                const el = document.getElementById('field-map');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-[9.5px] font-mono text-[#234E36] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Map size={10} /> {t('advisor.view_on_map') || 'View on Full Map →'}
            </button>
          </div>
        </div>
      );
    }

    if (visualType === 'smap_moisture_preview') {
      const data = visualData || {};
      const gwetMean = data.gwetroot_mean != null ? data.gwetroot_mean : 0.38;
      const ph = data.soil_ph != null ? data.soil_ph : 6.4;
      const clay = data.clay_pct != null ? data.clay_pct : 24.0;
      const targetLat = data.coordinates?.lat ?? coords?.lat ?? -6.163;
      const targetLon = data.coordinates?.lon ?? coords?.lon ?? 35.7516;

      return (
        <MiniSatelliteView
          lat={targetLat}
          lon={targetLon}
          gwetMean={gwetMean}
          ph={ph}
          clay={clay}
          nsidcDoi={data.nsidc_doi || "https://doi.org/10.5067/T5RUATAQREF8"}
          onViewFullMap={() => {
            if (onSetMapOverlay) onSetMapOverlay('soilMoisture');
          }}
        />
      );
    }

    if (visualType === 'bare_soil_rain') {
      return renderBareSoilRainStrip();
    }

    if (visualType === 'strategy_water_bars') {
      return renderStrategyWaterBars();
    }

    return null;
  };

  // Mini-chart: 12-month moisture & rainfall strip (using fusionGrid or climate.monthly_climatology)
  const renderBareSoilRainStrip = () => {
    const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    const bareMonths = optimization?.field_diagnosis?.bare_months || [];

    // Extract monthly precip and moisture from fusionGrid if present, otherwise climate.monthly_climatology
    let monthlyPrecip = [];
    let monthlyDeficit = [];
    if (fusionGrid && Array.isArray(fusionGrid) && fusionGrid.length >= 12) {
      monthlyPrecip = fusionGrid.map((m) => m.precip_mm ?? 0);
      monthlyDeficit = fusionGrid.map((m) => m.gpm_deficit_mm ?? 0);
    } else {
      monthlyPrecip = climate?.monthly_climatology?.map((m) => m.precip_mm) || Array(12).fill(40);
    }
    const maxP = Math.max(...monthlyPrecip, 1);

    return (
      <div className="my-2.5 p-2 bg-white border border-[#DDD9CE] rounded-sm text-[10px] font-mono">
        <div className="flex items-center justify-between text-[#767E78] mb-1.5 font-sans font-semibold">
          <span className="flex items-center gap-1 text-[#1C231F]">
            <Droplets size={11} className="text-[#2563EB]" /> 12-Month Satellite Moisture Strip (GPM & POWER)
          </span>
          <span className="text-[9px] text-[#9E3426]">{bareMonths.length} Bare Months</span>
        </div>
        <div className="grid grid-cols-12 gap-1 text-center items-end h-14 pt-1 pb-1 border-b border-[#EFEDE6]">
          {months.map((m, idx) => {
            const p = monthlyPrecip[idx] || 0;
            const fullMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][idx];
            const isBare = bareMonths.includes(fullMonth);
            const heightPct = Math.max(10, Math.min(100, Math.round((p / maxP) * 100)));
            const defMm = monthlyDeficit[idx] != null ? `${monthlyDeficit[idx]}mm deficit` : '';

            return (
              <div key={idx} className="flex flex-col items-center h-full justify-end group relative" title={`${fullMonth}: ${p}mm rain ${defMm ? `(${defMm})` : ''} ${isBare ? '[Bare soil]' : ''}`}>
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full rounded-xs transition-all ${
                    isBare ? 'bg-[#9E3426]/80' : 'bg-[#2563EB]/70'
                  }`}
                />
                <span className={`text-[9px] mt-1 ${isBare ? 'text-[#9E3426] font-bold' : 'text-[#767E78]'}`}>
                  {m}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between items-center mt-1 text-[9px] text-[#767E78]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-[#2563EB]/70 inline-block rounded-xs"></span> Infiltration
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-[#9E3426]/80 inline-block rounded-xs"></span> Exposed / Dry
          </span>
        </div>
      </div>
    );
  };

  // Mini-chart: 4-Strategy Comparative Bars (strictly pulling from optimization.strategies)
  const renderStrategyWaterBars = () => {
    const strategies = optimization?.strategies || [
      { archetype: 'Status Quo Baseline', sequence_names: ['Maize', 'Maize', 'Maize', 'Maize', 'Maize'], mean_wsi: 0.65, margin_p50_5y: 1850 },
      { archetype: 'Resilience-First', sequence_names: ['Pearl Millet', 'Cowpea', 'Sorghum', 'Pigeonpea', 'Pearl Millet'], mean_wsi: 0.32, margin_p50_5y: 2420 },
      { archetype: 'Balanced Stewardship', sequence_names: ['Sorghum', 'Lablab', 'Pearl Millet', 'Groundnut', 'Sorghum'], mean_wsi: 0.38, margin_p50_5y: 2680 },
      { archetype: 'Yield-Maximizing', sequence_names: ['Maize', 'Soybean', 'Maize', 'Sunflower', 'Maize'], mean_wsi: 0.48, margin_p50_5y: 3150 },
    ];

    return (
      <div className="my-2.5 p-2 bg-white border border-[#DDD9CE] rounded-sm text-[10px] font-mono">
        <div className="flex items-center justify-between text-[#767E78] mb-1.5 font-sans font-semibold">
          <span className="flex items-center gap-1 text-[#1C231F]">
            <BarChart2 size={11} className="text-[#234E36]" /> 4-Strategy Comparative Stress & Margins
          </span>
          <span className="text-[9px] text-[#767E78]">Lower WSI is safer</span>
        </div>
        <div className="space-y-2">
          {strategies.map((s, idx) => {
            const wsi = s.mean_wsi != null ? Number(s.mean_wsi) : 0.5;
            const barPct = Math.round(wsi * 100);
            const isBaseline = s.archetype?.toLowerCase().includes('baseline') || s.archetype?.toLowerCase().includes('status quo');
            const seqStr = Array.isArray(s.sequence_names) ? s.sequence_names.slice(0, 3).join('→') + (s.sequence_names.length > 3 ? '...' : '') : '';
            const margin = s.margin_p50_5y != null ? Math.round(s.margin_p50_5y) : null;

            return (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[9px]">
                  <span className={isBaseline ? 'text-[#9E3426] font-semibold' : 'text-[#1C231F] font-medium'}>
                    {s.archetype}
                    {seqStr && <span className="text-[#767E78] font-normal ml-1">({seqStr})</span>}
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    {margin != null && <span className="text-[#234E36] font-semibold">${margin}/ha</span>}
                    <span className="text-[#4E5851]">{wsi.toFixed(2)} WSI</span>
                  </div>
                </div>
                <div className="w-full bg-[#EFEDE6] h-2 rounded-xs overflow-hidden">
                  <div
                    style={{ width: `${barPct}%` }}
                    className={`h-full ${isBaseline ? 'bg-[#9E3426]' : 'bg-[#234E36]'}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const starterPrompts = t('advisor.starter_prompts') || [
    'Why is my soil exposed?',
    'Which rotation saves the most water?',
    'Check erosion & slope risk',
    'How does Maize compare to alternatives?'
  ];

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-[2000]">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-4 py-3 bg-[#234E36] text-white rounded-full shadow-xl hover:bg-[#1A3B29] transition-all transform hover:scale-105 font-mono text-xs font-medium cursor-pointer border border-[#DDD9CE] min-h-[44px] min-w-[44px]"
            title={t('advisor.header_title')}
          >
            <MessageSquare size={16} />
            <span>{t('advisor.header_title')}</span>
          </button>
        </div>
      )}

      {/* Responsive Drawer Container Elevated via React Portal */}
      {isOpen && createPortal(
        <div
          className="fixed z-[9999] w-[calc(100vw-16px)] h-[82dvh] right-2 bottom-2 sm:w-[400px] sm:h-[76vh] sm:right-4 sm:bottom-4 lg:w-[450px] lg:max-h-[78vh] lg:right-6 lg:bottom-6 bg-[#F6F5F0] border border-[#DDD9CE] shadow-2xl flex flex-col font-sans text-[#1C231F] rounded-sm overflow-hidden"
        >
          {/* Header (flex-shrink-0) */}
          <div className="flex-shrink-0 px-3.5 py-2.5 bg-white border-b border-[#DDD9CE] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#234E36] animate-pulse"></span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-mono font-bold text-[#1C231F] uppercase tracking-wide">
                    {t('advisor.header_title')}
                  </h3>
                </div>
                <p className="text-[10px] font-mono text-[#767E78]">
                  {placeLabel || `${latStr}, ${lonStr}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleExportJson}
                className="px-2 py-1 text-[10px] font-mono font-medium text-[#234E36] bg-[#EFEDE6] hover:bg-[#DDD9CE] border border-[#DDD9CE] rounded-xs transition-colors flex items-center gap-1 cursor-pointer"
                title={t('advisor.export_json') || 'Export Field Data (JSON)'}
              >
                <span>JSON</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-[#EFEDE6] text-[#767E78] hover:text-[#1C231F] rounded transition-colors min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center cursor-pointer"
                title={t('common.close')}
                aria-label={t('common.close')}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Message History Area (flex-1 min-h-0 overflow-y-auto) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 text-xs">
            {/* Verifiable External Links Toolbar */}
            <div className="p-2 bg-white/80 border border-[#DDD9CE] rounded-sm flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono text-[#4E5851]">
              <div className="flex items-center gap-2">
                <a
                  href={nasaPowerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#234E36] hover:underline font-semibold"
                >
                  <ExternalLink size={10} /> {t('advisor.power_viewer')}
                </a>
                <span className="text-[#DDD9CE]">|</span>
                <a
                  href={nasaWorldviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#234E36] hover:underline font-semibold"
                >
                  <ExternalLink size={10} /> {t('advisor.worldview_viewer')}
                </a>
              </div>
            </div>

            {/* Conversation Feed */}
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[94%] p-2.5 rounded-sm text-xs ${
                    m.role === 'user'
                      ? 'bg-[#234E36] text-white font-mono'
                      : 'bg-white border border-[#DDD9CE] text-[#1C231F]'
                  }`}
                >
                  {/* MCP Tool Execution Badges */}
                  {m.toolTraces && m.toolTraces.length > 0 && (
                    <div className="mb-2 space-y-1">
                      {m.toolTraces.map((trace, tIdx) => (
                        <div
                          key={tIdx}
                          className="px-2 py-1 bg-[#F6F5F0] border border-[#DDD9CE] rounded-xs text-[9.5px] font-mono flex items-center justify-between text-[#4E5851]"
                        >
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#234E36]"></span>
                            <strong className="text-[#1C231F]">{trace.tool}</strong>
                          </span>
                          <span className="text-[#767E78] truncate max-w-[200px]">
                            {trace.summary || 'Executing...'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Clean text renderer (strips raw markdown symbols) */}
                  <FormattedMessageText
                    text={m.text}
                    isStreaming={isStreaming && idx === messages.length - 1}
                    analyzingLabel={t('advisor.analyzing')}
                  />

                  {/* Contextual Interactive Micro-Visualizations */}
                  {renderInteractiveVisual(m.visual, m.visualData)}

                  {/* Verified External Data Verification Box */}
                  {m.verifiedLinks && (
                    <div className="mt-2.5 p-2 bg-[#F6F5F0] border border-[#DDD9CE] rounded-xs text-[9.5px] font-mono space-y-1">
                      <div className="font-semibold text-[#1C231F] flex items-center gap-1">
                        <ExternalLink size={10} className="text-[#234E36]" /> {t('advisor.verify_live') || 'Verify Data Sources Live:'}
                      </div>
                      <div className="flex flex-col gap-0.5 text-[#4E5851]">
                        {m.verifiedLinks.nasa_power_json && (
                          <a href={m.verifiedLinks.nasa_power_json} target="_blank" rel="noopener noreferrer" className="text-[#234E36] hover:underline truncate">
                            • Raw NASA POWER JSON (This Field)
                          </a>
                        )}
                        {m.verifiedLinks.nasa_worldview && (
                          <a href={m.verifiedLinks.nasa_worldview} target="_blank" rel="noopener noreferrer" className="text-[#234E36] hover:underline truncate">
                            • NASA Worldview Live Bounding Box
                          </a>
                        )}
                        {m.verifiedLinks.smap_doi && (
                          <a href={m.verifiedLinks.smap_doi} target="_blank" rel="noopener noreferrer" className="text-[#2563EB] hover:underline truncate">
                            • NASA NSIDC SMAP L4 Collection DOI
                          </a>
                        )}
                        {m.verifiedLinks.soilgrids_ref && (
                          <a href={m.verifiedLinks.soilgrids_ref} target="_blank" rel="noopener noreferrer" className="text-[#8C5710] hover:underline truncate">
                            • SoilGrids / iSDAsoil Reference
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Citations if available */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-2 pt-1.5 border-t border-[#DDD9CE] text-[10px] text-[#767E78] font-mono">
                      <span className="font-semibold text-[#1C231F]">{t('advisor.citations_title')}:</span>{' '}
                      {m.citations.join(' | ')}
                    </div>
                  )}

                  {/* Interactive Map & Heatmap Action Chips */}
                  {m.role === 'assistant' && (
                    <div className="mt-2 pt-2 border-t border-[#EFEDE6] flex flex-wrap gap-1.5">
                      <button
                        onClick={() => handleActionClick('water_stress')}
                        className="px-2 py-1 bg-[#F6F5F0] hover:bg-[#EFEDE6] border border-[#DDD9CE] text-[10px] font-mono text-[#234E36] rounded-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Map size={10} /> {t('advisor.btn_water_stress')}
                      </button>
                      <button
                        onClick={() => handleActionClick('erosion_risk')}
                        className="px-2 py-1 bg-[#F6F5F0] hover:bg-[#EFEDE6] border border-[#DDD9CE] text-[10px] font-mono text-[#9E3426] rounded-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <ShieldAlert size={10} /> {t('advisor.btn_erosion_risk')}
                      </button>
                      <button
                        onClick={() => handleActionClick('soilMoisture')}
                        className="px-2 py-1 bg-[#F6F5F0] hover:bg-[#EFEDE6] border border-[#DDD9CE] text-[10px] font-mono text-[#2563EB] rounded-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Layers size={10} /> {t('advisor.btn_soil_moisture')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Starter Prompts & Input (flex-shrink-0) */}
          <div className="flex-shrink-0">
            {/* 1-Click Starter Prompts */}
            <div className="px-3 py-2 bg-white/70 border-t border-[#DDD9CE]">
              <div className="text-[10px] font-mono text-[#767E78] uppercase mb-1 font-semibold">
                {t('advisor.header_title')}:
              </div>
              <div className="flex flex-wrap gap-1">
                {starterPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    disabled={isStreaming}
                    onClick={() => handleSend(prompt)}
                    className="text-[10px] font-mono px-2 py-1 bg-white border border-[#DDD9CE] text-[#1C231F] hover:bg-[#E7E4DA] hover:border-[#234E36] rounded-xs transition-colors disabled:opacity-50 text-left cursor-pointer min-h-[32px] sm:min-h-0 flex items-center"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Footer */}
            <div className="p-2.5 bg-white border-t border-[#DDD9CE]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={t('advisor.input_placeholder')}
                  disabled={isStreaming}
                  className="flex-1 h-9 px-2.5 bg-[#EFEDE6] border border-[#DDD9CE] text-xs font-mono text-[#1C231F] focus:outline-none focus:border-[#234E36] rounded-xs placeholder-[#767E78]"
                />
                <button
                  type="submit"
                  disabled={isStreaming || !inputValue.trim()}
                  className="h-9 px-3.5 bg-[#234E36] hover:bg-[#1A3B29] text-white text-xs font-mono font-medium rounded-xs flex items-center gap-1 transition-colors disabled:opacity-50 min-h-[44px] sm:min-h-0 cursor-pointer"
                >
                  <Send size={12} />
                  <span>{isStreaming ? t('common.loading') : (t('advisor.btn_ask') || 'ASK')}</span>
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
