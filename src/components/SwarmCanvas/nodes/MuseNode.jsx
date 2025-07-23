import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { useSwarmStore } from '../../../stores/swarmStore';

export default function MuseNode({ id, data }) {
  const [isEditing, setIsEditing] = useState(false);
  const [promptText, setPromptText] = useState(data.prompt);
  const { updateNodeData } = useSwarmStore();

  const handlePromptUpdate = () => {
    updateNodeData(id, { prompt: promptText });
    setIsEditing(false);
  };

  const getStatusColor = () => {
    if (data.isExecuting) return 'border-yellow-400 bg-yellow-50';
    if (data.hasResult) return 'border-green-400 bg-green-50';
    return 'border-purple-400 bg-purple-50';
  };

  const getStatusIcon = () => {
    if (data.isExecuting) return '⚡';
    if (data.hasResult) return '✅';
    return '🎨';
  };

  const execute = () => {
    const state = useSwarmStore.getState().globalSignal;
    const cortex_output = state.nodeOutputs?.CortexNode || {};
    const task_map = cortex_output.task_map || [];
    const creative_enhancements = [];
    if (task_map.includes('Translate it into metaphor')) {
      creative_enhancements.push('Imagine your brand as a city in the clouds—what governs its culture, laws, and myth?');
    }
    if (task_map.includes('Format into a persuasive, structured prompt')) {
      creative_enhancements.push('Unfold the manifesto like an encrypted prophecy—what must the world understand now?');
    }
    updateNodeData(id, { output: { creative_enhancements } });
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border-2 p-4 w-80 ${getStatusColor()}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getStatusIcon()}</span>
          <div>
            <h3 className="text-lg font-bold text-purple-600">{data.role}</h3>
            <p className="text-sm text-gray-600">{data.persona}</p>
          </div>
        </div>
        {data.isExecuting && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
        )}
      </div>

      {/* Anatomy Bars - Showing creativity as primary */}
      <div className="mb-3 space-y-1">
        <div className="flex justify-between text-xs">
          <span>Creativity</span>
          <span>{Math.round(data.anatomy.creativity * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div 
            className="bg-purple-500 h-1 rounded-full" 
            style={{ width: `${data.anatomy.creativity * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Prompt Editor */}
      <div className="mb-3">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full text-sm border rounded p-2 resize-none focus:ring-2 focus:ring-purple-500"
              rows={4}
            />
            <select
              value={data.config?.model || 'default'}
              onChange={(e) => updateNodeData(id, { config: { ...data.config, model: e.target.value } })}
              className="w-full text-sm border rounded p-1 mt-2"
            >
              <option value="default">Default</option>
              <option value="llama3.1:8b">Llama 3.1 8B</option>
              <option value="llama3.1:70b">Llama 3.1 70B</option>
              <option value="codellama:7b">CodeLlama 7B</option>
            </select>
            <div className="flex space-x-2">
              <button
                onClick={handlePromptUpdate}
                className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className="text-sm text-gray-700 bg-gray-50 p-2 rounded cursor-pointer hover:bg-gray-100"
            onClick={() => setIsEditing(true)}
          >
            {data.prompt.length > 100 ? `${data.prompt.substring(0, 100)}...` : data.prompt}
          </div>
        )}
      </div>

      {/* Result Preview */}
      {data.hasResult && (
        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-xs">
          <strong>Result:</strong> {data.result.substring(0, 80)}...
        </div>
      )}

      {/* Handles */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-500" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-500" />
    </div>
  );
} 