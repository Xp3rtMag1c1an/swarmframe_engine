/**
 * Prompt templating.
 *
 * Supports dot paths ({{signal.goal}}), upstream outputs by node type ({{muse}})
 * or by node id ({{muse-1}}). Any upstream output the template does not
 * reference is appended automatically, so wiring a new edge on the canvas
 * always delivers data — the old engine silently dropped it.
 */

const TOKEN = /\{\{\s*([\w.-]+)\s*\}\}/g;

function lookup(ctx, path) {
  if (Object.prototype.hasOwnProperty.call(ctx, path)) return ctx[path];
  return path.split('.').reduce((acc, k) => (acc == null ? undefined : acc[k]), ctx);
}

function stringify(v) {
  if (v == null) return '';
  return typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v);
}

/**
 * @param {string} template
 * @param {{signal: object, upstream: Array<{id: string, type: string, label: string, output: string}>}} input
 */
export function renderPrompt(template, { signal, upstream }) {
  const ctx = { signal };
  for (const u of upstream) {
    ctx[u.id] = u.output;
    // If two upstream nodes share a type, {{type}} joins them.
    ctx[u.type] = ctx[u.type] ? `${ctx[u.type]}\n\n---\n\n${u.output}` : u.output;
  }

  const used = new Set();
  const body = template.replace(TOKEN, (m, path) => {
    const v = lookup(ctx, path);
    if (v === undefined) return m;
    used.add(path.split('.')[0]);
    return stringify(v);
  });

  const unreferenced = upstream.filter((u) => !used.has(u.id) && !used.has(u.type));
  if (!unreferenced.length) return body;

  const appendix = unreferenced
    .map((u) => `### From ${u.label}\n${u.output}`)
    .join('\n\n');
  return `${body}\n\n## Upstream inputs\n${appendix}`;
}

export function unresolvedTokens(template, knownKeys) {
  const out = [];
  for (const [, path] of template.matchAll(TOKEN)) {
    const root = path.split('.')[0];
    if (!knownKeys.includes(root)) out.push(path);
  }
  return out;
}
