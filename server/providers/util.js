/**
 * Helpers for open models, which are less disciplined than frontier APIs:
 * reasoning models inline <think>…</think>, and "JSON mode" output often
 * arrives wrapped in prose or code fences.
 */

/** Splits a streamed text channel into thinking vs visible text across chunk boundaries. */
export function createThinkSplitter() {
  let inThink = false;
  let carry = '';
  return function split(chunk) {
    const out = [];
    let s = carry + chunk;
    carry = '';
    while (s) {
      const tag = inThink ? '</think>' : '<think>';
      const i = s.indexOf(tag);
      if (i === -1) {
        // Hold back a possible partial tag at the end.
        let keep = 0;
        for (let k = Math.min(tag.length - 1, s.length); k > 0; k--) {
          if (tag.startsWith(s.slice(-k))) { keep = k; break; }
        }
        const emit = s.slice(0, s.length - keep);
        carry = s.slice(s.length - keep);
        if (emit) out.push({ kind: inThink ? 'thinking' : 'text', text: emit });
        break;
      }
      if (i > 0) out.push({ kind: inThink ? 'thinking' : 'text', text: s.slice(0, i) });
      inThink = !inThink;
      s = s.slice(i + tag.length);
    }
    return out;
  };
}

export function parseLooseJson(text) {
  const cleaned = String(text).replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```(?:json)?/g, '').trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* fall through */ }
  }
  throw new Error('Model returned invalid JSON for an evaluation step.');
}

export function jsonInstruction(schema) {
  return `\n\nRespond with ONLY a JSON object (no prose, no code fences) matching this JSON Schema:\n${JSON.stringify(schema)}`;
}

/** Reads a fetch body as lines (NDJSON or SSE). */
export async function* readLines(body) {
  const decoder = new TextDecoder();
  let buf = '';
  for await (const bytes of body) {
    buf += decoder.decode(bytes, { stream: true });
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (line) yield line;
    }
  }
  if (buf.trim()) yield buf.trim();
}
