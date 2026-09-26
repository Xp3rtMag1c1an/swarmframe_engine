import React, { useMemo, useState } from 'react';
import { useStore } from '../store.js';
import { NODE_ROLES, blueprintSystem } from '../../shared/layers.js';
import { renderMarkdown } from '../lib/markdown.js';

function Markdown({ text }) {
  const html = useMemo(() => renderMarkdown(text), [text]);
  return <div className="md" dangerouslySetInnerHTML={{ __html: html }} />;
}

function Bar({ value, color }) {
  return <div className="bar"><div className="bar-fill" style={{ width: `${Math.round(value * 100)}%`, background: color }} /></div>;
}

function CopyButtons({ text, name }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="row gap">
      <button className="btn ghost sm" onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>{copied ? 'Copied' : 'Copy'}</button>
      <button className="btn ghost sm" onClick={() => {
        const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }));
        Object.assign(document.createElement('a'), { href: url, download: `${name}.md` }).click();
        URL.revokeObjectURL(url);
      }}>.md</button>
    </div>
  );
}

function Scores({ r }) {
  if (!r?.codex && !r?.upe?.length) return null;
  const upe = r.upe?.at(-1);
  return (
    <div className="scores">
      {upe && (
        <div className="score-card">
          <div className="score-head">
            <span>PROMETHEAN-UPE</span>
            <b className={upe.shouldRefine ? 'warn' : 'ok'}>{Math.round(upe.composite * 100)}</b>
          </div>
          {r.upe.length > 1 && <div className="score-trend">{r.upe.map((u) => Math.round(u.composite * 100)).join(' → ')}</div>}
          {upe.dimensions.map((d) => (
            <div key={d.key} className="dim" title={`${d.feedback}\n\n→ ${d.improvement}`}>
              <span className="dim-name">{d.name}</span>
              <Bar value={d.score / 10} color="var(--upe)" />
              <span className="dim-val">{d.score.toFixed(1)}</span>
            </div>
          ))}
          {upe.assessment && <p className="assessment">{upe.assessment}</p>}
        </div>
      )}
      {r.codex && (
        <div className="score-card">
          <div className="score-head">
            <span>CODEX</span>
            <b className={r.codex.approved ? 'ok' : 'warn'}>{Math.round(r.codex.score * 100)}</b>
          </div>
          <ul className="codex">
            {r.codex.layers.map((l) => (
              <li key={l.key} className={l.passed ? 'ok' : 'warn'} title={l.reason}><span>{l.passed ? '✓' : '!'}</span>{l.name}</li>
            ))}
          </ul>
          {r.codex.directive && <p className="assessment">↻ {r.codex.directive}</p>}
        </div>
      )}
    </div>
  );
}

function NodeOutput({ r, name }) {
  const [showThinking, setShowThinking] = useState(false);
  if (!r || r.status === 'queued') return <p className="empty">Waiting for upstream nodes…</p>;
  if (r.status === 'error' || r.status === 'skipped') return <p className="empty err">{r.error}</p>;
  return (
    <>
      {r.thinking && (
        <details className="thinking" open={showThinking || (r.status === 'running' && !r.text)} onToggle={(e) => setShowThinking(e.target.open)}>
          <summary>Reasoning summary</summary>
          <div>{r.thinking}</div>
        </details>
      )}
      {r.text && (
        <div className="output-head">
          <span className="muted">{r.model} · pass {r.passes || r.pass || 1}{r.ms ? ` · ${(r.ms / 1000).toFixed(1)}s` : ''}</span>
          {r.status === 'done' && <CopyButtons text={r.text} name={name} />}
        </div>
      )}
      <Markdown text={r.text || ''} />
      {r.status === 'running' && <span className="caret" />}
      <Scores r={r} />
    </>
  );
}

function OutputTab() {
  const run = useStore((s) => s.run);
  const nodes = useStore((s) => s.nodes);
  const nodeRuns = useStore((s) => s.nodeRuns);

  if (run.status === 'idle') {
    return (
      <div className="welcome">
        <h2>Compose a swarm. Watch it think.</h2>
        <p>Each node is an agent with one cognitive role. Edges carry outputs downstream; independent branches run in parallel.</p>
        <ol>
          <li>Pick a template or edit the mission on the left.</li>
          <li>Click a node to edit its prompt, model tier and anatomy.</li>
          <li>Hit <b>Run swarm</b> (⌘/Ctrl + Enter).</li>
        </ol>
        <p className="muted">CODEX audits every output against 8 layers. UPE scores Sentinel and Synth nodes and triggers a rewrite when they fall below threshold.</p>
      </div>
    );
  }

  const focusId = run.final || nodes.map((n) => n.id).reverse().find((id) => nodeRuns[id]?.status === 'running')
    || nodes.find((n) => nodeRuns[n.id]?.status === 'running')?.id;
  const focus = nodes.find((n) => n.id === focusId);
  const role = focus ? NODE_ROLES[focus.type] : null;

  return (
    <div>
      <div className="focus-label" style={{ '--role': role?.color }}>
        {run.final ? 'Final output' : 'Streaming'} {role && <>· <span>{role.icon} {focus.data.label || role.label}</span></>}
      </div>
      {focus ? <NodeOutput r={nodeRuns[focus.id]} name={focus.id} /> : <p className="empty">{run.error || 'Starting…'}</p>}
      {run.status === 'error' && <p className="empty err">{run.error}</p>}
    </div>
  );
}

function NodeTab({ id }) {
  const node = useStore((s) => s.nodes.find((n) => n.id === id));
  const r = useStore((s) => s.nodeRuns[id]);
  const mission = useStore((s) => s.mission);
  const running = useStore((s) => s.run.status === 'running');
  const backend = useStore((s) => s.backend);
  const { updateNodeData, removeNode } = useStore.getState();
  const [view, setView] = useState('output');
  if (!node) return null;
  const role = NODE_ROLES[node.type];
  const anatomy = node.data.anatomy || {};

  return (
    <div>
      <div className="node-title" style={{ '--role': role.color }}>
        <span className="snode-icon">{role.icon}</span>
        <input className="title-input" value={node.data.label ?? role.label} onChange={(e) => updateNodeData(id, { label: e.target.value })} />
        <span className="muted">{node.id}</span>
      </div>
      <div className="seg">
        {['output', 'config', 'system'].map((v) => (
          <button key={v} className={view === v ? 'is-active' : ''} onClick={() => setView(v)}>{v}</button>
        ))}
      </div>

      {view === 'output' && (r ? <NodeOutput r={r} name={id} /> : <p className="empty">Run the swarm to see this node's output.</p>)}

      {view === 'config' && (
        <div className="config">
          <label className="field">
            <span className="field-label">Prompt</span>
            <textarea rows={9} value={node.data.prompt} onChange={(e) => updateNodeData(id, { prompt: e.target.value })} disabled={running} />
          </label>
          <label className="field">
            <span className="field-label">Model tier</span>
            <select value={node.data.config?.model || 'auto'} onChange={(e) => updateNodeData(id, { config: { ...node.data.config, model: e.target.value } })} disabled={running}>
              <option value="auto">Auto ({role.tier}{backend.models?.[role.tier] ? ` · ${backend.models[role.tier]}` : ''})</option>
              <option value="heavy">Heavy{backend.models?.heavy ? ` · ${backend.models.heavy}` : ''}</option>
              <option value="fast">Fast{backend.models?.fast ? ` · ${backend.models.fast}` : ''}</option>
            </select>
          </label>
          <label className="toggle compact" style={{ '--c': 'var(--upe)' }}>
            <input type="checkbox" checked={node.data.score ?? (node.type === 'sentinel' || node.type === 'synth')} onChange={(e) => updateNodeData(id, { score: e.target.checked })} disabled={running} />
            <span className="toggle-track"><span className="toggle-thumb" /></span>
            <span className="toggle-text"><b>UPE scoring</b><small>Score and auto-refine this node</small></span>
          </label>
          <div className="field-label" style={{ marginTop: 14 }}>Anatomy</div>
          {Object.entries(anatomy).map(([trait, v]) => (
            <label key={trait} className="slider">
              <span>{trait}</span>
              <input type="range" min="0" max="1" step="0.05" value={v} style={{ '--role': role.color }} disabled={running}
                onChange={(e) => updateNodeData(id, { anatomy: { ...anatomy, [trait]: Number(e.target.value) } })} />
              <b>{Math.round(v * 100)}</b>
            </label>
          ))}
          <button className="btn danger sm" onClick={() => removeNode(id)} disabled={running}>Delete node</button>
        </div>
      )}

      {view === 'system' && <pre className="system">{blueprintSystem(node.type, anatomy, mission)}</pre>}
    </div>
  );
}

export default function Inspector() {
  const inspector = useStore((s) => s.inspector);
  const selected = useStore((s) => s.selected);
  const { setInspector } = useStore.getState();
  return (
    <aside className="panel right">
      <div className="tabs">
        <button className={inspector === 'output' ? 'is-active' : ''} onClick={() => setInspector('output')}>Output</button>
        <button className={inspector === 'node' ? 'is-active' : ''} onClick={() => setInspector('node')} disabled={!selected}>Node</button>
      </div>
      <div className="panel-scroll">
        {inspector === 'node' && selected ? <NodeTab id={selected} key={selected} /> : <OutputTab />}
      </div>
    </aside>
  );
}
