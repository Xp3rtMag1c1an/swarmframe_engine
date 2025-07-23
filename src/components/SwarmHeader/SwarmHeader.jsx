import React, { useState, useEffect } from 'react';
import { useSwarmStore } from '../../stores/swarmStore';
import { swarmRunner } from '../../services/swarmRunner';

export default function SwarmHeader() {
  const {
    isExecuting,
    toggleOutput,
    showOutput,
    globalSignal,
    exportSwarm
  } = useSwarmStore();

  const [isOllamaConnected, setIsOllamaConnected] = useState(false);

  useEffect(() => {
    fetch(process.env.OLLAMA_BASE_URL || 'http://localhost:11434/api/version')
      .then(() => setIsOllamaConnected(true))
      .catch(() => setIsOllamaConnected(false));
  }, []);

  const handleRunSwarm = () => {
    if (!isExecuting) {
      swarmRunner.runSwarm();
    }
  };

  const handleExport = () => {
    const swarmData = exportSwarm();
    const blob = new Blob([JSON.stringify(swarmData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'swarm-config.json';
    a.click();
  };

  return (
    <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <h1 className="text-2xl font-bold text-gray-800">
          ⚛️ SwarmCanvas
        </h1>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunSwarm}
            disabled={isExecuting}
            className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
              isExecuting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isExecuting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Running...</span>
              </>
            ) : (
              <>
                <span>▶️</span>
                <span>Run Swarm</span>
              </>
            )}
          </button>

          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
          >
            <span>💾</span>
            <span>Export</span>
          </button>

          <button
            onClick={toggleOutput}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              showOutput
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>📊</span>
            <span>Output</span>
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-2">
          <span className="font-medium">🎯 Goal:</span>
          <span className="text-gray-600">{globalSignal.goal.substring(0, 30)}...</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-medium">🧠 Persona:</span>
          <span className="text-gray-600">Architect</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-medium">🌐 Ollama:</span>
          <span className={isOllamaConnected ? 'text-green-500' : 'text-red-500'}>
            {isOllamaConnected ? '✅ Ollama Connected' : '❌ Ollama Offline'}
          </span>
        </div>
      </div>
    </div>
  );
} 