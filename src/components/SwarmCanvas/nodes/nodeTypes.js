import CortexNode from './CortexNode';
import MuseNode from './MuseNode';
import SwarmNode from './SwarmNode'; // Assuming a base node for others
import LooperNode from './LooperNode';

export const nodeTypes = {
  cortex: CortexNode,
  muse: MuseNode,
  looper: LooperNode, // Use base for looper, sentinel, synth or create specific ones
  sentinel: SwarmNode,
  synth: SwarmNode,
}; 