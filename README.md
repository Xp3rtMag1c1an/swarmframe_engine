# SwarmFrame · Logos Engine v2

A visual multi-agent prompt swarm. You wire specialized agents on a canvas (Cortex plans, Looper generates variants, Muse adds narrative, Sentinel evaluates, Critic stress-tests, Synth assembles). They stream their work live, and three cognitive layers govern the run:

| Layer | What it does |
|---|---|
| **Blueprint** | Turns each node's persona DNA and anatomy sliders (logic, creativity, empathy, precision) into its system prompt |
| **CODEX** | Checks every output against an 8-layer constitution and runs a revision pass when it fails |
| **PROMETHEAN-UPE** | Scores Sentinel and Synth outputs on 5 weighted dimensions and auto-refines anything below 72 |

## Quick start (free, local)

```bash
# 1. Ollama: https://ollama.com/download
ollama pull llama3.1:8b
ollama serve                # usually already running after install

# 2. SwarmFrame
npm install
npm run dev                 # http://localhost:5173
```

A running Ollama is detected automatically, and the top-right pill turns green and says **Ollama**. Nothing to configure.

With no model available, the app runs in **demo mode**: a scripted provider streams through the same engine, so you can still preview everything.

Production: `npm run build && npm start` (http://localhost:8787).

## Model providers

Auto-detected in this order (or force one with `LLM_PROVIDER` in `.env`; see `.env.example`):

| Provider | Cost | Setup | Default models (heavy / fast) |
|---|---|---|---|
| **Ollama** | Free, local | `ollama serve` | `llama3.1:8b` / `llama3.1:8b` |
| **Groq** | Free tier | `GROQ_API_KEY` | `llama-3.3-70b-versatile` / `llama-3.1-8b-instant` |
| **OpenRouter** | `:free` models | `OPENROUTER_API_KEY` | `meta-llama/llama-3.3-70b-instruct:free` |
| **OpenAI-compatible** (LM Studio, vLLM…) | Free, local | `LLM_PROVIDER=openai` + `OPENAI_BASE_URL` | whatever you serve |
| Gemini | Free tier | `GEMINI_API_KEY` | `gemini-2.5-pro` / `gemini-2.5-flash` |
| Claude | Paid | `ANTHROPIC_API_KEY` | `claude-opus-5` / `claude-sonnet-5` |

The **heavy** tier runs Cortex, Sentinel, Synth and Critic. The **fast** tier runs Muse, Looper and the CODEX/UPE judges. You can override either per node (Inspector → Config) or with `*_MODEL_HEAVY` / `*_MODEL_FAST`.

Tips for local models:

- **Context size.** SwarmFrame raises Ollama's context to 16k (`OLLAMA_NUM_CTX`). The default is small and silently truncates upstream inputs.
- **Reasoning models.** `qwen3`, `deepseek-r1` and similar just work. Their `<think>` output streams into the inspector's reasoning panel instead of the deliverable.
- **Speed.** A run makes about 12 model calls. On a laptop, turn off CODEX in the left panel for quick iterations, or put a small model on the fast tier.
- **Judges fail soft.** If a small model returns malformed JSON for a CODEX/UPE check, that check is skipped and logged. The node's output is kept.

## Architecture

```
browser (React + React Flow + Zustand)
   │  POST /api/swarm/run  ── Server-Sent Events ──▶  live node_delta / codex / upe events
   ▼
server/api.js  ── shared/engine.js (DAG scheduler, layers, refinement loop)
                     └─ provider: Ollama │ OpenAI-compatible │ Gemini │ Claude │ mock
```

- **Keys stay on the server.** v1 bundled `REACT_APP_*` keys into the browser JS.
- **Scheduling comes from the edges.** A node starts once all its parents finish, and independent branches run in parallel. A failed node skips only the nodes downstream of it.
- **The engine is isomorphic.** If no backend is reachable (static hosting, file preview), the browser runs `shared/engine.js` against the demo provider.

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
| `npm test` | Engine tests plus contract tests against fake Ollama / OpenAI-compatible / Claude servers (no keys or models needed) |

## Why v1 never reached the LLM

1. `{{signal.goal}}`-style placeholders were never filled in, because the interpolator only matched top-level keys.
2. Gemini 2.5 Pro's thinking tokens used up the whole 2048-token output budget. The response came back empty, and that threw an error on the very first (Cortex) node, which aborted the entire run.
3. The API key was read at build time. The committed `build/` had no key baked in, so it always showed "No API Key".
4. A Supermemory hit could *replace* a node's prompt entirely, and one failing node killed the whole run.

See `docs/SWARMFRAME.md` for the original concept spec.
