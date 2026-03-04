import React from 'react';
import NodeShell from './NodeShell';

const CONFIG = {
  color:    '#8b5cf6',
  glow:     'rgba(139,92,246,0.35)',
  icon:     '🎨',
  label:    'Muse Node',
  sublabel: 'Creative Catalyst',
};

export default function MuseNode({ id, data }) {
  return <NodeShell id={id} data={data} config={CONFIG} />;
}
