/**
 * Cloudflare Pages Function: POST /api/v1/voice/tts
 * Synthesizes text into natural speech via Google Gemini API with fallback flag.
 */

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

  // If no API key or text is very long, return fallback so frontend uses window.speechSynthesis
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

    // Try Gemini TTS model
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
        return new Response(
          JSON.stringify({
            audio_base64: audioPart.inlineData.data,
            mime_type: audioPart.inlineData.mimeType || 'audio/wav',
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
