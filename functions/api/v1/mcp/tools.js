/**
 * Cloudflare Pages Function: GET /api/v1/mcp/tools
 */

import { MCP_TOOLS } from '../../../_lib/mcp.js';

export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      schema_version: '2024-11-05',
      tools: MCP_TOOLS,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
