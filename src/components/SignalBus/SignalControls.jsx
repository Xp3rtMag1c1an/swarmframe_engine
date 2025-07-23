import React from 'react';
import { useSwarmStore } from '../../stores/swarmStore';

export default function SignalControls() {
  const { globalSignal, updateGlobalSignal } = useSwarmStore();

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3 className="text-sm font-medium mb-2">Advanced Controls</h3>
      <div className="space-y-2">
        <div>
          <label className="text-xs">Max Length</label>
          <input
            type="number"
            value={globalSignal.maxLength}
            onChange={(e) => updateGlobalSignal({ maxLength: parseInt(e.target.value) })}
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="text-xs">Precision</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={globalSignal.precision}
            onChange={(e) => updateGlobalSignal({ precision: parseFloat(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
} 