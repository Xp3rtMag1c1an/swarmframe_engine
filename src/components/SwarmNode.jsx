import React, { memo, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '../store.js';
import { NODE_ROLES } from '../../shared/layers.js';

const STATUS_LABEL = { queued: 'queued', running: 'live', done: 'done', error: 'failed', skipped: 'skipped' };

function Pill({ tone, children, title }) {
  return <span className={`pill pill-${tone}`} title={title}>{children}</span>;
}

function SwarmNode({ id, type, data, selected }) {
  const role = NODE_ROLES[type] || NODE_ROLES.cortex;
  const r = useStore((s) => s.nodeRuns[id]);
  const status = r?.status || 'idle';
  const tailRef = useRef(null);

  useEffect(() => {
    if (tailRef.current) tailRef.current.scrollTop = tailRef.current.scrollHeight;
  }, [r?.text, r?.thinking]);

  const upe = r?.upe?.at(-1);
  const showStream = status === 'running' || status === 'done';
  const thinkingOnly = status === 'running' && !r?.text && r?.thinking;

  return (
    <div className={`snode status-${status} ${selected ? 'is-selected' : ''}`} style={{ '--role': role.color }}>
      <div className="snode-ring" />
      <div className="snode-inner">
        <header className="snode-head">
          <span className="snode-icon">{role.icon}</span>
          <div className="snode-titles">
            <div className="snode-label">{data.label || role.label}</div>
            <div className="snode-sub">{role.title}</div>
          </div>
          {status !== 'idle' && <span className={`snode-status st-${status}`}>{STATUS_LABEL[status]}</span>}
        </header>

        <div className="snode-body" ref={tailRef}>
          {showStream ? (
            thinkingOnly ? <div className="snode-thinking">{r.thinking.slice(-360)}</div>
              : <div className="snode-stream">{(r?.text || '').slice(-700)}{status === 'running' && <span className="caret" />}</div>
          ) : status === 'error' || status === 'skipped' ? (
            <div className="snode-err">{r?.error}</div>
          ) : (
            <div className="snode-prompt">{data.prompt}</div>
          )}
        </div>

        <footer className="snode-foot">
          <span className="snode-model">{r?.model || (data.config?.model !== 'auto' ? data.config?.model : role.tier)}</span>
          <span className="grow" />
          {r?.resetReason && status === 'running' && <Pill tone="warn">↻ {r.resetReason}</Pill>}
          {r?.codex && (
            <Pill tone={r.codex.approved ? 'ok' : 'warn'} title={r.codex.violations.join(', ') || 'All 8 layers passed'}>
              CODEX {Math.round(r.codex.score * 100)}
            </Pill>
          )}
          {upe && <Pill tone={upe.shouldRefine ? 'warn' : 'ok'}>UPE {Math.round(upe.composite * 100)}</Pill>}
          {r?.ms != null && <span className="snode-ms">{(r.ms / 1000).toFixed(1)}s</span>}
        </footer>
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default memo(SwarmNode);
