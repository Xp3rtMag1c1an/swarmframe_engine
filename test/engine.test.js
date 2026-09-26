import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runSwarm, topoOrder, CycleError } from '../shared/engine.js';
import { renderPrompt } from '../shared/template.js';
import { createMockProvider } from '../shared/providers/mock.js';
import { TEMPLATES } from '../shared/templates.js';

test('renderPrompt resolves dot paths and upstream outputs, appends unreferenced inputs', () => {
  const out = renderPrompt('Goal: {{signal.goal}} / {{cortex}} / {{missing}}', {
    signal: { goal: 'G' },
    upstream: [
      { id: 'cortex-1', type: 'cortex', label: 'Cortex', output: 'C-OUT' },
      { id: 'muse-1', type: 'muse', label: 'Muse', output: 'M-OUT' },
    ],
  });
  assert.match(out, /^Goal: G \/ C-OUT \/ \{\{missing\}\}/);
  assert.match(out, /### From Muse\nM-OUT/);
  assert.doesNotMatch(out, /### From Cortex/);
});

test('topoOrder rejects cycles', () => {
  const nodes = [{ id: 'a' }, { id: 'b' }];
  assert.deepEqual(topoOrder(nodes, [{ source: 'a', target: 'b' }]), ['a', 'b']);
  assert.throws(() => topoOrder(nodes, [{ source: 'a', target: 'b' }, { source: 'b', target: 'a' }]), CycleError);
});

for (const t of TEMPLATES) {
  test(`template "${t.name}" runs end to end on the mock provider`, async () => {
    const events = [];
    await runSwarm({
      nodes: t.nodes, edges: t.edges, mission: t.mission,
      provider: createMockProvider({ speed: 200 }),
      emit: (type, payload) => events.push({ type, payload }),
    });
    const done = events.filter((e) => e.type === 'node_done').map((e) => e.payload.id);
    assert.equal(done.length, t.nodes.length, 'every node completes');
    const final = events.find((e) => e.type === 'run_done').payload.final;
    assert.equal(final, 'synth-1');
    // parents always finish before children start
    for (const edge of t.edges) {
      const parentDone = events.findIndex((e) => e.type === 'node_done' && e.payload.id === edge.source);
      const childStart = events.findIndex((e) => e.type === 'node_start' && e.payload.id === edge.target);
      assert.ok(parentDone < childStart, `${edge.source} before ${edge.target}`);
    }
    assert.ok(events.some((e) => e.type === 'upe'), 'UPE scored');
    assert.ok(events.some((e) => e.type === 'codex'), 'CODEX ran');
  });
}

test('a failing node skips its descendants but siblings still run', async () => {
  const t = TEMPLATES[0];
  const base = createMockProvider({ speed: 200 });
  const provider = {
    ...base,
    async *stream(args) {
      if (/You are the Muse node/.test(args.system)) throw new Error('boom');
      yield* base.stream(args);
    },
  };
  const events = [];
  await runSwarm({ nodes: t.nodes, edges: t.edges, mission: t.mission, provider, emit: (type, payload) => events.push({ type, payload }) });
  assert.ok(events.some((e) => e.type === 'node_error' && e.payload.id === 'muse-1'));
  assert.ok(events.some((e) => e.type === 'node_skip' && e.payload.id === 'synth-1'));
  assert.ok(events.some((e) => e.type === 'node_done' && e.payload.id === 'sentinel-1'));
});

test('abort stops the run', async () => {
  const t = TEMPLATES[0];
  const controller = new AbortController();
  const events = [];
  const p = runSwarm({
    nodes: t.nodes, edges: t.edges, mission: t.mission,
    provider: createMockProvider({ speed: 5 }),
    emit: (type, payload) => { events.push({ type, payload }); if (type === 'node_delta') controller.abort(); },
    abortSignal: controller.signal,
  });
  await p;
  assert.equal(events.at(-1).type, 'run_done');
  assert.equal(events.at(-1).payload.aborted, true);
  assert.ok(!events.some((e) => e.type === 'node_done'));
});
