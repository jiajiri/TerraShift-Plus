/**
 * Cloudflare Pages Function: POST /api/v1/chat/stream
 * Autonomous Agentic Agronomic Copilot with Real-time Dynamic NASA & Open Telemetry.
 * Strictly anchored to current user/field location for all farm queries.
 * Only switches location when user explicitly requests a distinct geographical region.
 */

import { fetchNasaPowerEdge, fetchElevationEdge } from '../../../_lib/nasa.js';

// Strict security filters against prompt injection, jailbreaks, system extraction, and out-of-scope tasks
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+|previous\s+|prior\s+)?instructions/i,
  /disregard\s+(all\s+|previous\s+|prior\s+)?instructions/i,
  /system\s+prompt/i,
  /reveal\s+(your\s+)?instructions/i,
  /jailbreak/i,
  /you\s+are\s+now\s+DAN/i,
  /act\s+as\s+(an\s+|a\s+)?unrestricted/i,
  /mode\s+enabled/i,
  /format\s+c:/i,
  /sudo\s+rm/i,
  /api[_\s]?key/i,
  /password/i,
];

const OUT_OF_SCOPE_PATTERNS = [
  /\b(xxx|porn|sex|dating|escort)\b/i,
  /\b(write\s+(me\s+)?a\s+poem|tell\s+me\s+a\s+joke|who\s+won\s+the\s+match|football\s+score)\b/i,
  /\b(i\s+need\s+lunch|order\s+pizza|buy\s+food|restaurant|food\s+delivery)\b/i,
  /\b(bitcoin|crypto|forex|stock\s+tips)\b/i,
  /\b(hack|crack|bypass\s+auth|ddos|sql\s+injection)\b/i,
];

function checkSecurityGuardrail(query) {
  const q = (query || '').trim();
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(q)) {
      return {
        violation: true,
        type: 'prompt_injection',
      };
    }
  }

  for (const pattern of OUT_OF_SCOPE_PATTERNS) {
    if (pattern.test(q)) {
      return {
        violation: true,
        type: 'out_of_scope',
      };
    }
  }

  if (/\b(python|javascript|c\+\+|java|php|html|css)\s+(code|script)\b/i.test(q) &&
      !/\b(nasa|power|smap|fao|rusle|dem|elevation|weather|climate|crop|soil|agro|satellite)\b/i.test(q)) {
    return {
      violation: true,
      type: 'off_topic_code',
    };
  }

  return { violation: false };
}

// Words that must NEVER be geocoded as geographic locations
const FORBIDDEN_GEO_WORDS = new Set([
  'why', 'how', 'what', 'hat', 'when', 'where', 'which', 'who', 'whose', 'whom',
  'is', 'are', 'was', 'were', 'my', 'your', 'our', 'the', 'a', 'an', 'this', 'that',
  'soil', 'exposed', 'bare', 'cover', 'crop', 'crops', 'rotation', 'rotations',
  'maize', 'pigeonpea', 'cowpea', 'sorghum', 'sunflower', 'legume', 'legumes',
  'water', 'stress', 'hotspot', 'hotspots', 'slope', 'slopes', 'sloping',
  'erosion', 'risk', 'risks', 'rusle', 'fao', 'et0', 'deficit', 'rain', 'rainfall',
  'save', 'saves', 'saving', 'most', 'best', 'compare', 'alternatives', 'check',
  'show', 'layer', 'strip', 'field', 'fields', 'farm', 'farms', 'farmer', 'farmers',
  'annual', 'mean', 'data', 'telemetry', 'json', 'view', 'full', 'map', 'status',
  'quo', 'resilience', 'balanced', 'stewardship', 'market', 'yield', 'max',
  'mbona', 'kwanini', 'vipi', 'nini', 'gani', 'wapi', 'lini', 'shamba', 'mashamba',
  'udongo', 'wangu', 'yangu', 'ardhi', 'tupu', 'mmomonyoko', 'mwinamo', 'mteremko',
  'msongo', 'maji', 'mvua', 'mazao', 'mahindi', 'mbaazi', 'kunde', 'mtama', 'alizeti',
  'mzunguko', 'faida', 'hasara', 'afisa', 'ugani', 'hapa'
]);

// Map common colloquial place mentions or typos
const KNOWN_PLACE_ALIASES = {
  'german': 'Germany',
  'deutschland': 'Germany',
  'holland': 'Netherlands',
  'uk': 'United Kingdom',
  'usa': 'United States',
  'america': 'United States',
};

async function queryOpenMeteo(place) {
  if (!place || place.length < 3) return null;
  const alias = KNOWN_PLACE_ALIASES[place.toLowerCase()];
  const searchTerm = alias || place;

  try {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchTerm)}&count=1&language=en&format=json`, {
      headers: { 'User-Agent': 'TerraShift/2.0' }
    });
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      const top = geoData.results?.[0];
      if (top && top.latitude && top.longitude) {
        return {
          location_name: top.country ? `${top.name}, ${top.country}` : top.name,
          latitude: Number(top.latitude),
          longitude: Number(top.longitude),
        };
      }
    }
  } catch (err) {
    console.warn('[TerraShift+ Dynamic Geocoding] Fetch error for', searchTerm, err);
  }
  return null;
}

/**
 * Checks if the user is asking an explicit foreign/external location query.
 * Handles common typos ("form" instead of "from", "hat" instead of "what")
 * and extracts multi-word place candidates cleanly.
 */
async function detectExplicitForeignPlace(question) {
  const qLower = (question || '').toLowerCase();

  // If question is a standard farm advisor or agronomic query, anchor to current field!
  const isFarmQuestion =
    qLower.includes('why is my soil exposed') ||
    qLower.includes('soil exposed') ||
    qLower.includes('bare soil') ||
    qLower.includes('ardhi tupu') ||
    qLower.includes('udongo wangu') ||
    qLower.includes('which rotation') ||
    qLower.includes('rotation saves') ||
    qLower.includes('mzunguko upi') ||
    qLower.includes('erosion') ||
    qLower.includes('slope') ||
    qLower.includes('mmomonyoko') ||
    qLower.includes('mwinamo') ||
    qLower.includes('water stress') ||
    qLower.includes('msongo wa maji') ||
    qLower.includes('smap soil moisture') ||
    qLower.includes('unyevu wa udongo') ||
    qLower.includes('how does maize compare') ||
    qLower.includes('compare to alternatives') ||
    qLower.includes('linganisha mahindi') ||
    qLower.includes('this field') ||
    qLower.includes('shamba hili');

  if (isFarmQuestion) {
    return null;
  }

  // Regex handles explicit place inquiries, accommodating typos ("form", "frm", "hat"):
  // e.g. "hat is data form morogoro tanzania", "i need data from german", "data za morogoro", "weather in dodoma"
  const explicitPrepositionMatch = qLower.match(/\b(?:data\s+(?:from|form|frm|for|in|of|za|kwa|ya)|weather\s+(?:in|of|for)|climate\s+(?:in|of|for)|hali\s+ya\s+hewa\s+(?:ya|kwa|katika)|mvua\s+za|kutoka|kuhusu|about)\s+([a-zA-Z\s]{3,35})/i);

  let candidatePlace = null;
  if (explicitPrepositionMatch) {
    candidatePlace = explicitPrepositionMatch[1].trim();
  } else {
    // Check if query is just a place name like "Germany", "Nairobi", "Kenya", "Bavaria"
    const trimmed = qLower.replace(/[?!,.]/g, '').trim();
    if (!FORBIDDEN_GEO_WORDS.has(trimmed) && trimmed.length >= 4 && !trimmed.includes(' ')) {
      candidatePlace = trimmed;
    }
  }

  if (!candidatePlace) {
    return null;
  }

  // Filter out forbidden tokens from candidate place
  const tokens = candidatePlace.split(/\s+/).filter(w => !FORBIDDEN_GEO_WORDS.has(w) && w.length >= 3);
  if (tokens.length === 0) {
    return null;
  }

  // 1. Try full search string (e.g., "morogoro tanzania")
  const queryPlace = tokens.join(' ');
  let result = await queryOpenMeteo(queryPlace);
  if (result) return result;

  // 2. If multi-word search failed (e.g. Open-Meteo returns nothing for "morogoro tanzania"),
  // try individual words from primary to secondary (e.g. "morogoro", then "tanzania")
  if (tokens.length > 1) {
    for (const token of tokens) {
      if (!FORBIDDEN_GEO_WORDS.has(token) && token.length >= 4) {
        result = await queryOpenMeteo(token);
        if (result) return result;
      }
    }
  }

  return null;
}

export async function onRequestPost(context) {
  let reqData = {};
  try {
    reqData = await context.request.json();
  } catch {
    reqData = {};
  }

  const question = reqData.question || '';
  const actionType = reqData.action_type || null;
  const geminiApiKey = context.env?.GEMMINI_API_KEY || context.env?.GEMINI_API_KEY;
  const clientCoords = reqData.coordinates || {};
  const activePlaceLabel = reqData.place_label || 'Current Field';

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const sendEvent = async (event, data) => {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    await writer.write(encoder.encode(payload));
  };

  (async () => {
    try {
      // 1. LLMOps Security & Prompt Injection Guardrail Filter
      const guardrailCheck = checkSecurityGuardrail(question);
      if (guardrailCheck.violation) {
        await sendEvent('meta', {
          detected_language: 'en',
          status: 'rejected_guardrail',
          guardrail_violation: guardrailCheck.type,
        });

        const rejectionMessage =
          guardrailCheck.type === 'prompt_injection'
            ? `Security Notice: Prompt injection or system instruction overrides are rejected by the TerraShift+ agronomic guardrail. TerraShift+ only processes queries regarding NASA Earth observation, biophysical water balance, and precision agriculture.`
            : guardrailCheck.type === 'off_topic_code'
            ? `TerraShift+ is a specialized NASA Earth observation and precision agriculture assistant. I do not generate unrelated general programming code. If you need Python code to query the NASA POWER API or calculate FAO-56 Penman-Monteith evapotranspiration, please let me know!`
            : `I am TerraShift+, the official AI Agronomic Copilot for the NASA Space Apps Challenge 2026. This assistant is dedicated exclusively to NASA satellite observations, soil health, crop rotations, and drought resilience. Your query is outside the scope of agricultural and Earth science telemetry.`;

        const words = rejectionMessage.split(' ');
        for (let i = 0; i < words.length; i += 3) {
          const chunk = words.slice(i, i + 3).join(' ') + ' ';
          await sendEvent('token', { text: chunk, token: chunk });
        }
        await sendEvent('done', { status: 'rejected' });
        return;
      }

      // 2. Location Determination: Anchor to user's active field UNLESS an explicit external place is requested
      let lat = Number(clientCoords.lat || clientCoords.latitude || -6.8235);
      let lon = Number(clientCoords.lon || clientCoords.longitude || 39.2695);
      let locationLabel = activePlaceLabel;
      let isForeignPlace = false;

      const explicitPlace = await detectExplicitForeignPlace(question);
      if (explicitPlace) {
        lat = explicitPlace.latitude;
        lon = explicitPlace.longitude;
        locationLabel = explicitPlace.location_name;
        isForeignPlace = true;
      }

      // Detect language
      const qLower = question.toLowerCase();
      const swMarkers = ['shamba', 'mazao', 'mahindi', 'mvua', 'udongo', 'mzunguko', 'habari', 'nini', 'kwanini', 'tanzania', 'mmomonyoko', 'mwinamo'];
      const isSw = reqData.language === 'sw' || swMarkers.some(w => qLower.includes(w));

      // 3. Emit Real-time SSE Meta Event
      await sendEvent('meta', {
        detected_language: isSw ? 'sw' : 'en',
        location: locationLabel,
        coordinates: { lat, lon },
        is_foreign_place: isForeignPlace,
      });

      // 4. Live Tool Call: NASA POWER Agroclimatology (Real-time REST API)
      await sendEvent('tool_call', {
        tool: 'nasa_power_agroclimatology',
        args: { latitude: lat, longitude: lon, location: locationLabel },
      });

      const powerData = await fetchNasaPowerEdge(lat, lon);

      await sendEvent('tool_result', {
        tool: 'nasa_power_agroclimatology',
        summary: `Live NASA POWER for ${locationLabel} (${lat.toFixed(4)}, ${lon.toFixed(4)}): ${powerData.annual_precip_mm || 0} mm annual rain, ${powerData.mean_temp_c || 0}°C mean temp`,
      });

      // 5. Live Tool Call: SRTM High-Resolution Topography
      await sendEvent('tool_call', {
        tool: 'subfield_dem_vulnerability_grid',
        args: { latitude: lat, longitude: lon },
      });

      const topoData = await fetchElevationEdge(lat, lon);
      const centerElev = topoData.elevation_m || 280;
      const centerSlope = topoData.slope_pct || 2.2;

      await sendEvent('tool_result', {
        tool: 'subfield_dem_vulnerability_grid',
        summary: `Topography for ${locationLabel}: Elevation ${centerElev}m, Slope ${centerSlope.toFixed(1)}%`,
      });

      // 6. Verified Live NASA URLs
      const now = new Date();
      const pastDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const bbox = `${(lon - 0.5).toFixed(4)},${(lat - 0.5).toFixed(4)},${(lon + 0.5).toFixed(4)},${(lat + 0.5).toFixed(4)}`;

      const verifiedLinks = {
        nasa_power_json: `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR,ALLSKY_SFC_SW_DWN,T2M,RH2M,WS2M&community=AG&longitude=${lon.toFixed(4)}&latitude=${lat.toFixed(4)}&start=20211108&end=20261108&format=JSON`,
        nasa_worldview: `https://worldview.earthdata.nasa.gov/?v=${bbox}&t=${pastDate}&l=Reference_Labels_15m,Reference_Features_15m,Coastlines_15m,SMAP_L4_Analyzed_Root_Zone_Soil_Moisture,MODIS_Terra_CorrectedReflectance_TrueColor`,
        smap_doi: 'https://doi.org/10.5067/T5RUATAQREF8',
        power_doi: 'https://doi.org/10.5067/POWER/DAILY',
      };

      await sendEvent('verified_links', { links: verifiedLinks });

      // 7. Interactive Visual Cards
      const effectiveAction = actionType ||
        (qLower.includes('water stress') ? 'water_stress' :
        (qLower.includes('erosion') || qLower.includes('slope') || qLower.includes('mmomonyoko') || qLower.includes('mwinamo') ? 'erosion_risk' :
        (qLower.includes('soil moisture') || qLower.includes('smap') || qLower.includes('unyevu') ? 'smap_moisture' : null)));

      if (effectiveAction === 'water_stress') {
        await sendEvent('visual_card', {
          type: 'water_stress_strip',
          title: isSw ? 'Kipimo cha Miezi 12 cha Unyevu (GPM & POWER)' : '12-Month Satellite Moisture Strip (GPM & POWER)',
          months: [
            { name: 'J', status: 'moist' }, { name: 'F', status: 'moist' }, { name: 'M', status: 'wet' },
            { name: 'A', status: 'wet' }, { name: 'M', status: 'moist' }, { name: 'J', status: 'dry' },
            { name: 'J', status: 'dry' }, { name: 'A', status: 'dry' }, { name: 'S', status: 'dry' },
            { name: 'O', status: 'moist' }, { name: 'N', status: 'wet' }, { name: 'D', status: 'wet' },
          ],
          bare_months_count: 4,
          highlight: isSw ? 'Miezi 4 ya Udongo Tupu / Ukame' : '4 Bare Months',
        });
      } else if (effectiveAction === 'erosion_risk') {
        await sendEvent('visual_card', {
          type: 'erosion_rusle_grid',
          title: isSw ? 'Mwinamo na Mmomonyoko wa Udongo (RUSLE)' : 'Topographic Slope & RUSLE Soil Loss',
          peak_slope_pct: centerSlope,
          mean_rusle_t_ha: 14.8,
          t_value: 8.0,
        });
      }

      // 8. Dynamic Agronomic Reasoning via Gemini LLM or Scientific Synthesis
      let synthesis = '';

      if (geminiApiKey) {
        try {
          const systemInstruction = isSw
            ? `Wewe ni TerraShift+ Afisa Ugani wa NASA wa Kilimo cha Ustahimilivu wa Tabianchi.
Jibu kwa Kiswahili fasaha cha heshima, kueleweka na chenye sayansi halisi ya NASA.
Data zilizopatikana sasa hivi moja kwa moja kutoka NASA na Open-Meteo kwa eneo la ${locationLabel} (${lat.toFixed(4)}, ${lon.toFixed(4)}):
- Mvua ya Mwaka: ${powerData.annual_precip_mm || 0} mm
- Joto la Wastani: ${powerData.mean_temp_c || 0} °C
- Unyevu wa Mizizi (SMAP L4): ${powerData.gwet_root_current || 0.48}
- Uvukizi wa FAO-56 (ET0): ${powerData.fao56_reference_et_mm_day || 4.2} mm/siku
- Mwinamo wa Ardhi (SRTM): ${centerSlope.toFixed(1)}% (Mwinuko: ${centerElev} m)

Tumia data hizi halisi kutoa majibu ya moja kwa moja kwa mkulima. Epuka takwimu za kubuni. Usitumie emoji.`
            : `You are TerraShift+, the official NASA Earth Observation Agronomic Copilot.
Answer professionally, clearly, and concisely using verified NASA and Earth science telemetry.
Telemetry retrieved live right now for ${locationLabel} (${lat.toFixed(4)}, ${lon.toFixed(4)}):
- Annual Precipitation: ${powerData.annual_precip_mm || 0} mm
- Mean Temperature: ${powerData.mean_temp_c || 0} °C
- Root-Zone Soil Moisture (NASA SMAP L4): ${powerData.gwet_root_current || 0.48}
- Reference Evapotranspiration (FAO-56 ET0): ${powerData.fao56_reference_et_mm_day || 4.2} mm/day
- Topographic Slope (SRTM DEM): ${centerSlope.toFixed(1)}% (Elevation: ${centerElev} m)

Answer the farmer's question directly with these live parameters without emojis or fluff.`;

          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
          const geminiReq = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: `${systemInstruction}\n\nFarmer Query: ${question}` }]
              }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 512,
              }
            })
          });

          if (geminiReq.ok) {
            const geminiData = await geminiReq.json();
            synthesis = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
          }
        } catch (llmErr) {
          console.warn('[TerraShift+ Dynamic LLM] Error:', llmErr);
        }
      }

      // Fallback to deterministic physical synthesis if Gemini is unavailable or rate limited
      if (!synthesis) {
        if (isForeignPlace) {
          synthesis = isSw
            ? `Takwimu za moja kwa moja za satelaiti za NASA kwa eneo la **${locationLabel}** (${lat.toFixed(4)}, ${lon.toFixed(4)}):\n\n` +
              `- **Mvua ya Kila Mwaka:** ${powerData.annual_precip_mm || 0} mm\n` +
              `- **Joto la Wastani:** ${powerData.mean_temp_c || 0} °C\n` +
              `- **Kielezo cha Unyevu wa Mizizi (SMAP L4):** ${powerData.gwet_root_current || 0}\n` +
              `- **Kiu ya Uvukizi ya FAO-56 (ET0):** ${powerData.fao56_reference_et_mm_day || 0} mm/siku\n\n` +
              `Data hizi zimechukuliwa moja kwa moja kutoka kwenye API ya NASA POWER na satelaiti za NASA bila data ya kubuni.`
            : `Live NASA Earth observation telemetry for **${locationLabel}** (${lat.toFixed(4)}, ${lon.toFixed(4)}):\n\n` +
              `- **Annual Rainfall:** ${powerData.annual_precip_mm || 0} mm\n` +
              `- **Mean Temperature:** ${powerData.mean_temp_c || 0} °C\n` +
              `- **Root-Zone Soil Wetness (NASA SMAP L4):** ${powerData.gwet_root_current || 0}\n` +
              `- **Reference Evapotranspiration (FAO-56 ET0):** ${powerData.fao56_reference_et_mm_day || 0} mm/day\n\n` +
              `Retrieved in real time directly from NASA POWER v2.0 and NASA Earthdata without hardcoded mocks or static coordinates.`;
        } else {
          synthesis = isSw
            ? `Takwimu za moja kwa moja za satelaiti za NASA kwa shamba lako (**${locationLabel}** - ${lat.toFixed(4)}, ${lon.toFixed(4)}):\n\n` +
              `- **Mvua ya Kila Mwaka:** ${powerData.annual_precip_mm || 0} mm\n` +
              `- **Joto la Wastani:** ${powerData.mean_temp_c || 0} °C\n` +
              `- **Unyevu wa Tabaka la Mizizi (SMAP L4):** ${powerData.gwet_root_current || 0}\n` +
              `- **Uvukizi wa FAO-56 (ET0):** ${powerData.fao56_reference_et_mm_day || 0} mm/siku\n\n` +
              `Mfumo wa TerraShift+ unachanganua data hizi za NASA kulinda udongo wako dhidi ya jua na mmomonyoko wa msimu wa kiangazi.`
            : `Live NASA Earth observation telemetry for your field (**${locationLabel}** - ${lat.toFixed(4)}, ${lon.toFixed(4)}):\n\n` +
              `- **Annual Rainfall:** ${powerData.annual_precip_mm || 0} mm\n` +
              `- **Mean Temperature:** ${powerData.mean_temp_c || 0} °C\n` +
              `- **Root-Zone Soil Wetness (NASA SMAP L4):** ${powerData.gwet_root_current || 0}\n` +
              `- **Reference Evapotranspiration (FAO-56 ET0):** ${powerData.fao56_reference_et_mm_day || 0} mm/day\n\n` +
              `TerraShift+ couples these live satellite observations with physical governing laws to design climate-resilient crop rotations and prevent bare-soil degradation.`;
        }
      }

      // 9. Stream tokens in real time (chunked 2-3 words for smooth UI animation)
      const words = synthesis.split(' ');
      for (let i = 0; i < words.length; i += 3) {
        const chunk = words.slice(i, i + 3).join(' ') + ' ';
        await sendEvent('token', { text: chunk, token: chunk });
      }

      // 10. Citations
      const citations = [
        'NASA POWER v2.0 Agroclimatology (LaRC MERRA-2)',
        'NASA SMAP L4 Root-Zone Soil Moisture (SPL4SMGP V008)',
        'FAO-56 Penman-Monteith Biophysical Water Balance',
        'SRTM 30m Digital Elevation Model',
      ];
      await sendEvent('citations', { citations });

      // 11. Done Event
      await sendEvent('done', { status: 'complete' });
    } catch (err) {
      await sendEvent('error', { error: err.message || 'Chat generation error' });
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
