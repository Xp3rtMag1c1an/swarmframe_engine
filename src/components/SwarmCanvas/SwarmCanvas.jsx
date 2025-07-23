import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  ConnectionLineType
} from 'reactflow';
import { useSwarmStore } from '../../stores/swarmStore';
import { nodeTypes } from './nodes/nodeTypes';
import CustomEdge from './edges/CustomEdge';
import 'reactflow/dist/style.css';

const edgeTypes = {
  custom: CustomEdge,
};

export default function SwarmCanvas() {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    setNodes: setStoreNodes,
    setEdges: setStoreEdges,
    selectNode,
    isExecuting,
    currentStage,
    executionResults
  } = useSwarmStore();

  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);

  // Sync with store
  useEffect(() => {
    setNodes(storeNodes);
  }, [storeNodes, setNodes]);

  useEffect(() => {
    setEdges(storeEdges);
  }, [storeEdges, setEdges]);

  // Enhanced nodes with execution state
  const enhancedNodes = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        isExecuting: isExecuting && node.data.stage === currentStage,
        hasResult: !!executionResults[node.id],
        result: executionResults[node.id]
      }
    }));
  }, [nodes, isExecuting, currentStage, executionResults]);

  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        type: 'custom',
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 }
      };
      const updatedEdges = addEdge(newEdge, edges);
      setEdges(updatedEdges);
      setStoreEdges(updatedEdges);
    },
    [edges, setEdges, setStoreEdges]
  );

  const onNodeClick = useCallback((event, node) => {
    selectNode(node.id);
  }, [selectNode]);

  const onNodesChangeHandler = useCallback((changes) => {
    onNodesChange(changes);
    // Sync back to store after a delay to avoid excessive updates
    setTimeout(() => {
      setStoreNodes(nodes);
    }, 100);
  }, [onNodesChange, setStoreNodes, nodes]);

  const onNodeDrag = useCallback((event, node) => {
    // Custom logic to smooth dragging if necessary
  }, []);

  return (
    <div className="w-full h-full canvas glass">
      <ReactFlow
        nodes={enhancedNodes}
        edges={edges}
        onNodesChange={onNodesChangeHandler}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDrag={onNodeDrag}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        className="bg-gray-50"
      >
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'cortex': return '#3b82f6';
              case 'muse': return '#8b5cf6';
              case 'sentinel': return '#ef4444';
              case 'synth': return '#10b981';
              default: return '#6b7280';
            }
          }}
          className="bg-white border rounded-lg"
        />
        <Controls className="bg-white border rounded-lg" />
        <Background color="#e5e7eb" gap={20} />
      </ReactFlow>
    </div>
  );
} 