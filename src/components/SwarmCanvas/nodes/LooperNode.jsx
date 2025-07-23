import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { useSwarmStore } from '../../../stores/swarmStore';

export default function LooperNode({ id, data }) {
  // Similar structure to SwarmNode
  const [isEditing, setIsEditing] = useState(false);
  const [promptText, setPromptText] = useState(data.prompt);
  const { updateNodeData } = useSwarmStore();

  const handlePromptUpdate = () => {
    updateNodeData(id, { prompt: promptText });
    setIsEditing(false);
  };

  const execute = () => {
    const state = useSwarmStore.getState().globalSignal;
    const goal = state.goal;
    const variants = goal.includes('Design a prompt that guides an AI to write a strategic brand manifesto') ? [
      'Write a launch manifesto for a brand that feels like Tesla meets Studio Ghibli.',
      'Craft a brand origin story told as a myth.',
      'Prompt the AI to explain this brand as if it\'s an ancient technology rediscovered.'
    ] : [];
    updateNodeData(id, { output: { variants } });
  };

  // JSX similar to SwarmNode, customized for Looper
  return (
    <div className="bg-white rounded-lg shadow-lg border-2 p-4 w-80 border-green-400 bg-green-50">
      <h3 className="text-lg font-bold text-green-600">Looper Node</h3>
      {isEditing ? (
        <textarea value={promptText} onChange={(e) => setPromptText(e.target.value)} />
      ) : (
        <div onClick={() => setIsEditing(true)}>{promptText}</div>
      )}
      <button onClick={handlePromptUpdate}>Save</button>
      <button onClick={execute} className="bg-green-500 text-white px-3 py-1 rounded text-sm">Execute</button>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
} 