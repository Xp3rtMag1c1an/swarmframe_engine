import React from 'react';
import { useSwarmStore } from '../../stores/swarmStore';

export default function SignalBusConsole() {
  const { globalSignal, updateGlobalSignal, executionLog } = useSwarmStore();

  const handleSignalUpdate = (field, value) => {
    updateGlobalSignal({ [field]: value });
  };

  return (
    <div className="bg-white border-t px-6 py-4">
      <div className="flex items-center space-x-6 mb-3">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">🎯 Goal:</label>
          <input
            type="text"
            value={globalSignal.goal}
            onChange={(e) => handleSignalUpdate('goal', e.target.value)}
            className="border rounded px-3 py-1 text-sm w-64 focus:ring-2 focus:ring-indigo-500"
            placeholder="Define your objective..."
          />
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">🗣️ Tone:</label>
          <select
            value={globalSignal.tone}
            onChange={(e) => handleSignalUpdate('tone', e.target.value)}
            className="border rounded px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Visionary">Visionary</option>
            <option value="Analytical">Analytical</option>
            <option value="Creative">Creative</option>
            <option value="Pragmatic">Pragmatic</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">🎚️ Creativity:</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={globalSignal.creativity}
            onChange={(e) => handleSignalUpdate('creativity', parseFloat(e.target.value))}
            className="w-20"
          />
          <span className="text-sm text-gray-600 w-8">{globalSignal.creativity}</span>
        </div>
      </div>

      {/* Execution Log */}
      {executionLog.length > 0 && (
        <div className="mt-3 bg-gray-50 rounded p-3 max-h-20 overflow-y-auto">
          <div className="text-xs text-gray-600 space-y-1">
            {executionLog.slice(-3).map((log, i) => (
              <div key={i} className="flex items-center space-x-2">
                <span className="text-gray-400">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 