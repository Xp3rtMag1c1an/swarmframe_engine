/**
 * Contract tests for the free/open providers against local fakes of the
 * Ollama native API and an OpenAI-compatible API (Groq/OpenRouter/LM Studio).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createOllamaProvider } from '../server/providers/ollama.js';
import { createOpenAICompatibleProvider } from '../server/providers/openaiCompatible.js';
import { selectProvider } from '../server/providers/index.js';
import { createThinkSplitter, parseLooseJson } from '../server/providers/util.js';
import { CODEX_SCHEMA } from '../shared/layers.js';
import { runSwarm } from '../shared/engine.js';
import { createMockProvider } from '../shared/providers/mock.js';
import { TEMPLATES } from '../shared/templates.js';

const requests = [];
let server;
let base;
let rejectJsonSchema = false;

before(async () => {
  server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      const body = raw ? JSON.parse(raw) : {};
      requests.push({ url: req.url, headers: req.headers, body });

      if (req.url === '/api/tags') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end('{"models":[]}'); }

      if (req.url === '/api/chat') {
        if (body.model === 'missing') { res.writeHead(404, { 'Content-Type': 'application/json' }); return res.end('{"error":"model \\"missing\\" not found"}'); }
        if (!body.stream) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ message: { content: '```json\n{"layers":[],"directive":""}\n```' }, done: true })); }
        res.writeHead(200, { 'Content-Type': 'application/x-ndjson' });
        for (const content of ['<thi', 'nk>weighing options</think>', 'Hello ', 'local swarm.']) res.write(`${JSON.stringify({ message: { role: 'assistant', content }, done: false })}\n`);
        return res.end(`${JSON.stringify({ message: { content: '' }, done: true })}\n`);
      }

      if (req.url === '/v1/chat/completions') {
        if (!body.stream) {
          if (body.response_format?.type === 'json_schema' && rejectJsonSchema) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end('{"error":{"message":"json_schema not supported"}}');
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ choices: [{ message: { content: 'Sure! {"layers":[],"directive":""}' } }] }));
        }
        res.writeHead(200, { 'Content-Type': 'text/event-stream' });
        for (const delta of [{ reasoning: 'thinking…' }, { content: 'Fast ' }, { content: 'and free.' }]) res.write(`data: ${JSON.stringify({ choices: [{ delta }] })}\n\n`);
        return res.end('data: [DONE]\n\n');
      }
      res.writeHead(404); res.end();
    });
  });
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const collect = async (it) => { const out = []; for await (const c of it) out.push(c); return out; };
const join = (chunks, kind) => chunks.filter((c) => c.kind === kind).map((c) => c.text).join('');

test('think splitter handles tags split across chunks', () => {
  const split = createThinkSplitter();
  const out = ['a<th', 'ink>x', 'y</thi', 'nk>b'].flatMap(split);
  assert.equal(join(out, 'text'), 'ab');
  assert.equal(join(out, 'thinking'), 'xy');
});

test('parseLooseJson tolerates fences and prose', () => {
  assert.deepEqual(parseLooseJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(parseLooseJson('Here you go: {"a":2} hope that helps'), { a: 2 });
  assert.throws(() => parseLooseJson('no json here'));
});

test('ollama: streams NDJSON, splits <think>, raises num_ctx', async () => {
  const p = createOllamaProvider({ OLLAMA_BASE_URL: base, OLLAMA_MODEL: 'llama3.1:8b' });
  const chunks = await collect(p.stream({ system: 'S', prompt: 'P', tier: 'heavy' }));
  assert.equal(join(chunks, 'text'), 'Hello local swarm.');
  assert.equal(join(chunks, 'thinking'), 'weighing options');
  const { body } = requests.at(-1);
  assert.equal(body.model, 'llama3.1:8b');
  assert.equal(body.options.num_ctx, 16384);
  assert.deepEqual(body.messages.map((m) => m.role), ['system', 'user']);
});

test('ollama: json passes the schema as `format`', async () => {
  const p = createOllamaProvider({ OLLAMA_BASE_URL: base });
  assert.deepEqual(await p.json({ system: 'S', prompt: 'P', schema: CODEX_SCHEMA }), { layers: [], directive: '' });
  assert.deepEqual(requests.at(-1).body.format, CODEX_SCHEMA);
});

test('ollama: missing model gives an actionable error', async () => {
  const p = createOllamaProvider({ OLLAMA_BASE_URL: base, OLLAMA_MODEL: 'missing' });
  await assert.rejects(collect(p.stream({ system: 'S', prompt: 'P', tier: 'fast' })), /ollama pull missing/);
});

test('openai-compatible (groq): streams SSE with reasoning and sends the bearer key', async () => {
  const p = createOpenAICompatibleProvider('groq', { GROQ_BASE_URL: `${base}/v1`, GROQ_API_KEY: 'gsk_test' });
  const chunks = await collect(p.stream({ system: 'S', prompt: 'P', tier: 'heavy' }));
  assert.equal(join(chunks, 'text'), 'Fast and free.');
  assert.equal(join(chunks, 'thinking'), 'thinking…');
  const { body, headers } = requests.at(-1);
  assert.equal(body.model, 'llama-3.3-70b-versatile');
  assert.equal(headers.authorization, 'Bearer gsk_test');
});

test('openai-compatible: falls back to json_object when json_schema is rejected', async () => {
  rejectJsonSchema = true;
  const p = createOpenAICompatibleProvider('groq', { GROQ_BASE_URL: `${base}/v1`, GROQ_API_KEY: 'k' });
  assert.deepEqual(await p.json({ system: 'S', prompt: 'P', schema: CODEX_SCHEMA }), { layers: [], directive: '' });
  assert.equal(requests.at(-1).body.response_format.type, 'json_object');
  assert.match(requests.at(-1).body.messages[1].content, /JSON Schema/);
  rejectJsonSchema = false;
});

test('auto-detect prefers a running Ollama, then free-tier keys, then demo', async () => {
  assert.equal((await selectProvider({ OLLAMA_BASE_URL: base, GROQ_API_KEY: 'k' })).id, 'ollama');
  const dead = 'http://127.0.0.1:9';
  assert.equal((await selectProvider({ OLLAMA_BASE_URL: dead, GROQ_API_KEY: 'k' })).id, 'groq');
  assert.equal((await selectProvider({ OLLAMA_BASE_URL: dead, OPENROUTER_API_KEY: 'k' })).id, 'openrouter');
  assert.equal((await selectProvider({ OLLAMA_BASE_URL: dead })).id, 'mock');
  assert.equal((await selectProvider({ LLM_PROVIDER: 'ollama' })).id, 'ollama');
});

test('a judge that returns garbage does not fail the node', async () => {
  const t = TEMPLATES[2];
  const mock = createMockProvider({ speed: 200 });
  const provider = { ...mock, json: async () => { throw new Error('invalid JSON'); } };
  const events = [];
  await runSwarm({ nodes: t.nodes, edges: t.edges, mission: t.mission, provider, emit: (type, payload) => events.push({ type, payload }) });
  assert.equal(events.filter((e) => e.type === 'node_done').length, t.nodes.length);
  assert.ok(events.some((e) => e.type === 'log' && /CODEX skipped/.test(e.payload.message)));
});
