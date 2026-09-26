/**
 * SwarmFrame engine — runs a node graph against an LLM provider.
 *
 * Isomorphic: the Node server runs it against Claude or Gemini, and the
 * browser runs it against the mock provider when no backend is reachable.
 *
 * Scheduling is derived from the edges (not a hand-maintained stage list):
 * a node starts as soon as every upstream node has finished, so independent
 * branches run in parallel. One failing node skips its descendants instead
 * of killing the whole run.
 *
 * Events emitted (emit(type, payload)):
 *   run_start   { order, provider }
 *   node_start  { id, pass, model }
 *   node_delta  { id, text, kind: 'text' | 'thinking' }
 *   node_reset  { id, reason }            — a revision pass is about to stream
 *   codex       { id, result }
 *   upe         { id, result }
 *   node_done   { id, output, ms, passes }
 *   node_error  { id, message }
 *   node_skip   { id, reason }
 *   log         { level, message, id? }
 *   run_done    { ms, final }
 */

import { renderPrompt } from './template.js';
import {
  NODE_ROLES, blueprintSystem, plainSystem,
  CODEX_SCHEMA, codexPrompt, finalizeCodex,
  UPE_SCHEMA, upePrompt, finalizeUPE, refinementPrompt,
} from './layers.js';

export const DEFAULT_OPTIONS = {
  blueprint: true,
  codex: true,
  upe: true,
  autoRefine: true,
  maxRefinements: 1,
};

export class CycleError extends Error {}

/** Kahn's algorithm; returns node ids in dependency order or throws on a cycle. */
export function topoOrder(nodes, edges) {
  const ids = new Set(nodes.map((n) => n.id));
  const indeg = new Map(nodes.map((n) => [n.id, 0]));
  const out = new Map(nodes.map((n) => [n.id, []]));
  for (const e of edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) continue;
    indeg.set(e.target, indeg.get(e.target) + 1);
    out.get(e.source).push(e.target);
  }
  const queue = nodes.filter((n) => indeg.get(n.id) === 0).map((n) => n.id);
  const order = [];
  while (queue.length) {
    const id = queue.shift();
    order.push(id);
    for (const t of out.get(id)) {
      indeg.set(t, indeg.get(t) - 1);
      if (indeg.get(t) === 0) queue.push(t);
    }
  }
  if (order.length !== nodes.length) {
    throw new CycleError('The graph has a cycle — SwarmFrame needs a DAG. Remove a back-edge and run again.');
  }
  return order;
}

function tierFor(node) {
  const m = node.data?.config?.model;
  if (m && m !== 'auto') return m;
  return NODE_ROLES[node.type]?.tier || 'fast';
}

function shouldScore(node) {
  if (typeof node.data?.score === 'boolean') return node.data.score;
  return node.type === 'sentinel' || node.type === 'synth';
}

export async function runSwarm({ nodes, edges, mission, options = {}, provider, emit, abortSignal }) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const t0 = Date.now();
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const parents = new Map(nodes.map((n) => [n.id, []]));
  const children = new Map(nodes.map((n) => [n.id, []]));
  for (const e of edges) {
    if (!byId.has(e.source) || !byId.has(e.target)) continue;
    parents.get(e.target).push(e.source);
    children.get(e.source).push(e.target);
  }

  const order = topoOrder(nodes, edges);
  emit('run_start', { order, provider: provider.describe() });

  const outputs = new Map();
  const state = new Map(nodes.map((n) => [n.id, 'pending'])); // pending | running | done | failed | skipped
  const aborted = () => abortSignal?.aborted;

  const log = (level, message, id) => emit('log', { level, message, id });

  // Judges are advisory: if a (small, local) model can't produce valid JSON,
  // log it and keep the node's output rather than failing the node.
  async function judge(layer, id, args) {
    try {
      return await provider.json({ ...args, tier: 'fast', abortSignal });
    } catch (err) {
      if (aborted()) return null;
      log('warn', `${layer} skipped — ${err.message}`, id);
      return null;
    }
  }

  async function streamPass(node, system, prompt, pass) {
    const tier = tierFor(node);
    emit('node_start', { id: node.id, pass, model: provider.modelFor(tier) });
    let text = '';
    for await (const chunk of provider.stream({ system, prompt, tier, effort: node.data?.config?.effort, abortSignal })) {
      if (aborted()) break;
      if (chunk.kind === 'text') text += chunk.text;
      emit('node_delta', { id: node.id, text: chunk.text, kind: chunk.kind });
    }
    return text.trim();
  }

  async function runNode(node) {
    const start = Date.now();
    const role = NODE_ROLES[node.type];
    const label = node.data?.label || role?.label || node.type;

    const upstream = parents.get(node.id).map((pid) => {
      const p = byId.get(pid);
      return { id: pid, type: p.type, label: p.data?.label || NODE_ROLES[p.type]?.label || p.type, output: outputs.get(pid) };
    });
    const prompt = renderPrompt(node.data?.prompt || '', { signal: mission, upstream });
    const system = opts.blueprint ? blueprintSystem(node.type, node.data?.anatomy, mission) : plainSystem(mission);

    let output = await streamPass(node, system, prompt, 1);
    let passes = 1;
    if (aborted()) return;
    if (!output) throw new Error('The model returned an empty response.');

    // ── Soul: CODEX ──
    if (opts.codex) {
      const { system: cs, prompt: cp } = codexPrompt(output, node.type, mission);
      const raw = await judge('CODEX', node.id, { system: cs, prompt: cp, schema: CODEX_SCHEMA });
      const codex = raw && finalizeCodex(raw);
      if (codex) {
        emit('codex', { id: node.id, result: codex });
        log(codex.approved ? 'pass' : 'warn', `CODEX ${Math.round(codex.score * 100)}%${codex.violations.length ? ` — ${codex.violations.join(', ')}` : ''}`, node.id);

        if (!codex.approved && codex.directive && !aborted()) {
          emit('node_reset', { id: node.id, reason: 'CODEX revision' });
          output = await streamPass(node, system, refinementPrompt(output, codex.directive), ++passes);
        }
      }
    }

    // ── Mind: UPE (+ refinement loop) ──
    if (opts.upe && shouldScore(node)) {
      let refinements = 0;
      while (!aborted()) {
        const { system: us, prompt: up } = upePrompt(output, node.type, mission);
        const raw = await judge('UPE', node.id, { system: us, prompt: up, schema: UPE_SCHEMA });
        if (!raw) break;
        const upe = finalizeUPE(raw);
        emit('upe', { id: node.id, result: { ...upe, pass: passes } });
        log(upe.shouldRefine ? 'warn' : 'pass', `UPE ${Math.round(upe.composite * 100)}%${upe.shouldRefine ? ' — below threshold' : ''}`, node.id);

        if (!upe.shouldRefine || !opts.autoRefine || refinements >= opts.maxRefinements) break;
        refinements++;
        const directives = upe.dimensions
          .filter((d) => d.score < 8)
          .map((d) => `- ${d.name} (${d.score}/10): ${d.improvement}`)
          .join('\n') || upe.assessment;
        emit('node_reset', { id: node.id, reason: `UPE refinement ${refinements}` });
        output = await streamPass(node, system, refinementPrompt(output, directives), ++passes);
      }
    }

    outputs.set(node.id, output);
    emit('node_done', { id: node.id, output, ms: Date.now() - start, passes });
    log('info', `${label} complete in ${((Date.now() - start) / 1000).toFixed(1)}s`, node.id);
  }

  // Event-driven scheduler: start every node whose parents are all done.
  await new Promise((resolve) => {
    let inflight = 0;

    const settle = () => {
      if (aborted()) {
        for (const [id, s] of state) if (s === 'pending') { state.set(id, 'skipped'); emit('node_skip', { id, reason: 'aborted' }); }
      }
      if (inflight === 0) resolve();
    };

    const skipDescendants = (id, reason) => {
      for (const c of children.get(id)) {
        if (state.get(c) !== 'pending') continue;
        state.set(c, 'skipped');
        emit('node_skip', { id: c, reason });
        skipDescendants(c, reason);
      }
    };

    const pump = () => {
      if (aborted()) return settle();
      for (const id of order) {
        if (state.get(id) !== 'pending') continue;
        if (!parents.get(id).every((p) => state.get(p) === 'done')) continue;
        state.set(id, 'running');
        inflight++;
        runNode(byId.get(id))
          .then(() => state.set(id, aborted() ? 'skipped' : 'done'))
          .catch((err) => {
            state.set(id, 'failed');
            if (!aborted()) {
              emit('node_error', { id, message: err.message || String(err) });
              log('error', err.message || String(err), id);
              skipDescendants(id, `upstream ${id} failed`);
            }
          })
          .finally(() => { inflight--; pump(); });
      }
      settle();
    };

    pump();
  });

  // The "final" output is the last completed sink node in topological order.
  const sinks = order.filter((id) => children.get(id).length === 0 && outputs.has(id));
  const finalId = sinks[sinks.length - 1] || null;
  emit('run_done', { ms: Date.now() - t0, final: finalId, aborted: !!aborted() });
}
