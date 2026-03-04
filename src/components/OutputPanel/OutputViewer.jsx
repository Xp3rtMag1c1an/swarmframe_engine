import React, { useState } from 'react';
import { useSwarmStore } from '../../stores/swarmStore';

const NODE_META = {
  'cortex-1':   { label: 'Cortex',   color: '#3b82f6', icon: '🧠' },
  'looper-1':   { label: 'Looper',   color: '#10b981', icon: '🔄' },
  'muse-1':     { label: 'Muse',     color: '#8b5cf6', icon: '🎨' },
  'sentinel-1': { label: 'Sentinel', color: '#f59e0b', icon: '🛡️' },
  'synth-1':    { label: 'Synth',    color: '#06b6d4', icon: '🔗' },
};

const ORDER = ['synth-1', 'cortex-1', 'looper-1', 'muse-1', 'sentinel-1'];

export default function OutputViewer() {
  const { executionResults, nodes, upeScores } = useSwarmStore();
  const [expanded, setExpanded] = useState({ 'synth-1': true });

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const finalEntry = executionResults['synth-1'];
  const totalNodes = nodes.length;
  const doneNodes  = Object.keys(executionResults).length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#060a14', borderLeft: '1px solid #162038' }}>

      {/* Panel header */}
      <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid #162038', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#e2e8f8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Output</span>
          <span style={{ fontSize: '0.65rem', color: '#4a6080' }}>{doneNodes}/{totalNodes} nodes</span>
        </div>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
          {ORDER.slice(1).concat(['synth-1']).reverse().map(id => {
            const meta = NODE_META[id];
            const done = !!executionResults[id];
            return (
              <div key={id} title={meta?.label} style={{ flex: 1, height: 3, borderRadius: 2, background: done ? meta?.color : '#162038', transition: 'background 0.4s', boxShadow: done ? `0 0 6px ${meta?.color}66` : 'none' }} />
            );
          })}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {doneNodes === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚛</div>
            <div style={{ fontSize: '0.78rem', color: '#4a6080', lineHeight: 1.6 }}>
              Run the swarm to generate output.<br/>
              All five cognitive nodes will collaborate<br/>through Gemini 2.5.
            </div>
          </div>
        )}

        {ORDER.map(nodeId => {
          const entry = executionResults[nodeId];
          if (!entry) return null;
          const meta  = NODE_META[nodeId] || { label: nodeId, color: '#4a6080', icon: '◈' };
          const isOpen = expanded[nodeId] !== false;
          const upe   = upeScores[nodeId];
          const isFinal = nodeId === 'synth-1';

          return (
            <div
              key={nodeId}
              style={{
                background: isFinal ? 'rgba(6,182,212,0.05)' : 'rgba(12,21,38,0.6)',
                border: `1px solid ${isFinal ? 'rgba(6,182,212,0.25)' : '#162038'}`,
                borderRadius: 10,
                overflow: 'hidden',
                boxShadow: isFinal ? '0 0 20px rgba(6,182,212,0.08)' : 'none',
              }}
            >
              {/* Node header row */}
              <button
                onClick={() => toggle(nodeId)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: 3, height: 28, borderRadius: 2, background: meta.color, flexShrink: 0, boxShadow: `0 0 8px ${meta.color}66` }} />
                <span style={{ fontSize: 15 }}>{meta.icon}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e2e8f8', flex: 1 }}>
                  {meta.label}{isFinal && <span style={{ marginLeft: 6, fontSize: '0.6rem', color: meta.color, background: `${meta.color}15`, border: `1px solid ${meta.color}40`, borderRadius: 4, padding: '1px 6px' }}>FINAL</span>}
                </span>
                {entry.timing?.duration && (
                  <span style={{ fontSize: '0.62rem', color: '#4a6080', fontFamily: 'monospace' }}>{entry.timing.duration}ms</span>
                )}
                {upe && (
                  <span style={{ fontSize: '0.62rem', fontWeight: 600, color: upe.compositeScore >= 0.8 ? '#34d399' : upe.compositeScore >= 0.68 ? '#fbbf24' : '#f87171', marginLeft: 4 }}>
                    {Math.round(upe.compositeScore * 100)}%
                  </span>
                )}
                <span style={{ color: '#4a6080', fontSize: '0.7rem', marginLeft: 2 }}>{isOpen ? '−' : '+'}</span>
              </button>

              {/* Content */}
              {isOpen && (
                <div style={{ padding: '0 12px 12px' }}>
                  <div style={{ fontSize: '0.7rem', lineHeight: 1.7, color: '#8ea5c8', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                    {entry.result}
                  </div>
                  {/* CODEX badge */}
                  {entry.codex && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.62rem' }}>
                      <span style={{ color: entry.codex.approved ? '#34d399' : '#fbbf24' }}>
                        {entry.codex.approved ? '✓ CODEX passed' : `⚠ CODEX ${Math.round(entry.codex.codexScore * 100)}%`}
                      </span>
                      {entry.codex.violations?.length > 0 && (
                        <span style={{ color: '#4a6080' }}>· {entry.codex.violations.join(', ')}</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
