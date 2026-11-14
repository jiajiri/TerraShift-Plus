import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, ExternalLink, Map, Layers, ChevronRight, Sparkles, Droplets, ShieldAlert, BarChart2 } from 'lucide-react';
import { streamGroundedChat } from '../api';

const STARTER_PROMPTS = [
  'Why is my soil exposed?',
  'Which rotation saves the most water?',
  'Check erosion & slope risk',
  'How does Maize compare to alternatives?'
];

export default function FieldAdvisorFAB({
  coords,
  placeLabel,
  climate,
  optimization,
  terrain,
  onSetMapGrid,
  onSetMapOverlay,
  onOpenProvenance,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hello! I am your NASA Earth Observation Field Advisor. Ask me anything about soil exposure, water stress, crop rotations, or erosion risk for this field.",
      visual: null,
      actions: ['erosion_risk', 'water_stress', 'soilMoisture']
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const abortRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleActionClick = (type) => {
    if (type === 'water_stress' && onSetMapGrid) {
      onSetMapGrid('water_stress');
      const el = document.getElementById('field-map');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (type === 'erosion_risk' && onSetMapGrid) {
      onSetMapGrid('erosion_risk');
      const el = document.getElementById('field-map');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (type === 'soilMoisture' && onSetMapOverlay) {
      onSetMapOverlay('soilMoisture');
      const el = document.getElementById('field-map');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const determineVisualType = (query) => {
    const q = query.toLowerCase();
    if (q.includes('soil') || q.includes('exposed') || q.includes('bare') || q.includes('rain')) {
      return 'bare_soil_rain';
    }
    if (q.includes('water') || q.includes('rotation') || q.includes('stress') || q.includes('compare') || q.includes('maize')) {
      return 'strategy_water_bars';
    }
    return null;
  };

  const handleSend = async (questionText) => {
    const promptText = (questionText || inputValue).trim();
    if (!promptText || isStreaming) return;

    setInputValue('');
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const visualType = determineVisualType(promptText);

    // Add user message
    const newMessages = [
      ...messages,
      { role: 'user', text: promptText },
      {
        role: 'assistant',
        text: '',
        visual: visualType,
        actions: ['water_stress', 'erosion_risk', 'soilMoisture'],
        citations: []
      }
    ];
    setMessages(newMessages);
    setIsStreaming(true);

    try {
      await streamGroundedChat(
        {
          question: promptText,
          climate_context: climate || {},
          optimization_context: optimization || {},
          terrain_context: terrain || {},
          coordinates: coords || {}
        },
        (event, data) => {
          if (event === 'token' && data.text) {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === 'assistant') {
                updated[updated.length - 1] = {
                  ...last,
                  text: (last.text || '') + data.text
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

  // Mini-chart: 12-month bare-soil vs rain strip
  const renderBareSoilRainStrip = () => {
    const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    const bareMonths = optimization?.field_diagnosis?.bare_months || [];
    const monthlyPrecip = climate?.monthly_climatology?.map((m) => m.precip_mm) || Array(12).fill(40);
    const maxP = Math.max(...monthlyPrecip, 1);

    return (
      <div className="my-2.5 p-2 bg-white border border-[#DDD9CE] rounded-sm text-[10px] font-mono">
        <div className="flex items-center justify-between text-[#767E78] mb-1.5 font-sans font-semibold">
          <span className="flex items-center gap-1">
            <Droplets size={11} className="text-[#2563EB]" /> 12-Month Rainfall vs Bare Ground Exposure
          </span>
          <span className="text-[9px] text-[#9E3426]">{bareMonths.length} Bare Months</span>
        </div>
        <div className="grid grid-cols-12 gap-1 text-center items-end h-14 pt-1 pb-1 border-b border-[#EFEDE6]">
          {months.map((m, idx) => {
            const p = monthlyPrecip[idx] || 0;
            const fullMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][idx];
            const isBare = bareMonths.includes(fullMonth);
            const heightPct = Math.max(10, Math.min(100, Math.round((p / maxP) * 100)));

            return (
              <div key={idx} className="flex flex-col items-center h-full justify-end group relative" title={`${fullMonth}: ${p}mm rain ${isBare ? '(Bare soil)' : ''}`}>
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
            <span className="w-2 h-2 bg-[#2563EB]/70 inline-block rounded-xs"></span> Rain Infiltration
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-[#9E3426]/80 inline-block rounded-xs"></span> High Erosion Window
          </span>
        </div>
      </div>
    );
  };

  // Mini-chart: 4-strategy water-stress comparative horizontal bars
  const renderStrategyWaterBars = () => {
    const strategies = optimization?.strategies || [
      { archetype: 'Baseline (Maize)', mean_wsi: 0.65 },
      { archetype: 'Water Saver', mean_wsi: 0.32 },
      { archetype: 'Soil Rebuilder', mean_wsi: 0.38 },
      { archetype: 'Max Income', mean_wsi: 0.48 },
    ];

    return (
      <div className="my-2.5 p-2 bg-white border border-[#DDD9CE] rounded-sm text-[10px] font-mono">
        <div className="flex items-center justify-between text-[#767E78] mb-1.5 font-sans font-semibold">
          <span className="flex items-center gap-1">
            <BarChart2 size={11} className="text-[#234E36]" /> 4-Strategy Water Stress Index (WSI: Lower is Safer)
          </span>
        </div>
        <div className="space-y-1.5">
          {strategies.map((s, idx) => {
            const wsi = s.mean_wsi ?? 0.5;
            const barPct = Math.round(wsi * 100);
            const isBaseline = s.archetype.includes('Baseline');
            return (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between text-[9px]">
                  <span className={isBaseline ? 'text-[#9E3426] font-semibold' : 'text-[#1C231F]'}>
                    {s.archetype}
                  </span>
                  <span className="font-mono">{wsi.toFixed(2)} WSI</span>
                </div>
                <div className="w-full bg-[#EFEDE6] h-2 rounded-xs overflow-hidden">
                  <div
                    style={{ width: `${barPct}%` }}
                    className={`h-full ${
                      isBaseline ? 'bg-[#9E3426]' : wsi < 0.4 ? 'bg-[#265D3D]' : 'bg-[#D97706]'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 2500 }}>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-[#234E36] text-white rounded-full shadow-xl hover:bg-[#1A3B29] transition-all transform hover:scale-105 font-mono text-xs font-medium cursor-pointer border border-[#DDD9CE]"
          title="Open NASA Field Advisor"
        >
          <MessageSquare size={16} />
          <span>Ask Field Advisor</span>
        </button>
      )}

      {/* Drawer Window */}
      {isOpen && (
        <div
          className="w-[calc(100vw-32px)] sm:w-[420px] bg-[#F6F5F0] border border-[#DDD9CE] shadow-2xl flex flex-col font-sans text-[#1C231F] rounded-sm overflow-hidden"
          style={{ maxHeight: '78vh', height: '620px' }}
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-white border-b border-[#DDD9CE] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#234E36] animate-pulse"></span>
              <div>
                <h3 className="text-xs font-mono font-bold text-[#1C231F] uppercase tracking-wide">
                  Field Advisor (NASA EO Copilot)
                </h3>
                <p className="text-[10px] font-mono text-[#767E78]">
                  {placeLabel || `${latStr}, ${lonStr}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-[#EFEDE6] text-[#767E78] hover:text-[#1C231F] rounded transition-colors"
              title="Close Advisor"
            >
              <X size={15} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
            {/* Verifiable External Links Toolbar */}
            <div className="p-2 bg-white/80 border border-[#DDD9CE] rounded-sm flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono text-[#4E5851]">
              <div className="flex items-center gap-2">
                <a
                  href={nasaPowerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#234E36] hover:underline font-semibold"
                >
                  <ExternalLink size={10} /> NASA POWER Query
                </a>
                <span className="text-[#DDD9CE]">|</span>
                <a
                  href={nasaWorldviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#234E36] hover:underline font-semibold"
                >
                  <ExternalLink size={10} /> Worldview Sat
                </a>
              </div>
              {onOpenProvenance && (
                <button
                  type="button"
                  onClick={onOpenProvenance}
                  className="px-1.5 py-0.5 bg-[#EFEDE6] hover:bg-[#E7E4DA] text-[#1C231F] border border-[#DDD9CE] rounded-xs font-medium"
                >
                  View Provenance
                </button>
              )}
            </div>

            {/* Conversation Feed */}
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[92%] p-2.5 rounded-sm text-xs ${
                    m.role === 'user'
                      ? 'bg-[#234E36] text-white font-mono'
                      : 'bg-white border border-[#DDD9CE] text-[#1C231F]'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {m.text || (isStreaming && idx === messages.length - 1 ? 'Analyzing telemetry...' : '')}
                  </div>

                  {/* Contextual Micro-Visualizations */}
                  {m.visual === 'bare_soil_rain' && renderBareSoilRainStrip()}
                  {m.visual === 'strategy_water_bars' && renderStrategyWaterBars()}

                  {/* Citations if available */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-2 pt-1.5 border-t border-[#DDD9CE] text-[10px] text-[#767E78] font-mono">
                      <span className="font-semibold text-[#1C231F]">Grounded Sources:</span>{' '}
                      {m.citations.join(' | ')}
                    </div>
                  )}

                  {/* Interactive Map & Heatmap Action Chips */}
                  {m.role === 'assistant' && (
                    <div className="mt-2 pt-2 border-t border-[#EFEDE6] flex flex-wrap gap-1.5">
                      <button
                        onClick={() => handleActionClick('water_stress')}
                        className="px-2 py-0.5 bg-[#F6F5F0] hover:bg-[#EFEDE6] border border-[#DDD9CE] text-[10px] font-mono text-[#234E36] rounded-xs flex items-center gap-1 transition-colors"
                      >
                        <Map size={10} /> Show Water Stress Heatmap
                      </button>
                      <button
                        onClick={() => handleActionClick('erosion_risk')}
                        className="px-2 py-0.5 bg-[#F6F5F0] hover:bg-[#EFEDE6] border border-[#DDD9CE] text-[10px] font-mono text-[#9E3426] rounded-xs flex items-center gap-1 transition-colors"
                      >
                        <ShieldAlert size={10} /> Show Erosion Runoff Grid
                      </button>
                      <button
                        onClick={() => handleActionClick('soilMoisture')}
                        className="px-2 py-0.5 bg-[#F6F5F0] hover:bg-[#EFEDE6] border border-[#DDD9CE] text-[10px] font-mono text-[#2563EB] rounded-xs flex items-center gap-1 transition-colors"
                      >
                        <Layers size={10} /> Overlay SMAP Soil Moisture
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* 1-Click Starter Prompts */}
          <div className="px-3 py-2 bg-white/70 border-t border-[#DDD9CE]">
            <div className="text-[10px] font-mono text-[#767E78] uppercase mb-1 font-semibold">
              Suggested Field Questions:
            </div>
            <div className="flex flex-wrap gap-1">
              {STARTER_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  disabled={isStreaming}
                  onClick={() => handleSend(prompt)}
                  className="text-[10px] font-mono px-2 py-0.5 bg-white border border-[#DDD9CE] text-[#1C231F] hover:bg-[#E7E4DA] hover:border-[#234E36] rounded-xs transition-colors disabled:opacity-50 text-left"
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
                placeholder="Ask about water, erosion, rotation..."
                disabled={isStreaming}
                className="flex-1 h-8 px-2.5 bg-[#EFEDE6] border border-[#DDD9CE] text-xs font-mono text-[#1C231F] focus:outline-none focus:border-[#234E36] rounded-xs placeholder-[#767E78]"
              />
              <button
                type="submit"
                disabled={isStreaming || !inputValue.trim()}
                className="h-8 px-3 bg-[#234E36] hover:bg-[#1A3B29] text-white text-xs font-mono font-medium rounded-xs flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <Send size={12} />
                <span>{isStreaming ? 'STREAMING' : 'ASK'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
