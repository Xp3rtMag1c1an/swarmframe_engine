import React from 'react';
import { useSwarmStore } from '../../stores/swarmStore';

export default function OutputViewer() {
  const { executionResults, nodes } = useSwarmStore();

  const finalNode = nodes.find(node => node.id === 'synth-1'); // Assuming synth-1 is final
  const finalOutput = executionResults['synth-1'];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold">Output Viewer</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {finalOutput ? (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-2">Final Proposal</h3>
            <p className="text-sm whitespace-pre-wrap">{finalOutput}</p>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            Run the swarm to generate output
          </div>
        )}
        <div className="space-y-3">
          {Object.entries(executionResults).map(([nodeId, result]) => {
            const node = nodes.find(n => n.id === nodeId);
            return (
              <div key={nodeId} className="bg-gray-50 rounded p-3">
                <h4 className="text-sm font-medium">{node?.data.role} Output</h4>
                <p className="text-xs mt-1 whitespace-pre-wrap">{result.substring(0, 200)}...</p>
                <p className="text-xs text-gray-500">Execution time: {executionResults[nodeId]?.timing?.duration}ms</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 