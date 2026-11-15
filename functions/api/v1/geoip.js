/**
 * Cloudflare Pages Function: GET /api/v1/geoip
 * Instant Edge Geo-IP detection leveraging Cloudflare request.cf metadata
 * with resilient HTTPS fallback for local dev.
 */

export async function onRequestGet(context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'private, max-age=300',
  };

  const cf = context.request?.cf;
  if (cf && typeof cf.latitude === 'string' && typeof cf.longitude === 'string') {
    const lat = parseFloat(cf.latitude);
    const lon = parseFloat(cf.longitude);
    if (!isNaN(lat) && !isNaN(lon)) {
      const parts = [cf.city, cf.region, cf.country].filter(Boolean);
      return new Response(
        JSON.stringify({
          success: true,
          latitude: lat,
          longitude: lon,
          city: cf.city || null,
          region: cf.region || null,
          country: cf.country || null,
          label: parts.length > 0 ? parts.join(', ') : 'Detected Location',
          source: 'cloudflare-edge-cf',
        }),
        { headers }
      );
    }
  }

  // Fallback for local environments or when request.cf is absent
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch('https://get.geojs.io/v1/ip/geo.json', {
      signal: controller.signal,
      headers: { 'User-Agent': 'TerraShift/2.0' },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const lat = parseFloat(data.latitude);
      const lon = parseFloat(data.longitude);
      if (!isNaN(lat) && !isNaN(lon)) {
        const parts = [data.city, data.region, data.country].filter(Boolean);
        return new Response(
          JSON.stringify({
            success: true,
            latitude: lat,
            longitude: lon,
            city: data.city || null,
            region: data.region || null,
            country: data.country || null,
            label: parts.length > 0 ? parts.join(', ') : 'Detected Location',
            source: 'geojs-https-fallback',
          }),
          { headers }
        );
      }
    }
  } catch (err) {
    console.warn('[GeoIP] HTTPS fallback lookup failed:', err.message);
  }

  // Default fallback if both edge CF and HTTPS lookup fail
  return new Response(
    JSON.stringify({
      success: true,
      latitude: -6.163,
      longitude: 35.7516,
      city: 'Dodoma',
      region: 'Dodoma Region',
      country: 'Tanzania',
      label: 'Central Semiarid Zone (Dodoma, TZ)',
      source: 'default-reference-centroid',
    }),
    { headers }
  );
}
