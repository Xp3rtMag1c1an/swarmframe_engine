/**
 * OpenAI-compatible Chat Completions provider — one adapter for the cheap and
 * free hosted open-model APIs (Groq, OpenRouter, Together, LM Studio, vLLM…).
 */

import { createThinkSplitter, jsonInstruction, parseLooseJson, readLines } from './util.js';

export const PRESETS = {
  groq: {
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    keyEnv: 'GROQ_API_KEY',
    heavy: 'llama-3.3-70b-versatile',
    fast: 'llama-3.1-8b-instant',
  },
  openrouter: {
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    keyEnv: 'OPENROUTER_API_KEY',
    heavy: 'meta-llama/llama-3.3-70b-instruct:free',
    fast: 'meta-llama/llama-3.3-70b-instruct:free',
  },
  openai: {
    label: 'OpenAI-compatible',
    baseUrl: 'http://localhost:1234/v1', // LM Studio's default
    keyEnv: 'OPENAI_API_KEY',
    heavy: 'local-model',
    fast: 'local-model',
  },
};

export function createOpenAICompatibleProvider(presetName, env = process.env) {
  const preset = PRESETS[presetName];
  const P = presetName.toUpperCase();
  const baseUrl = (env[`${P}_BASE_URL`] || preset.baseUrl).replace(/\/$/, '');
  const key = env[preset.keyEnv];
  const models = {
    heavy: env[`${P}_MODEL_HEAVY`] || env[`${P}_MODEL`] || preset.heavy,
    fast: env[`${P}_MODEL_FAST`] || env[`${P}_MODEL`] || preset.fast,
  };
  const modelFor = (tier) => models[tier] || tier;

  async function complete(body, abortSignal) {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(key ? { Authorization: `Bearer ${key}` } : {}),
        ...(presetName === 'openrouter' ? { 'X-Title': 'SwarmFrame' } : {}),
      },
      body: JSON.stringify(body),
      signal: abortSignal,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const e = new Error(`${preset.label} ${res.status}: ${err.error?.message || res.statusText}`);
      e.status = res.status;
      throw e;
    }
    return res;
  }

  const messages = (system, prompt) => [
    { role: 'system', content: system },
    { role: 'user', content: prompt },
  ];

  return {
    id: presetName,
    describe: () => ({ id: presetName, label: preset.label, models }),
    modelFor,

    async *stream({ system, prompt, tier, abortSignal }) {
      const res = await complete({ model: modelFor(tier), messages: messages(system, prompt), stream: true }, abortSignal);
      const split = createThinkSplitter();
      for await (const line of readLines(res.body)) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') break;
        const data = JSON.parse(payload);
        if (data.error) throw new Error(`${preset.label}: ${data.error.message || data.error}`);
        const delta = data.choices?.[0]?.delta || {};
        const reasoning = delta.reasoning || delta.reasoning_content;
        if (reasoning) yield { kind: 'thinking', text: reasoning };
        if (delta.content) yield* split(delta.content);
      }
    },

    async json({ system, prompt, schema, tier = 'fast', abortSignal }) {
      const base = { model: modelFor(tier), temperature: 0, stream: false };
      let res;
      try {
        res = await complete({
          ...base,
          messages: messages(system, prompt),
          response_format: { type: 'json_schema', json_schema: { name: 'evaluation', schema, strict: true } },
        }, abortSignal);
      } catch (err) {
        // Not every model supports json_schema — fall back to JSON mode + schema in the prompt.
        if (err.status !== 400 && err.status !== 422) throw err;
        res = await complete({
          ...base,
          messages: messages(system, prompt + jsonInstruction(schema)),
          response_format: { type: 'json_object' },
        }, abortSignal);
      }
      const data = await res.json();
      return parseLooseJson(data.choices?.[0]?.message?.content || '');
    },
  };
}
