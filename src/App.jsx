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
        <div className="banner">Demo mode — no model found. Run <code>ollama serve</code> + <code>ollama pull llama3.1:8b</code> (free, local), or put a free <code>GROQ_API_KEY</code> in <code>.env</code>, then restart <code>npm run dev</code>.</div>
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
