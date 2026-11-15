/**
 * Cloudflare Pages Function: GET /api/v1/crops
 */

export async function onRequestGet(context) {
  try {
    // Attempt reading via ASSETS binding (available on Cloudflare Pages)
    if (context.env?.ASSETS?.fetch) {
      const url = new URL('/data/fao-ecocrop-traits.json', context.request.url);
      const res = await context.env.ASSETS.fetch(url);
      if (res.ok) {
        const crops = await res.json();
        return new Response(JSON.stringify(crops), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    // Direct origin fetch fallback
    const originUrl = new URL('/data/fao-ecocrop-traits.json', context.request.url);
    const originRes = await fetch(originUrl.toString());
    if (originRes.ok) {
      const data = await originRes.json();
      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    throw new Error('Assets not found');
  } catch {
    // Safe hardcoded fallback catalog if static file is inaccessible
    const fallbackCrops = [
      { id: 'maize', name: 'Maize (Zea mays - Reference Conventional)', role: 'grain', family: 'Poaceae', gdd_req: 1500, kc_mid: 1.20 },
      { id: 'pigeonpea', name: 'Pigeonpea (Cajanus cajan)', role: 'legume', family: 'Fabaceae', gdd_req: 1600, kc_mid: 1.05 },
      { id: 'cowpea', name: 'Cowpea (Vigna unguiculata)', role: 'legume', family: 'Fabaceae', gdd_req: 950, kc_mid: 0.95 },
      { id: 'finger_millet', name: 'Finger Millet (Eleusine coracana)', role: 'grain', family: 'Poaceae', gdd_req: 1300, kc_mid: 1.00 },
      { id: 'sorghum', name: 'Sorghum (Sorghum bicolor)', role: 'grain', family: 'Poaceae', gdd_req: 1400, kc_mid: 1.00 },
      { id: 'pearl_millet', name: 'Pearl Millet (Pennisetum glaucum)', role: 'grain', family: 'Poaceae', gdd_req: 1150, kc_mid: 0.95 },
      { id: 'sesame', name: 'Sesame (Sesamum indicum)', role: 'oilseed', family: 'Pedaliaceae', gdd_req: 1200, kc_mid: 0.95 },
      { id: 'chickpea', name: 'Chickpea (Cicer arietinum)', role: 'legume', family: 'Fabaceae', gdd_req: 1100, kc_mid: 1.00 },
      { id: 'cassava', name: 'Cassava (Manihot esculenta)', role: 'tuber', family: 'Euphorbiaceae', gdd_req: 2200, kc_mid: 0.85 },
      { id: 'groundnut', name: 'Groundnut (Arachis hypogaea)', role: 'legume', family: 'Fabaceae', gdd_req: 1350, kc_mid: 1.15 },
      { id: 'teff', name: 'Teff (Eragrostis tef)', role: 'grain', family: 'Poaceae', gdd_req: 1000, kc_mid: 0.95 },
    ];
    return new Response(JSON.stringify(fallbackCrops), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
