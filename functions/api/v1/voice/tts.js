/**
 * Cloudflare Pages Function: POST /api/v1/voice/tts
 * Synthesizes text into natural speech via Google Gemini API with valid WAV packaging.
 */

import { pcmToWav } from './wav_helper.js';

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

  if (!apiKey) {
    return new Response(JSON.stringify({ fallback: true, reason: 'no_api_key' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Clean text from raw URLs, markdown asterisks, hashes, and citations for natural speech
  const cleanSpokenText = text
    .replace(/https?:\/\/[^\s)]+/g, '')
    .replace(/[#*`_~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1500);

  try {
    const systemPrompt =
      lang === 'sw'
        ? 'Soma maneno haya kwa sauti ya Kiswahili fasaha cha Tanzania, kwa sauti ya utulivu, heshima, na kueleweka kama Afisa Ugani wa Kilimo.'
        : 'Read these sentences aloud in natural, clear, professional English as a precision agriculture advisor.';

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\n${cleanSpokenText}`,
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

    if (geminiRes.ok) {
      const data = await geminiRes.json();
      const audioPart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.mimeType?.startsWith('audio/'));
      if (audioPart && audioPart.inlineData?.data) {
        const rawB64 = audioPart.inlineData.data;
        const mime = audioPart.inlineData.mimeType || '';

        // If PCM or headerless, wrap in valid 44-byte WAV header so browsers can play it natively
        let finalB64 = rawB64;
        let finalMime = 'audio/wav';

        try {
          const binaryStr = atob(rawB64);
          const pcmBytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            pcmBytes[i] = binaryStr.charCodeAt(i);
          }

          // Check if it already has RIFF header
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
          console.warn('[TerraShift+ TTS] WAV encapsulation warning:', convErr);
        }

        return new Response(
          JSON.stringify({
            audio_base64: finalB64,
            mime_type: finalMime,
            fallback: false,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }
  } catch (err) {
    console.warn('[TerraShift+ TTS] Gemini TTS call failed, falling back:', err);
  }

  // Graceful browser speech synthesis fallback
  return new Response(JSON.stringify({ fallback: true, clean_text: cleanSpokenText }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
