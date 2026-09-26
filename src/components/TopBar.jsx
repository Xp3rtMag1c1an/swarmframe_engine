import React, { useEffect, useRef } from 'react';
import { useStore } from '../store.js';

function useTicker(active) {
  const [, force] = React.useReducer((x) => x + 1, 0);
  useEffect(() => {
    if (!active) return undefined;
    const t = setInterval(force, 100);
    return () => clearInterval(t);
  }, [active]);
}

function ProviderPill({ backend }) {
  if (backend.mode === 'probing') return <span className="provider">connecting…</span>;
  const demo = backend.id === 'mock';
  const title = demo
    ? backend.mode === 'browser'
      ? 'No backend reachable — running the engine in your browser with the demo provider.'
      : 'Backend running without an API key — add ANTHROPIC_API_KEY (or GEMINI_API_KEY) to .env and restart.'
    : `heavy: ${backend.models.heavy} · fast: ${backend.models.fast}`;
  return (
    <span className={`provider ${demo ? 'is-demo' : 'is-live'}`} title={title}>
      <span className="dot" />
      {demo ? 'Demo mode' : backend.label}
      {!demo && <span className="provider-model">{backend.models.heavy}</span>}
    </span>
  );
}

export default function TopBar() {
  const backend = useStore((s) => s.backend);
  const run = useStore((s) => s.run);
  const nodes = useStore((s) => s.nodes);
  const nodeRuns = useStore((s) => s.nodeRuns);
  const { launch: start, stop, exportSwarm, importSwarm } = useStore.getState();
  const fileRef = useRef(null);
  const running = run.status === 'running';
  useTicker(running);

  const finished = Object.values(nodeRuns).filter((r) => ['done', 'error', 'skipped'].includes(r.status)).length;
  const progress = running || run.status !== 'idle' ? finished / Math.max(1, nodes.length) : 0;
  const elapsed = running ? Date.now() - run.startedAt : run.ms;

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); running ? stop() : start(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, start, stop]);

  const doExport = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(exportSwarm(), null, 2)], { type: 'application/json' }));
    Object.assign(document.createElement('a'), { href: url, download: 'swarmframe.json' }).click();
    URL.revokeObjectURL(url);
  };
  const doImport = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try { importSwarm(JSON.parse(await f.text())); } catch (err) { alert(err.message); }
    e.target.value = '';
  };

  return (
    <header className="topbar">
      <div className="brand">
        <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
          <defs><linearGradient id="bm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5b8cff" /><stop offset="1" stopColor="#b57bff" /></linearGradient></defs>
          <circle cx="16" cy="6" r="3.2" fill="url(#bm)" /><circle cx="6" cy="22" r="3.2" fill="url(#bm)" /><circle cx="26" cy="22" r="3.2" fill="url(#bm)" /><circle cx="16" cy="16" r="2.4" fill="#3fd0ff" />
          <path d="M16 6 L16 16 M6 22 L16 16 M26 22 L16 16 M6 22 L26 22 M16 6 L6 22 M16 6 L26 22" stroke="url(#bm)" strokeWidth="1.1" opacity=".6" fill="none" />
        </svg>
        <div>
          <div className="brand-name">SwarmFrame</div>
          <div className="brand-sub">Logos Engine · v2</div>
        </div>
      </div>

      <div className="topbar-center">
        <div className="progress" aria-hidden={!progress}>
          <div className={`progress-fill ${running ? 'is-running' : ''}`} style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="run-meta">
          {run.status === 'idle' ? `${nodes.length} nodes ready` : `${finished}/${nodes.length} nodes · ${elapsed != null ? (elapsed / 1000).toFixed(1) : '0.0'}s`}
          {run.status === 'error' && ' · error'}
          {run.status === 'stopped' && ' · stopped'}
        </span>
      </div>

      <div className="topbar-right">
        <ProviderPill backend={backend} />
        <button className="btn ghost" onClick={() => fileRef.current?.click()} disabled={running}>Import</button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={doImport} />
        <button className="btn ghost" onClick={doExport}>Export</button>
        {running ? (
          <button className="btn stop" onClick={stop}><span className="sq" />Stop</button>
        ) : (
          <button className="btn run" onClick={start} disabled={backend.mode === 'probing'} title="⌘/Ctrl + Enter">
            <svg width="11" height="12" viewBox="0 0 11 12" fill="currentColor"><path d="M0 0L11 6L0 12V0Z" /></svg>
            Run swarm
          </button>
        )}
      </div>
    </header>
  );
}
