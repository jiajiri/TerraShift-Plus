/**
 * Cloudflare Pages Function: POST /api/v1/voice/transcribe
 * Multimodal audio transcription via Google Gemini API.
 */

export async function onRequestPost(context) {
  let reqData = {};
  try {
    reqData = await context.request.json();
  } catch {
    reqData = {};
  }

  const audioBase64 = reqData.audio_base64 || '';
  const mimeType = reqData.mime_type || 'audio/webm';
  const langHint = reqData.lang || 'auto';
  const apiKey = context.env?.GEMMINI_API_KEY || context.env?.GEMINI_API_KEY;

  if (!audioBase64) {
    return new Response(JSON.stringify({ error: 'Missing audio_base64 payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const prompt =
      langHint === 'sw'
        ? 'Sikiliza sauti hii na uandike kwa maneno halisi yaliyosemwa kwa Kiswahili fasaha (au Kiingereza kama kilisemwa). Toa tu maneno yaliyosemwa bila maelezo mengine.'
        : 'Transcribe this agricultural speech audio accurately into plain text. Return only the spoken words with no preamble.';

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: audioBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 256,
        },
      }),
    });

    if (geminiRes.ok) {
      const data = await geminiRes.json();
      const transcript = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      return new Response(
        JSON.stringify({
          transcript,
          detected_lang: langHint,
          success: true,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } else {
      const errText = await geminiRes.text();
      return new Response(JSON.stringify({ error: 'Gemini transcription error', details: errText }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Transcription failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
