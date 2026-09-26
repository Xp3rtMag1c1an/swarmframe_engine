import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import { TEMPLATES, DEFAULT_ANATOMY, DEFAULT_PROMPT } from '../shared/templates.js';
import { DEFAULT_OPTIONS, topoOrder } from '../shared/engine.js';
import { probeBackend, startRun } from './lib/runner.js';

const SAVE_KEY = 'swarmframe:v2';

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || null; } catch { return null; }
}
function save(state) {
  try {
    const { templateId, mission, nodes, edges, options } = state;
    localStorage.setItem(SAVE_KEY, JSON.stringify({ templateId, mission, nodes, edges, options }));
  } catch { /* storage unavailable — fine */ }
}

const clone = (x) => JSON.parse(JSON.stringify(x));
const saved = loadSaved();
const first = TEMPLATES[0];

const blankRun = () => ({ status: 'idle', startedAt: null, ms: null, final: null, error: null });

// Deltas arrive faster than React should re-render; buffer them per frame.
let pending = {};
let frame = null;
let handle = null;

export const useStore = create((set, get) => {
  function flush() {
    frame = null;
    const batch = pending;
    pending = {};
    set((s) => {
      const runs = { ...s.nodeRuns };
      for (const [id, { text, thinking }] of Object.entries(batch)) {
        const r = runs[id] || {};
        runs[id] = { ...r, text: (r.text || '') + text, thinking: (r.thinking || '') + thinking };
      }
      return { nodeRuns: runs };
    });
  }

  function patchRun(id, patch) {
    set((s) => ({ nodeRuns: { ...s.nodeRuns, [id]: { ...(s.nodeRuns[id] || {}), ...patch } } }));
  }

  function log(level, message, id) {
    set((s) => ({ log: [...s.log.slice(-400), { t: Date.now(), level, message, id }] }));
  }

  function onEvent(type, p) {
    switch (type) {
      case 'run_start':
        log('info', `Run started on ${p.provider.label} — order: ${p.order.join(' → ')}`);
        break;
      case 'node_start':
        if (frame) { cancelAnimationFrame(frame); flush(); }
        patchRun(p.id, { status: 'running', model: p.model, pass: p.pass, startedAt: Date.now() });
        if (p.pass === 1) log('info', `Activating (${p.model})`, p.id);
        break;
      case 'node_delta': {
        const b = pending[p.id] || (pending[p.id] = { text: '', thinking: '' });
        if (p.kind === 'thinking') b.thinking += p.text; else b.text += p.text;
        if (!frame) frame = requestAnimationFrame(flush);
        break;
      }
      case 'node_reset':
        if (frame) { cancelAnimationFrame(frame); flush(); }
        set((s) => {
          const r = s.nodeRuns[p.id] || {};
          return { nodeRuns: { ...s.nodeRuns, [p.id]: { ...r, drafts: [...(r.drafts || []), r.text], text: '', thinking: '', resetReason: p.reason } } };
        });
        log('warn', `↻ ${p.reason}`, p.id);
        break;
      case 'codex':
        patchRun(p.id, { codex: p.result });
        break;
      case 'upe':
        set((s) => {
          const r = s.nodeRuns[p.id] || {};
          return { nodeRuns: { ...s.nodeRuns, [p.id]: { ...r, upe: [...(r.upe || []), p.result] } } };
        });
        break;
      case 'node_done':
        if (frame) { cancelAnimationFrame(frame); flush(); }
        patchRun(p.id, { status: 'done', text: p.output, ms: p.ms, passes: p.passes });
        break;
      case 'node_error':
        patchRun(p.id, { status: 'error', error: p.message });
        break;
      case 'node_skip':
        patchRun(p.id, { status: 'skipped', error: p.reason });
        break;
      case 'log':
        log(p.level, p.message, p.id);
        break;
      case 'run_error':
        set((s) => ({ run: { ...s.run, status: 'error', error: p.message, ms: Date.now() - s.run.startedAt } }));
        log('error', p.message);
        break;
      case 'run_done':
        if (frame) { cancelAnimationFrame(frame); flush(); }
        set((s) => ({
          run: {
            ...s.run,
            status: p.aborted ? 'stopped' : s.run.status === 'error' ? 'error' : 'done',
            ms: Date.now() - s.run.startedAt,
            final: p.final ?? s.run.final,
          },
          inspector: p.final && !p.aborted ? 'output' : s.inspector,
        }));
        log(p.aborted ? 'warn' : 'pass', p.aborted ? 'Run stopped' : `Run complete in ${((Date.now() - get().run.startedAt) / 1000).toFixed(1)}s`);
        break;
      default:
    }
  }

  return {
    backend: { mode: 'probing', label: '…', models: {} },
    templateId: saved?.templateId || first.id,
    mission: saved?.mission || clone(first.mission),
    nodes: saved?.nodes || clone(first.nodes),
    edges: saved?.edges || clone(first.edges),
    options: { ...DEFAULT_OPTIONS, ...(saved?.options || {}) },
    run: blankRun(),
    nodeRuns: {},
    log: [],
    selected: null,
    inspector: 'output', // 'output' | 'node'

    async init() {
      set({ backend: await probeBackend() });
    },

    loadTemplate(id) {
      const t = TEMPLATES.find((x) => x.id === id);
      if (!t || get().run.status === 'running') return;
      set({ templateId: id, mission: clone(t.mission), nodes: clone(t.nodes), edges: clone(t.edges), nodeRuns: {}, run: blankRun(), selected: null, inspector: 'output' });
      save(get());
    },

    setMission(patch) { set((s) => ({ mission: { ...s.mission, ...patch } })); save(get()); },
    setOption(patch) { set((s) => ({ options: { ...s.options, ...patch } })); save(get()); },

    onNodesChange(changes) { set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) })); save(get()); },
    onEdgesChange(changes) { set((s) => ({ edges: applyEdgeChanges(changes, s.edges) })); save(get()); },
    onConnect(conn) {
      if (conn.source === conn.target) return;
      const next = addEdge({ ...conn, id: `${conn.source}->${conn.target}` }, get().edges);
      try { topoOrder(get().nodes, next); } catch { log('error', 'That connection would create a cycle — skipped.'); return; }
      set({ edges: next });
      save(get());
    },

    updateNodeData(id, patch) {
      set((s) => ({ nodes: s.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)) }));
      save(get());
    },

    addNode(type) {
      const { nodes } = get();
      let i = 1;
      while (nodes.some((n) => n.id === `${type}-${i}`)) i++;
      const maxY = nodes.reduce((m, n) => Math.max(m, n.position.y), 0);
      const node = {
        id: `${type}-${i}`, type,
        position: { x: 320, y: maxY + 40 },
        data: { prompt: DEFAULT_PROMPT[type], anatomy: { ...DEFAULT_ANATOMY[type] }, config: { model: 'auto' } },
      };
      set({ nodes: [...nodes, node], selected: node.id, inspector: 'node' });
      save(get());
    },

    removeNode(id) {
      set((s) => ({
        nodes: s.nodes.filter((n) => n.id !== id),
        edges: s.edges.filter((e) => e.source !== id && e.target !== id),
        selected: s.selected === id ? null : s.selected,
        inspector: s.selected === id ? 'output' : s.inspector,
      }));
      save(get());
    },

    select(id) { set({ selected: id, inspector: id ? 'node' : 'output' }); },
    setInspector(inspector) { set({ inspector }); },

    launch() {
      const s = get();
      if (s.run.status === 'running' || s.backend.mode === 'probing') return;
      try { topoOrder(s.nodes, s.edges); } catch (e) { log('error', e.message); return; }
      if (!s.mission.goal.trim()) { log('error', 'Set a mission goal first.'); return; }
      const nodeRuns = Object.fromEntries(s.nodes.map((n) => [n.id, { status: 'queued' }]));
      set({ nodeRuns, log: [], run: { ...blankRun(), status: 'running', startedAt: Date.now() }, inspector: 'output' });
      handle = startRun({ mode: s.backend.mode, nodes: s.nodes, edges: s.edges, mission: s.mission, options: s.options, onEvent });
    },

    stop() { handle?.abort(); },

    exportSwarm() {
      const { mission, nodes, edges, options, nodeRuns, run } = get();
      return { version: 2, mission, nodes, edges, options, results: run.status === 'idle' ? undefined : nodeRuns };
    },

    importSwarm(data) {
      if (!Array.isArray(data?.nodes) || !Array.isArray(data?.edges)) throw new Error('Not a SwarmFrame export');
      set({ mission: data.mission || get().mission, nodes: data.nodes, edges: data.edges, options: { ...DEFAULT_OPTIONS, ...data.options }, nodeRuns: {}, run: blankRun(), selected: null, templateId: 'custom' });
      save(get());
    },
  };
});
