import React from 'react';
import NodeShell from './NodeShell';

const CONFIGS = {
  sentinel: { color: '#f59e0b', glow: 'rgba(245,158,11,0.35)', icon: '🛡️', label: 'Sentinel Node', sublabel: 'Quality Guardian' },
  synth:    { color: '#06b6d4', glow: 'rgba(6,182,212,0.35)',  icon: '🔗', label: 'Synth Node',    sublabel: 'Integration Specialist' },
  critic:   { color: '#ef4444', glow: 'rgba(239,68,68,0.35)',  icon: '🧪', label: 'Critic Node',   sublabel: 'Adversarial Tester' },
};

const DEFAULT_CONFIG = { color: '#4a6080', glow: 'rgba(74,96,128,0.3)', icon: '⚙️', label: 'Node', sublabel: '' };

export default function SwarmNode({ id, data, type }) {
  const config = CONFIGS[type] || DEFAULT_CONFIG;
  return <NodeShell id={id} data={data} config={config} />;
}
