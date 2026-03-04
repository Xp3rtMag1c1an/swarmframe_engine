import React from 'react';
import NodeShell from './NodeShell';

const CONFIG = {
  color:    '#10b981',
  glow:     'rgba(16,185,129,0.35)',
  icon:     '🔄',
  label:    'Looper Node',
  sublabel: 'Variant Generator',
};

export default function LooperNode({ id, data }) {
  return <NodeShell id={id} data={data} config={CONFIG} />;
}
