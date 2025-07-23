import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { useSwarmStore } from '../../../stores/swarmStore';
import { searchPrompts } from '../../../services/supermemoryService';

export default function SwarmNode({ id, data, type }) {
  const [isEditing, setIsEditing] = useState(false);
  const [promptText, setPromptText] = useState(data.prompt);
  const { updateNodeData } = useSwarmStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handlePromptUpdate = () => {
    updateNodeData(id, { prompt: promptText });
    setIsEditing(false);
  };

  const handleSearch = async () => {
    const results = await searchPrompts(searchQuery, [type]);
    setSearchResults(results);
  };

  const getTypeColor = () => {
    switch (type) {
      case 'looper': return { border: 'border-green-400', bg: 'bg-green-50', text: 'text-green-600', bar: 'bg-green-500' };
      case 'sentinel': return { border: 'border-red-400', bg: 'bg-red-50', text: 'text-red-600', bar: 'bg-red-500' };
      case 'synth': return { border: 'border-teal-400', bg: 'bg-teal-50', text: 'text-teal-600', bar: 'bg-teal-500' };
      default: return { border: 'border-gray-400', bg: 'bg-gray-50', text: 'text-gray-600', bar: 'bg-gray-500' };
    }
  };

  const colors = getTypeColor();

  const getStatusColor = () => {
    if (data.isExecuting) return 'border-yellow-400 bg-yellow-50';
    if (data.hasResult) return 'border-green-400 bg-green-50';
    return `${colors.border} ${colors.bg}`;
  };

  const getStatusIcon = () => {
    if (data.isExecuting) return '⚡';
    if (data.hasResult) return '✅';
    switch (type) {
      case 'looper': return '🔁';
      case 'sentinel': return '🛡️';
      case 'synth': return '🔗';
      default: return '⚙️';
    }
  };

  // Choose primary anatomy metric based on type
  const getPrimaryAnatomy = () => {
    switch (type) {
      case 'looper': return 'creativity';
      case 'sentinel': return 'precision';
      case 'synth': return 'logic';
      default: return 'logic';
    }
  };

  const primaryAnatomy = getPrimaryAnatomy();

  return (
    <div className={`bg-white rounded-lg shadow-lg border-2 p-4 w-80 ${getStatusColor()}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getStatusIcon()}</span>
          <div>
            <h3 className={`text-lg font-bold ${colors.text}`}>{data.role}</h3>
            <p className="text-sm text-gray-600">{data.persona}</p>
          </div>
        </div>
        {data.isExecuting && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
        )}
      </div>

      {/* Anatomy Bars */}
      <div className="mb-3 space-y-1">
        <div className="flex justify-between text-xs">
          <span>{primaryAnatomy.charAt(0).toUpperCase() + primaryAnatomy.slice(1)}</span>
          <span>{Math.round(data.anatomy[primaryAnatomy] * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div 
            className={`${colors.bar} h-1 rounded-full`} 
            style={{ width: `${data.anatomy[primaryAnatomy] * 100}%` }}
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
              className="w-full text-sm border rounded p-2 resize-none focus:ring-2 focus:ring-indigo-500"
              rows={4}
            />
            <div className="flex space-x-2">
              <button
                onClick={handlePromptUpdate}
                className="bg-indigo-500 text-white px-3 py-1 rounded text-sm hover:bg-indigo-600"
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

      {/* Model Selection */}
      <div className="mb-3">
        <label htmlFor="model-select" className="block text-xs font-medium text-gray-700 mb-1">
          Model
        </label>
        <select
          id="model-select"
          value={data.config?.model || 'default'}
          onChange={(e) => updateNodeData(id, { config: { ...data.config, model: e.target.value } })}
          className="w-full text-sm border rounded p-1 mt-2"
        >
          <option value="default">Default</option>
          <option value="llama3.1:8b">Llama 3.1 8B</option>
          <option value="llama3.1:70b">Llama 3.1 70B</option>
          <option value="codellama:7b">CodeLlama 7B</option>
        </select>
      </div>

      {/* Prompt Search */}
      <div className="mt-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search prompts..."
          className="w-full border rounded p-2 text-sm"
        />
        <button onClick={handleSearch} className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
          Search
        </button>
        <div className="mt-2 max-h-40 overflow-y-auto">
          {searchResults.map((prompt) => (
            <div key={prompt.id} className="p-2 border-b cursor-pointer hover:bg-gray-100" onClick={() => updateNodeData(id, { prompt: prompt.content })}>
              <p className="font-bold">{prompt.title}</p>
              <p className="text-xs">{prompt.content.substring(0, 100)}...</p>
            </div>
          ))}
        </div>
      </div>

      {/* Result Preview */}
      {data.hasResult && (
        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-xs">
          <strong>Result:</strong> {data.result.substring(0, 80)}...
        </div>
      )}

      {/* Handles */}
      <Handle type="target" position={Position.Top} className={`w-3 h-3 ${colors.bar}`} />
      <Handle type="source" position={Position.Bottom} className={`w-3 h-3 ${colors.bar}`} />
    </div>
  );
} 