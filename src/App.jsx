import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import SwarmCanvas from './components/SwarmCanvas/SwarmCanvas';
import SwarmHeader from './components/SwarmHeader/SwarmHeader';
import SignalBusConsole from './components/SignalBus/SignalBusConsole';
import OutputViewer from './components/OutputPanel/OutputViewer';
import { useSwarmStore } from './stores/swarmStore';
import './App.css';

export default function App() {
  const { isExecuting, showOutput } = useSwarmStore();

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#04070f', overflow: 'hidden' }}>

      <SwarmHeader />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlowProvider>
            <SwarmCanvas />
          </ReactFlowProvider>

          {/* Executing overlay — subtle, non-blocking */}
          {isExecuting && (
            <div style={{
              position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(8,14,28,0.9)', border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: 8, padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 8,
              backdropFilter: 'blur(12px)', zIndex: 20,
              boxShadow: '0 0 20px rgba(59,130,246,0.2)',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <span style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 500, letterSpacing: '0.04em' }}>
                Logos Engine executing
              </span>
            </div>
          )}
        </div>

        {/* Output panel */}
        {showOutput && (
          <div style={{ width: 360, flexShrink: 0 }}>
            <OutputViewer />
          </div>
        )}
      </div>

      <SignalBusConsole />
    </div>
  );
}
