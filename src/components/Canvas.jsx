import React, { useMemo } from 'react';
import ReactFlow, { Background, BackgroundVariant, Controls, MiniMap, ConnectionLineType, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { useStore } from '../store.js';
import { NODE_ROLES } from '../../shared/layers.js';
import SwarmNode from './SwarmNode.jsx';

const nodeTypes = Object.fromEntries(Object.keys(NODE_ROLES).map((t) => [t, SwarmNode]));

export default function Canvas() {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const nodeRuns = useStore((s) => s.nodeRuns);
  const selected = useStore((s) => s.selected);
  const { onNodesChange, onEdgesChange, onConnect, select } = useStore.getState();

  // Edges light up while data is flowing into a running node.
  const liveEdges = useMemo(() => {
    const typeOf = Object.fromEntries(nodes.map((n) => [n.id, n.type]));
    return edges.map((e) => {
      const src = nodeRuns[e.source]?.status;
      const dst = nodeRuns[e.target]?.status;
      const color = NODE_ROLES[typeOf[e.source]]?.color || '#5b8cff';
      const flowing = src === 'done' && dst === 'running';
      const delivered = src === 'done' && dst === 'done';
      return {
        ...e,
        type: 'smoothstep',
        animated: flowing,
        className: flowing ? 'edge-flowing' : delivered ? 'edge-delivered' : '',
        style: { stroke: color, strokeWidth: flowing ? 2.4 : 1.5, opacity: flowing || delivered ? 1 : 0.45 },
        markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
      };
    });
  }, [edges, nodes, nodeRuns]);

  const flowNodes = useMemo(() => nodes.map((n) => (n.selected === (n.id === selected) ? n : { ...n, selected: n.id === selected })), [nodes, selected]);

  return (
    <div className="canvas">
      <ReactFlow
        nodes={flowNodes}
        edges={liveEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, n) => select(n.id)}
        onPaneClick={() => select(null)}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.12, maxZoom: 1 }}
        minZoom={0.25}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="var(--grid)" />
        <MiniMap pannable zoomable style={{ width: 150, height: 100 }} nodeColor={(n) => NODE_ROLES[n.type]?.color || '#888'} nodeStrokeWidth={0} maskColor="var(--minimap-mask)" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
