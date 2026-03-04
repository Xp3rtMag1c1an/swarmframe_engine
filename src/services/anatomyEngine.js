/**
 * ANATOMY ENGINE — The Blueprint Layer
 *
 * Translates AI Anatomy (8 biological systems + anatomy sliders) into
 * Gemini system instructions. Every node gets a persona-accurate system
 * prompt shaped by its Skeletal/Nervous/Immune/etc. anchors and its
 * logic/creativity/empathy/precision profile.
 */

import { personaDna } from '../data/personaDna';

// The 8 biological systems and their AI functional analogues
const SYSTEM_ANCHORS = {
  Skeletal:      'Provide rigid structure and foundational constraints. Organize everything around a clear skeleton of principles.',
  Nervous:       'Prioritize communication, coordination, and rapid signal transmission. Connect ideas and ensure information flows cleanly.',
  Immune:        'Filter aggressively. Detect inconsistencies, logical errors, and threats to integrity. Protect the output from weakness.',
  Muscular:      'Drive toward concrete action and execution. Every insight must translate into something moveable and forceful.',
  Endocrine:     'Calibrate tone, mood, and behavioral register precisely. Regulate the emotional and stylistic temperature of the output.',
  Digestive:     'Break complex inputs down into their essential nutrients. Transform and absorb. Synthesize toward the most usable form.',
  Cardiovascular:'Keep energy and momentum flowing throughout. Distribute resources evenly. Sustain rhythm across the entire output.',
  Respiratory:   'Maintain balance and coherence. Breathe life into the work — ensure it has cadence, vitality, and living quality.',
};

// Describe the intensity of an anatomy trait
function traitDescriptor(trait, value) {
  const pct = Math.round(value * 100);
  if (pct >= 90) return `${trait}: DOMINANT (${pct}%) — let this trait lead everything`;
  if (pct >= 70) return `${trait}: HIGH (${pct}%) — strong presence throughout`;
  if (pct >= 50) return `${trait}: MODERATE (${pct}%) — present but balanced`;
  if (pct >= 30) return `${trait}: LOW (${pct}%) — restrained, secondary role`;
  return `${trait}: MINIMAL (${pct}%) — barely present, yield to other traits`;
}

/**
 * Generate a system instruction for a node based on its anatomy and persona DNA.
 * This is passed as the Gemini `systemInstruction` parameter.
 */
export function generateSystemInstruction(nodeType, anatomy = {}, goal = '', tone = 'Visionary') {
  const personaKey = nodeType.charAt(0).toUpperCase() + nodeType.slice(1);
  const dna = personaDna[personaKey] || [];

  const anatomyLines = Object.entries(anatomy)
    .map(([trait, value]) => `  • ${traitDescriptor(trait, value)}`)
    .join('\n');

  const dnaLines = dna
    .map(system => `  • ${system}: ${SYSTEM_ANCHORS[system] || system}`)
    .join('\n');

  const roleDescriptions = {
    cortex:   'Master Planner — decompose the goal, map dependencies, set the execution sequence',
    looper:   'Variant Generator — produce multiple distinct approaches, explore the solution space laterally',
    muse:     'Creative Catalyst — inject narrative depth, metaphor, emotional texture, and imaginative language',
    sentinel: 'Quality Guardian — evaluate rigorously, score against criteria, flag weaknesses, enforce standards',
    synth:    'Integration Specialist — merge all upstream outputs into one cohesive, polished, final deliverable',
    critic:   'Adversarial Tester — stress-test assumptions, surface vulnerabilities, run counterfactuals',
  };

  return `You are the ${personaKey} Node — ${roleDescriptions[nodeType] || 'specialized cognitive agent'} — operating inside the SWARMFRAME multi-agent system.

═══ COGNITIVE ANATOMY PROFILE ═══
${anatomyLines}

═══ PERSONA DNA — BIOLOGICAL SYSTEM ANCHORS ═══
${dnaLines}

═══ ACTIVE MISSION ═══
Goal: ${goal}
Tone: ${tone}

═══ OPERATING DIRECTIVES ═══
1. Your output must reflect your cognitive anatomy — dominant traits must be visible in your work
2. Let your biological anchors shape HOW you process, not just WHAT you produce
3. Operate in your designated role only — do not bleed into other nodes' functions
4. Precision of role is what makes the swarm coherent`;
}

/**
 * Get the node role label for display.
 */
export function getNodeRoleLabel(nodeType) {
  const labels = {
    cortex:   '🧠 Cortex — Master Planner',
    looper:   '🔄 Looper — Variant Generator',
    muse:     '🎨 Muse — Creative Catalyst',
    sentinel: '🔍 Sentinel — Quality Guardian',
    synth:    '🔗 Synth — Integration Specialist',
    critic:   '🧪 Critic — Adversarial Tester',
  };
  return labels[nodeType] || nodeType;
}
