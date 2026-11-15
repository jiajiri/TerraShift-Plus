/**
 * Cloudflare Pages Function: POST /api/v1/voice/tts
 * Ultra Low-Latency Edge Voice Synthesis:
 * 1. O(1) Edge LRU Cache
 * 2. Strict 3.5-second AbortController timeout on Google API -> instantaneous browser fallback
 * 3. Priority snippet truncation (first 250 chars) for sub-second generation
 */

import { pcmToWav } from './wav_helper.js';

const MAX_CACHE_SIZE = 50;
const ttsLruCache = new Map();

function getCachedAudio(key) {
  if (ttsLruCache.has(key)) {
    const val = ttsLruCache.get(key);
    ttsLruCache.delete(key);
    ttsLruCache.set(key, val);
    return val;
  }
  return null;
}

function setCachedAudio(key, val) {
  if (ttsLruCache.has(key)) {
    ttsLruCache.delete(key);
  } else if (ttsLruCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = ttsLruCache.keys().next().value;
    ttsLruCache.delete(oldestKey);
  }
  ttsLruCache.set(key, val);
}

function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

export async function onRequestPost(context) {
  let reqData = {};
  try {
    reqData = await context.request.json();
  } catch {
    reqData = {};
  }

  const text = (reqData.text || '').trim();
  const lang = reqData.lang === 'sw' ? 'sw' : 'en';
  const apiKey = context.env?.GEMMINI_API_KEY || context.env?.GEMINI_API_KEY;

  if (!text) {
    return new Response(JSON.stringify({ error: 'Missing text parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // DSA Clean & Snippet Selection (O(N) single-pass regex)
  const cleanSpokenText = text
    .replace(/https?:\/\/[^\s)]+/g, '')
    .replace(/[#*`_~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  // Extract first 1-2 key sentences (max 260 chars) for ultra-fast generation (<1.5s)
  const sentences = cleanSpokenText.match(/[^.!?]+[.!?]+/g) || [cleanSpokenText];
  const prioritySpokenText = sentences.slice(0, 2).join(' ').slice(0, 260).trim();

  if (!apiKey) {
    return new Response(JSON.stringify({ fallback: true, clean_text: prioritySpokenText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const cacheKey = `${lang}_${hashString(prioritySpokenText)}`;
  const cached = getCachedAudio(cacheKey);
  if (cached) {
    return new Response(JSON.stringify(cached), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache-Lookup': 'HIT',
      },
    });
  }

  try {
    const systemPrompt =
      lang === 'sw'
        ? 'Soma maneno haya kwa sauti ya Kiswahili fasaha cha Tanzania, kwa sauti ya utulivu na kueleweka.'
        : 'Read these sentences aloud in natural, clear, professional English.';

    // Strict 3.5s timeout: if Google upstream lags, immediately fallback to browser speech synthesis
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\n${prioritySpokenText}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: lang === 'sw' ? 'Puck' : 'Aoede',
              },
            },
          },
        },
      }),
    });

    clearTimeout(timeoutId);

    if (geminiRes.ok) {
      const data = await geminiRes.json();
      const audioPart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.mimeType?.startsWith('audio/'));
      if (audioPart && audioPart.inlineData?.data) {
        const rawB64 = audioPart.inlineData.data;

        let finalB64 = rawB64;
        try {
          const binaryStr = atob(rawB64);
          const pcmBytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            pcmBytes[i] = binaryStr.charCodeAt(i);
          }

          const isRiff = pcmBytes.length > 4 &&
            pcmBytes[0] === 0x52 && pcmBytes[1] === 0x49 &&
            pcmBytes[2] === 0x46 && pcmBytes[3] === 0x46;

          if (!isRiff) {
            const wavBytes = pcmToWav(pcmBytes, 24000, 1, 16);
            let wavBinary = '';
            const chunkSize = 8192;
            for (let i = 0; i < wavBytes.length; i += chunkSize) {
              wavBinary += String.fromCharCode.apply(null, wavBytes.subarray(i, i + chunkSize));
            }
            finalB64 = btoa(wavBinary);
          }
        } catch (convErr) {
          console.warn('[TerraShift+ TTS] WAV conversion warning:', convErr);
        }

        const responsePayload = {
          audio_base64: finalB64,
          mime_type: 'audio/wav',
          fallback: false,
          clean_text: prioritySpokenText,
        };

        setCachedAudio(cacheKey, responsePayload);

        return new Response(JSON.stringify(responsePayload), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Cache-Lookup': 'MISS',
          },
        });
      }
    }
  } catch (err) {
    console.warn('[TerraShift+ TTS] Gemini TTS call timeout or error, falling back:', err);
  }

  // Graceful instantaneous browser speech synthesis fallback
  return new Response(JSON.stringify({ fallback: true, clean_text: prioritySpokenText }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
