import React from 'react';
import { getSmoothStepPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';

// Edge color by signal type / source node
const EDGE_COLORS = {
  'analysis_output':     '#3b82f6',  // cortex blue
  'variant_concepts':    '#10b981',  // looper emerald
  'technical_to_narrative': '#10b981',
  'narrative_vision':    '#8b5cf6',  // muse violet
  'direct_vision_feed':  '#8b5cf6',
  'vision_to_evaluation':'#f59e0b',  // sentinel amber
  'evaluation_feedback': '#06b6d4',  // synth cyan
  'critique_to_synthesis':'#06b6d4',
};

const DEFAULT_COLOR = '#3b82f6';

export default function CustomEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data, style = {},
}) {
  const color = EDGE_COLORS[data?.signalType] || style.stroke || DEFAULT_COLOR;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 12,
  });

  const glowId = `glow-${id}`;

  return (
    <>
      {/* SVG defs for per-edge glow filter */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Base track (dim) */}
      <path
        d={edgePath}
        fill="none"
        stroke={color}
        strokeOpacity={0.18}
        strokeWidth={2}
      />

      {/* Animated flow line */}
      <path
        d={edgePath}
        fill="none"
        stroke={color}
        strokeOpacity={0.85}
        strokeWidth={1.5}
        strokeDasharray="5 7"
        className="edge-flow"
        style={{ filter: `url(#${glowId})` }}
      />

      {/* Label */}
      {data?.signalType && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              fontSize: '0.6rem',
              fontWeight: 600,
              color,
              background: 'rgba(8, 14, 28, 0.85)',
              border: `1px solid ${color}30`,
              borderRadius: 4,
              padding: '2px 6px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              pointerEvents: 'none',
              backdropFilter: 'blur(8px)',
            }}
            className="nodrag nopan"
          >
            {data.signalType.replace(/_/g, ' ')}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
