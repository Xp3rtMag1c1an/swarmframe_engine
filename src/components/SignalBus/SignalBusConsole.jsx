import React, { useState, useRef, useEffect } from 'react';
import { useSwarmStore } from '../../stores/swarmStore';

const LOG_STYLE = {
  start:          { color: '#818cf8', prefix: '◈' },
  stage:          { color: '#8ea5c8', prefix: '▸' },
  blueprint:      { color: '#60a5fa', prefix: '🧬' },
  codex:          { color: '#fbbf24', prefix: '📜' },
  codex_pass:     { color: '#34d399', prefix: '✓' },
  codex_violation:{ color: '#fbbf24', prefix: '⚠' },
  upe:            { color: '#c084fc', prefix: '◉' },
  upe_score:      { color: '#a78bfa', prefix: '◈' },
  node_complete:  { color: '#6ee7b7', prefix: '●' },
  complete:       { color: '#818cf8', prefix: '◈' },
  error:          { color: '#f87171', prefix: '✕' },
};

export default function SignalBusConsole() {
  const { globalSignal, updateGlobalSignal, executionLog, codexViolations, upeScores, isExecuting } = useSwarmStore();
  const [tab, setTab] = useState('log');
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [executionLog]);

  const upeEntries = Object.entries(upeScores);
  const latestUPE  = upeEntries[upeEntries.length - 1]?.[1];

  return (
    <div style={{ background: 'rgba(6, 10, 20, 0.98)', borderTop: '1px solid #162038', flexShrink: 0 }}>

      {/* Top control row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 16px', borderBottom: '1px solid #0d1a2e' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          {/* Goal */}
          <span style={{ fontSize: '0.65rem', color: '#4a6080', textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0 }}>Goal</span>
          <input
            type="text"
            value={globalSignal.goal}
            onChange={e => updateGlobalSignal({ goal: e.target.value })}
            className="logos-input"
            style={{ width: 280 }}
            placeholder="Define objective..."
          />

          {/* Tone */}
          <span style={{ fontSize: '0.65rem', color: '#4a6080', textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0 }}>Tone</span>
          <select
            value={globalSignal.tone}
            onChange={e => updateGlobalSignal({ tone: e.target.value })}
            className="logos-input"
            style={{ width: 120 }}
          >
            {['Visionary', 'Analytical', 'Creative', 'Pragmatic', 'Prophetic'].map(t => <option key={t}>{t}</option>)}
          </select>

          {/* Creativity */}
          <span style={{ fontSize: '0.65rem', color: '#4a6080', textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0 }}>Creativity</span>
          <input
            type="range" min="0" max="1" step="0.1"
            value={globalSignal.creativity}
            onChange={e => updateGlobalSignal({ creativity: parseFloat(e.target.value) })}
            style={{ width: 72, accentColor: '#3b82f6' }}
          />
          <span style={{ fontSize: '0.68rem', color: '#8ea5c8', width: 24, textAlign: 'right' }}>{globalSignal.creativity}</span>
        </div>

        {/* Goal progress */}
        {isExecuting && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 60, height: 2, background: '#162038', borderRadius: 1 }}>
              <div style={{ height: '100%', width: `${(globalSignal.goalProgress || 0) * 100}%`, background: 'linear-gradient(90deg, #2563eb, #06b6d4)', borderRadius: 1, transition: 'width 0.4s ease' }} />
            </div>
            <span style={{ fontSize: '0.65rem', color: '#8ea5c8' }}>{Math.round((globalSignal.goalProgress || 0) * 100)}%</span>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#0c1526', padding: '3px 4px', borderRadius: 7, border: '1px solid #162038' }}>
          {[
            { id: 'log',  label: 'Log' },
            { id: 'codex', label: `CODEX${codexViolations.length ? ` ·${codexViolations.length}` : ''}` },
            { id: 'upe',  label: `UPE${upeEntries.length ? ` ·${upeEntries.length}` : ''}` },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`tab-btn ${tab === t.id ? 'active' : ''}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div style={{ height: 88, overflow: 'hidden' }}>

        {/* EXECUTION LOG */}
        {tab === 'log' && (
          <div ref={logRef} style={{ height: '100%', overflowY: 'auto', padding: '6px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {executionLog.length === 0 ? (
              <span style={{ fontSize: '0.7rem', color: '#4a6080', fontStyle: 'italic', padding: '8px 0' }}>
                Awaiting execution — hit Run Swarm to initialize the Logos Engine
              </span>
            ) : (
              executionLog.slice(-20).map((log, i) => {
                const s = LOG_STYLE[log.type] || LOG_STYLE.stage;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: '0.68rem', lineHeight: 1.5 }}>
                    <span style={{ color: '#2a3f5f', fontFamily: 'monospace', flexShrink: 0 }}>
                      {new Date(log.timestamp).toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span style={{ color: s.color, flexShrink: 0, width: 14, textAlign: 'center' }}>{s.prefix}</span>
                    <span style={{ color: s.color }}>{log.message}</span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* CODEX */}
        {tab === 'codex' && (
          <div style={{ height: '100%', overflowY: 'auto', padding: '6px 16px' }}>
            {codexViolations.length === 0 ? (
              <div style={{ fontSize: '0.7rem', color: '#34d399', padding: '8px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>✓</span> All outputs passed CODEX verification
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {codexViolations.map((v, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.68rem', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, padding: '5px 10px' }}>
                    <span style={{ color: '#fbbf24' }}>⚠</span>
                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>{v.nodeType}</span>
                    <span style={{ color: '#8ea5c8' }}>score: {Math.round(v.score * 100)}%</span>
                    <span style={{ color: '#4a6080' }}>violations: </span>
                    <span style={{ color: '#fcd34d' }}>{v.violations.join(', ')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* UPE SCORES */}
        {tab === 'upe' && (
          <div style={{ height: '100%', overflowY: 'auto', padding: '6px 16px' }}>
            {upeEntries.length === 0 ? (
              <span style={{ fontSize: '0.7rem', color: '#4a6080', fontStyle: 'italic', padding: '8px 0', display: 'block' }}>
                UPE scores appear after Sentinel and Synth run
              </span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upeEntries.map(([nodeId, upe]) => {
                  const pct = Math.round(upe.compositeScore * 100);
                  const statusColor = pct >= 80 ? '#34d399' : pct >= 68 ? '#fbbf24' : '#f87171';
                  return (
                    <div key={nodeId} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.68rem' }}>
                      <span style={{ color: '#8ea5c8', width: 64, flexShrink: 0, fontFamily: 'monospace' }}>{nodeId}</span>
                      <span style={{ color: statusColor, fontWeight: 700, width: 36, textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
                      <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                        {upe.dimensionBreakdown?.map(dim => {
                          const dc = dim.normalized >= 0.8 ? '#34d399' : dim.normalized >= 0.6 ? '#fbbf24' : '#f87171';
                          return (
                            <div key={dim.dimension} style={{ flex: 1, textAlign: 'center' }}>
                              <div style={{ fontSize: '0.58rem', color: '#4a6080', marginBottom: 2 }}>{dim.dimension.slice(0,3).toUpperCase()}</div>
                              <div style={{ height: 3, background: '#162038', borderRadius: 2 }}>
                                <div style={{ height: '100%', width: `${dim.normalized * 100}%`, background: dc, borderRadius: 2 }} />
                              </div>
                              <div style={{ fontSize: '0.6rem', color: dc, marginTop: 1 }}>{dim.score}</div>
                            </div>
                          );
                        })}
                      </div>
                      <span style={{ fontSize: '0.62rem', color: upe.shouldIterate ? '#fbbf24' : '#34d399', flexShrink: 0 }}>
                        {upe.shouldIterate ? '↻ iterate' : '✓ pass'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
