/**
 * NodeShell — shared dark glass card for all Logos Engine nodes.
 * Each node passes its color/config; this handles layout + states.
 */
import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { useSwarmStore } from '../../../stores/swarmStore';

const GEMINI_MODELS = [
  { value: 'default',          label: 'Default' },
  { value: 'gemini-2.5-flash', label: '2.5 Flash' },
  { value: 'gemini-2.5-pro',   label: '2.5 Pro' },
];

export default function NodeShell({ id, data, config }) {
  const { color, glow, icon, label, sublabel } = config;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(data.prompt || '');
  const { updateNodeData } = useSwarmStore();

  const status = data.isExecuting ? 'executing' : data.hasResult ? 'complete' : 'idle';

  const cardStyle = {
    background: 'rgba(10, 17, 32, 0.97)',
    border: `1px solid ${status === 'executing' ? color : status === 'complete' ? 'rgba(16,185,129,0.3)' : '#162038'}`,
    borderRadius: 12,
    width: 268,
    overflow: 'hidden',
    transition: 'box-shadow 0.35s ease, border-color 0.35s ease',
    boxShadow: status === 'executing'
      ? `0 0 0 1px ${color}55, 0 0 28px ${glow}`
      : status === 'complete'
      ? '0 0 18px rgba(16,185,129,0.12)'
      : '0 6px 30px rgba(0,0,0,0.5)',
  };

  const anatomy = data.anatomy || {};
  const anatTraits = Object.entries(anatomy);

  const savePrompt = () => { updateNodeData(id, { prompt: draft }); setEditing(false); };

  return (
    <div style={cardStyle}>
      {/* Accent bar */}
      <div style={{ height: 2.5, background: `linear-gradient(90deg, ${color}cc, ${color}22)` }} />

      {/* Header */}
      <div style={{ padding: '10px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>{status === 'executing' ? '⚡' : status === 'complete' ? icon : icon}</span>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f8', letterSpacing: '0.01em' }}>{label}</div>
            <div style={{ fontSize: '0.65rem', color: '#4a6080', marginTop: 1 }}>{sublabel}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {status === 'executing' && (
            <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${color}44`, borderTopColor: color }} className="spin" />
          )}
          {status === 'complete' && (
            <span style={{ fontSize: '0.65rem', color: '#34d399', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 4, padding: '1px 6px' }}>done</span>
          )}
        </div>
      </div>

      {/* Anatomy bars */}
      {anatTraits.length > 0 && (
        <div style={{ padding: '0 12px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 10px' }}>
          {anatTraits.map(([trait, val]) => (
            <div key={trait}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: '0.6rem', color: '#4a6080', textTransform: 'capitalize' }}>{trait}</span>
                <span style={{ fontSize: '0.6rem', color: '#8ea5c8' }}>{Math.round(val * 100)}</span>
              </div>
              <div className="anatomy-bar">
                <div className="anatomy-fill" style={{ width: `${val * 100}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: '#162038', margin: '0 12px' }} />

      {/* Prompt area */}
      <div style={{ padding: '8px 12px' }}>
        {editing ? (
          <div>
            <textarea
              className="node-textarea"
              rows={4}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button
                onClick={savePrompt}
                style={{ background: color, color: '#fff', border: 'none', borderRadius: 5, padding: '4px 12px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
              >Save</button>
              <button
                onClick={() => { setDraft(data.prompt); setEditing(false); }}
                style={{ background: '#162038', color: '#8ea5c8', border: '1px solid #1e3052', borderRadius: 5, padding: '4px 10px', fontSize: '0.72rem', cursor: 'pointer' }}
              >Cancel</button>
            </div>
          </div>
        ) : (
          <div className="prompt-preview" onClick={() => setEditing(true)}>
            {(data.prompt || '').length > 110 ? `${data.prompt.substring(0, 110)}…` : data.prompt}
          </div>
        )}
      </div>

      {/* Model selector */}
      <div style={{ padding: '0 12px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '0.62rem', color: '#4a6080', flexShrink: 0 }}>Model</span>
        <select
          value={data.config?.model || 'default'}
          onChange={e => updateNodeData(id, { config: { ...data.config, model: e.target.value } })}
          className="logos-input"
          style={{ flex: 1, padding: '3px 6px', fontSize: '0.68rem' }}
        >
          {GEMINI_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      {/* Result preview */}
      {data.hasResult && data.result?.result && (
        <>
          <div style={{ height: 1, background: '#162038', margin: '0 12px' }} />
          <div className="result-preview" style={{ margin: '8px 12px 10px' }}>
            {data.result.result.substring(0, 90)}…
          </div>
        </>
      )}

      {/* Handles */}
      <Handle type="target" position={Position.Top} style={{ background: color, border: `2px solid #04070f`, width: 10, height: 10 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: color, border: `2px solid #04070f`, width: 10, height: 10 }} />
    </div>
  );
}
