/**
 * HTTP API, framework-free so the same handler mounts in Vite dev and in
 * the production server.
 *
 *   GET  /api/status      → { provider: { id, label, models } }
 *   POST /api/swarm/run   → Server-Sent Events stream of engine events
 */

import fs from 'node:fs';
import { runSwarm } from '../shared/engine.js';
import { selectProvider } from './providers/index.js';

export function loadEnv(file = '.env') {
  if (fs.existsSync(file)) process.loadEnvFile(file);
  // Accept the v1 variable name so an old .env keeps working.
  if (!process.env.GEMINI_API_KEY && process.env.REACT_APP_GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
  }
}

const MAX_BODY = 1_000_000;

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('Request body too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function validateGraph(body) {
  const { nodes, edges, mission } = body;
  if (!Array.isArray(nodes) || !nodes.length) return 'nodes must be a non-empty array';
  if (!Array.isArray(edges)) return 'edges must be an array';
  if (!mission || typeof mission.goal !== 'string' || !mission.goal.trim()) return 'mission.goal is required';
  if (nodes.length > 40) return 'at most 40 nodes per run';
  return null;
}

export function createApiHandler() {
  const provider = selectProvider();
  console.log(`[swarmframe] LLM provider: ${provider.describe().label} ${JSON.stringify(provider.describe().models)}`);

  return async function handle(req, res, next) {
    const url = new URL(req.url, 'http://localhost');

    if (url.pathname === '/api/status' && req.method === 'GET') {
      return sendJson(res, 200, { provider: provider.describe() });
    }

    if (url.pathname === '/api/swarm/run' && req.method === 'POST') {
      let body;
      try { body = await readJson(req); } catch (e) { return sendJson(res, 400, { error: e.message }); }
      const invalid = validateGraph(body);
      if (invalid) return sendJson(res, 400, { error: invalid });

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      const controller = new AbortController();
      res.on('close', () => { if (!res.writableEnded) controller.abort(); });

      const emit = (type, payload) => {
        if (!res.writableEnded) res.write(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`);
      };
      const heartbeat = setInterval(() => { if (!res.writableEnded) res.write(': ping\n\n'); }, 15000);

      try {
        await runSwarm({ ...body, provider, emit, abortSignal: controller.signal });
      } catch (err) {
        emit('run_error', { message: err.message || String(err) });
      } finally {
        clearInterval(heartbeat);
        res.end();
      }
      return;
    }

    if (url.pathname.startsWith('/api/')) return sendJson(res, 404, { error: 'not found' });
    return next?.();
  };
}
