import React, { useState, useEffect } from 'react';
import { useSwarmStore } from '../../stores/swarmStore';
import { swarmRunner } from '../../services/swarmRunner';

export default function SwarmHeader() {
  const { isExecuting, toggleOutput, showOutput, globalSignal, exportSwarm } = useSwarmStore();
  const [geminiReady, setGeminiReady] = useState(false);

  useEffect(() => {
    setGeminiReady(!!process.env.REACT_APP_GEMINI_API_KEY);
  }, []);

  const handleRun = () => { if (!isExecuting) swarmRunner.runSwarm(); };

  const handleExport = () => {
    const data = exportSwarm();
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    Object.assign(document.createElement('a'), { href: url, download: 'logos-swarm.json' }).click();
  };

  return (
    <header style={{ background: 'rgba(8, 14, 28, 0.98)', borderBottom: '1px solid #162038', backdropFilter: 'blur(20px)', zIndex: 50 }} className="flex items-center justify-between px-5 py-2.5 shrink-0">

      {/* Left — Wordmark */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          {/* Logos mark */}
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
            ⚛
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.2em', color: '#4a6080', fontWeight: 600, textTransform: 'uppercase', lineHeight: 1 }}>Logos Engine</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f8', letterSpacing: '0.01em', lineHeight: 1.2 }}>SwarmFrame</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: '#162038' }} />

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button onClick={handleRun} disabled={isExecuting} className="btn-run">
            {isExecuting ? (
              <>
                <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} className="spin" />
                <span>Running</span>
              </>
            ) : (
              <>
                <svg width="11" height="13" viewBox="0 0 11 13" fill="currentColor"><path d="M0 0L11 6.5L0 13V0Z"/></svg>
                <span>Run Swarm</span>
              </>
            )}
          </button>

          <button onClick={handleExport} className="btn-ghost">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 1v7M3 5l3 3 3-3M1 9v1a1 1 0 001 1h8a1 1 0 001-1V9"/></svg>
            Export
          </button>

          <button onClick={toggleOutput} className={`btn-ghost ${showOutput ? 'active' : ''}`}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="10" height="10" rx="1.5"/><path d="M7 1v10"/></svg>
            Output
          </button>
        </div>
      </div>

      {/* Right — Status indicators */}
      <div className="flex items-center gap-3">
        {/* Goal preview */}
        <div style={{ fontSize: '0.72rem', color: '#4a6080', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#8ea5c8', fontWeight: 500 }}>Goal: </span>
          {globalSignal.goal.substring(0, 32)}…
        </div>

        {/* Progress bar */}
        {(globalSignal.goalProgress > 0) && (
          <div style={{ width: 80, height: 3, background: '#162038', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(globalSignal.goalProgress || 0) * 100}%`, background: 'linear-gradient(90deg, #2563eb, #06b6d4)', borderRadius: 2, transition: 'width 0.5s ease' }} />
          </div>
        )}

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: '#162038' }} />

        {/* Layer badges */}
        <div className="flex items-center gap-1.5">
          <span className="tag" style={{ color: '#60a5fa', borderColor: 'rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.08)' }}>🧬 Blueprint</span>
          <span className="tag" style={{ color: '#34d399', borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)' }}>📜 CODEX</span>
          <span className="tag" style={{ color: '#c084fc', borderColor: 'rgba(192,132,252,0.3)', background: 'rgba(192,132,252,0.08)' }}>🧠 UPE</span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: '#162038' }} />

        {/* Gemini status */}
        <div className="flex items-center gap-1.5" style={{ fontSize: '0.72rem' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: geminiReady ? '#10b981' : '#ef4444', boxShadow: geminiReady ? '0 0 6px #10b981' : '0 0 6px #ef4444', display: 'inline-block' }} />
          <span style={{ color: '#8ea5c8' }}>{geminiReady ? 'Gemini 2.5' : 'No API Key'}</span>
        </div>
      </div>
    </header>
  );
}
