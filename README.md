# SwarmFrame · Logos Engine v2

A visual multi-agent prompt swarm. You wire specialized agents on a canvas (Cortex plans, Looper generates variants, Muse adds narrative, Sentinel evaluates, Critic stress-tests, Synth assembles). They stream their work live, and three cognitive layers govern the run:

| Layer | What it does |
|---|---|
| **Blueprint** | Turns each node's persona DNA and anatomy sliders (logic, creativity, empathy, precision) into its system prompt |
| **CODEX** | Checks every output against an 8-layer constitution and runs a revision pass when it fails |
| **PROMETHEAN-UPE** | Scores Sentinel and Synth outputs on 5 weighted dimensions and auto-refines anything below 72 |

## Quick start

```bash
npm install
cp .env.example .env      # add ANTHROPIC_API_KEY (or GEMINI_API_KEY)
npm run dev               # http://localhost:5173
```

Without a key the app runs in **demo mode**, with a scripted provider streaming through the same engine, so you can preview everything.

Production: `npm run build && npm start` (http://localhost:8787).

## Architecture

```
browser (React + React Flow + Zustand)
   │  POST /api/swarm/run  ── Server-Sent Events ──▶  live node_delta / codex / upe events
   ▼
server/api.js  ── shared/engine.js (DAG scheduler, layers, refinement loop)
                     └─ provider: Claude (@anthropic-ai/sdk) │ Gemini (REST) │ mock
```

- **Keys stay on the server.** v1 bundled `REACT_APP_*` keys into the browser JS.
- **Scheduling comes from the edges.** A node starts once all its parents finish, and independent branches run in parallel. A failed node skips only the nodes downstream of it.
- **The engine is isomorphic.** If no backend is reachable (static hosting, file preview), the browser runs `shared/engine.js` against the demo provider.
- **Models:** the heavy tier (`claude-opus-5`) runs Cortex, Sentinel, Synth and Critic. The fast tier (`claude-sonnet-5`) runs Muse, Looper and the CODEX/UPE judges. Adaptive thinking is on, and its reasoning summaries stream into the inspector. You can override the tiers per node or via `.env`.

## Prompt templating

- `{{signal.goal}}`, `{{signal.tone}}`, `{{signal.constraints}}`, `{{signal.targetOutput}}`
- `{{cortex}}` inserts the upstream output by node type. `{{cortex-1}}` inserts it by node id.
- Any upstream output your prompt doesn't reference is appended under "Upstream inputs", so a new edge always delivers its data.

## Scripts

| | |
|---|---|
| `npm run dev` | Vite dev server + API in one process |
| `npm run build` | Static build to `dist/` (relative paths, so it works on any host) |
| `npm start` | Serve `dist/` + API |
| `npm test` | Engine tests plus a Claude API contract test (no key needed) |

## Why v1 never reached the LLM

1. `{{signal.goal}}`-style placeholders were never filled in, because the interpolator only matched top-level keys.
2. Gemini 2.5 Pro's thinking tokens used up the whole 2048-token output budget. The response came back empty, and that threw an error on the very first (Cortex) node, which aborted the entire run.
3. The API key was read at build time. The committed `build/` had no key baked in, so it always showed "No API Key".
4. A Supermemory hit could *replace* a node's prompt entirely, and one failing node killed the whole run.

See `docs/SWARMFRAME.md` for the original concept spec.
