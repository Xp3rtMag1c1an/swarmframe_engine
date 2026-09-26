import React, { useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { useStore } from './store.js';
import TopBar from './components/TopBar.jsx';
import MissionPanel from './components/MissionPanel.jsx';
import Canvas from './components/Canvas.jsx';
import Inspector from './components/Inspector.jsx';
import SignalLog from './components/SignalLog.jsx';

export default function App() {
  useEffect(() => { useStore.getState().init(); }, []);
  const backend = useStore((s) => s.backend);

  return (
    <div className="app">
      <TopBar />
      {backend.id === 'mock' && backend.mode === 'server' && (
        <div className="banner">Demo mode — the backend is up but has no API key. Add <code>ANTHROPIC_API_KEY</code> to <code>.env</code> and restart <code>npm run dev</code> to route through Claude.</div>
      )}
      <div className="workspace">
        <MissionPanel />
        <main className="stage">
          <ReactFlowProvider>
            <Canvas />
          </ReactFlowProvider>
          <SignalLog />
        </main>
        <Inspector />
      </div>
    </div>
  );
}
