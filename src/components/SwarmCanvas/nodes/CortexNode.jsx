import React from 'react';
import NodeShell from './NodeShell';

const CONFIG = {
  color:    '#3b82f6',
  glow:     'rgba(59,130,246,0.35)',
  icon:     '🧠',
  label:    'Cortex Node',
  sublabel: 'Master Planner',
};

export default function CortexNode({ id, data }) {
  return <NodeShell id={id} data={data} config={CONFIG} />;
}
