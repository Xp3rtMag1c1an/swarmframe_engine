/**
 * Client transport. Uses the server (/api) when reachable — real LLM calls,
 * keys stay server-side. Falls back to running the shared engine in the
 * browser with the demo provider, so a static build still previews fully.
 */

import { runSwarm } from '../../shared/engine.js';
import { createMockProvider } from '../../shared/providers/mock.js';

export async function probeBackend() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch('./api/status', { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(String(res.status));
    const { provider } = await res.json();
    return { mode: 'server', ...provider };
  } catch {
    return { mode: 'browser', ...createMockProvider().describe() };
  }
}

function parseSSE(buffer, onEvent) {
  let idx;
  while ((idx = buffer.indexOf('\n\n')) >= 0) {
    const block = buffer.slice(0, idx);
    buffer = buffer.slice(idx + 2);
    let type = 'message';
    let data = '';
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) type = line.slice(6).trim();
      else if (line.startsWith('data:')) data += line.slice(5).trim();
    }
    if (data) onEvent(type, JSON.parse(data));
  }
  return buffer;
}

async function runOnServer(payload, onEvent, signal) {
  const res = await fetch('./api/swarm/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer = parseSSE(buffer + decoder.decode(value, { stream: true }), onEvent);
  }
}

export function startRun({ mode, nodes, edges, mission, options, onEvent }) {
  const controller = new AbortController();
  const payload = {
    nodes: nodes.map(({ id, type, data }) => ({ id, type, data })),
    edges: edges.map(({ id, source, target }) => ({ id, source, target })),
    mission,
    options,
  };

  const done = (async () => {
    try {
      if (mode === 'server') {
        await runOnServer(payload, onEvent, controller.signal);
      } else {
        await runSwarm({ ...payload, provider: createMockProvider(), emit: onEvent, abortSignal: controller.signal });
      }
    } catch (err) {
      if (err.name === 'AbortError') onEvent('run_done', { aborted: true });
      else onEvent('run_error', { message: err.message || String(err) });
    }
  })();

  return { abort: () => controller.abort(), done };
}
