/**
 * Contract test for the Claude provider against a local fake of the Messages
 * API: checks the request shape we send and that streamed thinking/text and
 * structured JSON come back through the provider interface.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

const requests = [];
let server;

function sse(res, events) {
  res.writeHead(200, { 'Content-Type': 'text/event-stream' });
  for (const [event, data] of events) res.write(`event: ${event}\ndata: ${JSON.stringify({ type: event, ...data })}\n\n`);
  res.end();
}

const message = (model, content = [], stop_reason = null) => ({
  id: 'msg_test', type: 'message', role: 'assistant', model, content, stop_reason, stop_sequence: null,
  usage: { input_tokens: 10, output_tokens: 5 },
});

before(async () => {
  server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      const json = JSON.parse(body);
      requests.push({ url: req.url, headers: req.headers, body: json });
      if (json.stream) {
        return sse(res, [
          ['message_start', { message: message(json.model) }],
          ['content_block_start', { index: 0, content_block: { type: 'thinking', thinking: '', signature: '' } }],
          ['content_block_delta', { index: 0, delta: { type: 'thinking_delta', thinking: 'Planning the answer.' } }],
          ['content_block_delta', { index: 0, delta: { type: 'signature_delta', signature: 'sig' } }],
          ['content_block_stop', { index: 0 }],
          ['content_block_start', { index: 1, content_block: { type: 'text', text: '' } }],
          ['content_block_delta', { index: 1, delta: { type: 'text_delta', text: 'Hello ' } }],
          ['content_block_delta', { index: 1, delta: { type: 'text_delta', text: 'swarm.' } }],
          ['content_block_stop', { index: 1 }],
          ['message_delta', { delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 7 } }],
          ['message_stop', {}],
        ]);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(message(json.model, [{ type: 'text', text: '{"layers":[],"directive":""}' }], 'end_turn')));
    });
  });
  await new Promise((r) => server.listen(0, r));
  process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${server.address().port}`;
  process.env.ANTHROPIC_API_KEY = 'test-key';
});

after(() => server.close());

test('stream: heavy tier uses claude-opus-5 with adaptive thinking, effort and refusal fallbacks', async () => {
  const { createAnthropicProvider } = await import('../server/providers/anthropic.js');
  const p = createAnthropicProvider({});
  const chunks = [];
  for await (const c of p.stream({ system: 'SYS', prompt: 'PROMPT', tier: 'heavy' })) chunks.push(c);

  assert.deepEqual(chunks, [
    { kind: 'thinking', text: 'Planning the answer.' },
    { kind: 'text', text: 'Hello ' },
    { kind: 'text', text: 'swarm.' },
  ]);
  const { body, headers, url } = requests.at(-1);
  assert.match(url, /^\/v1\/messages/);
  assert.equal(body.model, 'claude-opus-5');
  assert.equal(body.system, 'SYS');
  assert.deepEqual(body.messages, [{ role: 'user', content: 'PROMPT' }]);
  assert.deepEqual(body.thinking, { type: 'adaptive', display: 'summarized' });
  assert.equal(body.output_config.effort, 'high');
  assert.equal(body.fallbacks, 'default');
  assert.match(headers['anthropic-beta'], /server-side-fallback-2026-07-01/);
  assert.equal(body.temperature, undefined, 'no sampling params on current models');
});

test('stream: fast tier uses claude-sonnet-5 without the fallback beta', async () => {
  const { createAnthropicProvider } = await import('../server/providers/anthropic.js');
  const p = createAnthropicProvider({});
  for await (const _ of p.stream({ system: 'S', prompt: 'P', tier: 'fast' }));
  const { body, headers } = requests.at(-1);
  assert.equal(body.model, 'claude-sonnet-5');
  assert.equal(body.output_config.effort, 'medium');
  assert.equal(body.fallbacks, undefined);
  assert.doesNotMatch(headers['anthropic-beta'] || '', /server-side-fallback/);
});

test('json: structured output via output_config.format json_schema', async () => {
  const { createAnthropicProvider } = await import('../server/providers/anthropic.js');
  const { CODEX_SCHEMA } = await import('../shared/layers.js');
  const p = createAnthropicProvider({});
  const out = await p.json({ system: 'S', prompt: 'P', schema: CODEX_SCHEMA, tier: 'fast' });
  assert.deepEqual(out, { layers: [], directive: '' });
  const { body } = requests.at(-1);
  assert.equal(body.output_config.format.type, 'json_schema');
  assert.equal(body.output_config.effort, 'low');
  assert.ok(body.output_config.format.schema.properties.layers);
});
