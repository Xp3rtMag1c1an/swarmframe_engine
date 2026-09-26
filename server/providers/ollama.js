/**
 * Ollama provider — free, local, open models.
 *
 * Uses the native /api/chat endpoint rather than the OpenAI-compatible one,
 * because only the native API lets us raise num_ctx (Ollama's small default
 * context silently truncates long upstream inputs) and pass a JSON schema as
 * `format` for CODEX/UPE structured output.
 */

import { createThinkSplitter, parseLooseJson, readLines } from './util.js';

export const OLLAMA_DEFAULT_URL = 'http://localhost:11434';

export async function ollamaReachable(baseUrl = OLLAMA_DEFAULT_URL, timeoutMs = 800) {
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(timeoutMs) });
    return res.ok;
  } catch {
    return false;
  }
}

export function createOllamaProvider(env = process.env) {
  const baseUrl = (env.OLLAMA_BASE_URL || OLLAMA_DEFAULT_URL).replace(/\/$/, '');
  const fallback = env.OLLAMA_MODEL || 'llama3.1:8b';
  const models = {
    heavy: env.OLLAMA_MODEL_HEAVY || fallback,
    fast: env.OLLAMA_MODEL_FAST || fallback,
  };
  const numCtx = Number(env.OLLAMA_NUM_CTX) || 16384;
  const modelFor = (tier) => models[tier] || tier;

  async function chat(body, abortSignal) {
    let res;
    try {
      res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, options: { num_ctx: numCtx, ...body.options } }),
        signal: abortSignal,
      });
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      throw new Error(`Can't reach Ollama at ${baseUrl} — is \`ollama serve\` running?`);
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.error || res.statusText;
      if (res.status === 404) throw new Error(`Ollama: ${msg}. Run \`ollama pull ${body.model}\`.`);
      throw new Error(`Ollama ${res.status}: ${msg}`);
    }
    return res;
  }

  const messages = (system, prompt) => [
    { role: 'system', content: system },
    { role: 'user', content: prompt },
  ];

  return {
    id: 'ollama',
    describe: () => ({ id: 'ollama', label: 'Ollama', models }),
    modelFor,

    async *stream({ system, prompt, tier, abortSignal }) {
      const res = await chat({ model: modelFor(tier), messages: messages(system, prompt), stream: true }, abortSignal);
      const split = createThinkSplitter();
      for await (const line of readLines(res.body)) {
        const data = JSON.parse(line);
        if (data.error) throw new Error(`Ollama: ${data.error}`);
        if (data.message?.thinking) yield { kind: 'thinking', text: data.message.thinking };
        if (data.message?.content) yield* split(data.message.content);
        if (data.done) break;
      }
    },

    async json({ system, prompt, schema, tier = 'fast', abortSignal }) {
      const res = await chat({
        model: modelFor(tier),
        messages: messages(system, prompt),
        stream: false,
        format: schema,
        options: { temperature: 0 },
      }, abortSignal);
      const data = await res.json();
      return parseLooseJson(data.message?.content || '');
    },
  };
}
