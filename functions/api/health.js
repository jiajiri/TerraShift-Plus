/**
 * Cloudflare Pages Function: GET /api/health
 */

export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      version: '2.0.0',
      runtime: 'Cloudflare Pages Functions (Edge V8)',
      timestamp: new Date().toISOString(),
      services: {
        nasa_power: 'operational',
        open_meteo_dem: 'operational',
        soilgrids: 'operational',
        piml_engine: 'operational',
      },
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
