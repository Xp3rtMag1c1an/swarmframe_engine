/**
 * Gemini provider (REST). Kept so existing Gemini keys keep working.
 *
 * Two fixes over the original browser client: the key stays on the server,
 * and the output budget is large enough that 2.5 Pro's thinking tokens no
 * longer consume it entirely (which returned empty text and killed the run).
 */

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export function createGeminiProvider(env = process.env) {
  const key = env.GEMINI_API_KEY;
  const models = {
    heavy: env.GEMINI_MODEL_HEAVY || 'gemini-2.5-pro',
    fast: env.GEMINI_MODEL_FAST || 'gemini-2.5-flash',
  };
  const modelFor = (tier) => models[tier] || tier;

  async function call(model, method, body, abortSignal) {
    const res = await fetch(`${BASE}/${model}:${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
      signal: abortSignal,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Gemini ${res.status}: ${err?.error?.message || res.statusText}`);
    }
    return res;
  }

  return {
    id: 'gemini',
    describe: () => ({ id: 'gemini', label: 'Gemini', models }),
    modelFor,

    async *stream({ system, prompt, tier, abortSignal }) {
      const res = await call(modelFor(tier), 'streamGenerateContent?alt=sse', {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 32768, thinkingConfig: { includeThoughts: true } },
      }, abortSignal);

      const decoder = new TextDecoder();
      let buf = '';
      let finish;
      for await (const bytes of res.body) {
        buf += decoder.decode(bytes, { stream: true });
        let i;
        while ((i = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, i).trim();
          buf = buf.slice(i + 1);
          if (!line.startsWith('data:')) continue;
          const data = JSON.parse(line.slice(5));
          const cand = data.candidates?.[0];
          finish = cand?.finishReason || finish;
          for (const part of cand?.content?.parts || []) {
            if (part.text) yield { kind: part.thought ? 'thinking' : 'text', text: part.text };
          }
        }
      }
      if (finish && !['STOP', 'MAX_TOKENS'].includes(finish)) throw new Error(`Gemini stopped early: ${finish}`);
    },

    async json({ system, prompt, schema, tier = 'fast', abortSignal }) {
      const res = await call(modelFor(tier), 'generateContent', {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 16384, responseMimeType: 'application/json', responseJsonSchema: schema },
      }, abortSignal);
      const data = await res.json();
      const text = (data.candidates?.[0]?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text).join('');
      try {
        return JSON.parse(text);
      } catch {
        throw new Error('Gemini returned invalid JSON for an evaluation step.');
      }
    },
  };
}
