import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';

// Regression guard for the 2026-08-31 edge-request spike: a 200 on GET makes
// Claude Code's streamable-HTTP client treat it as an SSE stream that closes
// immediately and reconnect in a tight loop (~1-2 GET/s per session).
describe('/api/ai-tools/mcp method handling', () => {
  let route: typeof import('../mcp/route');

  beforeAll(async () => {
    process.env.AI_TOOLS_MCP_READ_TOKEN = 'test-read-token';
    route = await import('../mcp/route');
  });

  it('GET returns 405 (no SSE stream offered), never 200', async () => {
    const res = await route.GET();
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('POST');
  });

  it('DELETE returns 405', async () => {
    const res = await route.DELETE();
    expect(res.status).toBe(405);
  });

  it('POST initialize still answers JSON-RPC', async () => {
    const req = new NextRequest('http://localhost/api/ai-tools/mcp', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-read-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }),
    });
    const res = await route.POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result.serverInfo.name).toBe('ai-tools-crm');
  });

  it('POST without token is rejected with 401', async () => {
    const req = new NextRequest('http://localhost/api/ai-tools/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }),
    });
    const res = await route.POST(req);
    expect(res.status).toBe(401);
  });
});
