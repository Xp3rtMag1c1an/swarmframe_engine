import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { MiniMap, Controls, Background, BackgroundVariant, addEdge, useNodesState, useEdgesState, ConnectionLineType } from 'reactflow';
import { useSwarmStore } from '../../stores/swarmStore';
import { nodeTypes } from './nodes/nodeTypes';
import CustomEdge from './edges/CustomEdge';
import 'reactflow/dist/style.css';

const edgeTypes = { custom: CustomEdge };

const NODE_COLORS = {
  cortex:   '#3b82f6',
  looper:   '#10b981',
  muse:     '#8b5cf6',
  sentinel: '#f59e0b',
  synth:    '#06b6d4',
  critic:   '#ef4444',
};

export default function SwarmCanvas() {
  const { nodes: storeNodes, edges: storeEdges, setNodes: setStoreNodes, setEdges: setStoreEdges, selectNode, isExecuting, currentStage, executionResults } = useSwarmStore();

  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);

  useEffect(() => { setNodes(storeNodes); }, [storeNodes, setNodes]);
  useEffect(() => { setEdges(storeEdges); }, [storeEdges, setEdges]);

  const enhancedNodes = useMemo(() => nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      isExecuting: isExecuting && node.data.stage === currentStage,
      hasResult: !!executionResults[node.id],
      result: executionResults[node.id],
    },
  })), [nodes, isExecuting, currentStage, executionResults]);

  const onConnect = useCallback((params) => {
    const updated = addEdge({ ...params, type: 'custom', animated: true, style: { stroke: '#3b82f6', strokeWidth: 1.5 } }, edges);
    setEdges(updated);
    setStoreEdges(updated);
  }, [edges, setEdges, setStoreEdges]);

  const onNodeClick = useCallback((_, node) => selectNode(node.id), [selectNode]);

  const onNodesChangeHandler = useCallback((changes) => {
    onNodesChange(changes);
    setTimeout(() => setStoreNodes(nodes), 100);
  }, [onNodesChange, setStoreNodes, nodes]);

  return (
    <div className="w-full h-full logos-canvas">
      <ReactFlow
        nodes={enhancedNodes}
        edges={edges}
        onNodesChange={onNodesChangeHandler}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 1.5, opacity: 0.6 }}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        style={{ background: 'transparent' }}
      >
        <MiniMap
          nodeColor={(node) => NODE_COLORS[node.type] || '#4a6080'}
          nodeStrokeWidth={0}
          maskColor="rgba(4, 7, 15, 0.8)"
          style={{ background: '#0c1526', border: '1px solid #162038', borderRadius: 8 }}
        />
        <Controls style={{ background: '#0c1526', border: '1px solid #162038', borderRadius: 8 }} />
        <Background
          variant={BackgroundVariant.Dots}
          color="#1a2744"
          gap={24}
          size={1}
          style={{ background: '#07101f' }}
        />
      </ReactFlow>
    </div>
  );
}
