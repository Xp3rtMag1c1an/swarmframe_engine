/**
 * The three Logos Engine layers, shared by the server and the in-browser demo.
 *
 *   Blueprint (Anatomy)   → a system prompt per node, shaped by persona DNA + trait sliders
 *   Soul (CODEX)          → an 8-layer constitution check between stages
 *   Mind (PROMETHEAN-UPE) → 5-dimension scoring that can trigger a refinement pass
 */

export const PERSONA_DNA = {
  cortex:   ['Skeletal', 'Nervous', 'Meta-Ethical Foresight'],
  sentinel: ['Immune', 'Muscular', 'Algorithmic Epistemology'],
  muse:     ['Endocrine', 'Digestive', 'Trans-Disciplinary Synthesis'],
  looper:   ['Nervous', 'Cardiovascular', 'Counterfactual Paradigm Shifts'],
  synth:    ['Respiratory', 'Skeletal', 'Ethical Singularity Scenario Planning'],
  critic:   ['Immune', 'Nervous', 'Recursive Self-Debugging'],
};

const SYSTEM_ANCHORS = {
  Skeletal:       'Provide rigid structure and foundational constraints. Organize everything around a clear skeleton of principles.',
  Nervous:        'Prioritize communication, coordination, and rapid signal transmission. Connect ideas and ensure information flows cleanly.',
  Immune:         'Filter aggressively. Detect inconsistencies, logical errors, and threats to integrity. Protect the output from weakness.',
  Muscular:       'Drive toward concrete action and execution. Every insight must translate into something moveable and forceful.',
  Endocrine:      'Calibrate tone, mood, and behavioral register precisely. Regulate the emotional and stylistic temperature of the output.',
  Digestive:      'Break complex inputs down into their essential nutrients. Transform and absorb. Synthesize toward the most usable form.',
  Cardiovascular: 'Keep energy and momentum flowing throughout. Distribute resources evenly. Sustain rhythm across the entire output.',
  Respiratory:    'Maintain balance and coherence. Breathe life into the work — ensure it has cadence, vitality, and living quality.',
};

export const NODE_ROLES = {
  cortex:   { label: 'Cortex',   title: 'Master Planner',         icon: '◈', color: '#5b8cff', tier: 'heavy', brief: 'Decompose the goal, map dependencies, set the execution sequence.' },
  looper:   { label: 'Looper',   title: 'Variant Generator',      icon: '⟲', color: '#2dd4a7', tier: 'fast',  brief: 'Produce multiple distinct approaches and explore the solution space laterally.' },
  muse:     { label: 'Muse',     title: 'Creative Catalyst',      icon: '✦', color: '#b57bff', tier: 'fast',  brief: 'Inject narrative depth, metaphor, emotional texture and imaginative language.' },
  sentinel: { label: 'Sentinel', title: 'Quality Guardian',       icon: '◆', color: '#ffb547', tier: 'heavy', brief: 'Evaluate rigorously, score against criteria, flag weaknesses, enforce standards.' },
  synth:    { label: 'Synth',    title: 'Integration Specialist', icon: '⬡', color: '#3fd0ff', tier: 'heavy', brief: 'Merge all upstream outputs into one cohesive, polished, final deliverable.' },
  critic:   { label: 'Critic',   title: 'Adversarial Tester',     icon: '✕', color: '#ff5c7a', tier: 'heavy', brief: 'Stress-test assumptions, surface vulnerabilities, run counterfactuals.' },
};

function traitDescriptor(trait, value) {
  const pct = Math.round(value * 100);
  if (pct >= 90) return `${trait}: DOMINANT (${pct}%) — let this trait lead everything`;
  if (pct >= 70) return `${trait}: HIGH (${pct}%) — strong presence throughout`;
  if (pct >= 50) return `${trait}: MODERATE (${pct}%) — present but balanced`;
  if (pct >= 30) return `${trait}: LOW (${pct}%) — restrained, secondary role`;
  return `${trait}: MINIMAL (${pct}%) — barely present, yield to other traits`;
}

/** Blueprint layer: the system prompt for a node. */
export function blueprintSystem(nodeType, anatomy = {}, mission = {}) {
  const role = NODE_ROLES[nodeType] || { label: nodeType, title: 'Specialized Agent', brief: '' };
  const dna = PERSONA_DNA[nodeType] || [];

  const anatomyLines = Object.entries(anatomy).map(([t, v]) => `  • ${traitDescriptor(t, v)}`).join('\n');
  const dnaLines = dna.map((s) => `  • ${s}: ${SYSTEM_ANCHORS[s] || 'Apply this lens to how you reason.'}`).join('\n');

  return `You are the ${role.label} node — ${role.title} — inside SWARMFRAME, a multi-agent system where each node owns one cognitive role and hands its output to the next.

Your role: ${role.brief}

COGNITIVE ANATOMY PROFILE
${anatomyLines || '  • balanced'}

PERSONA DNA — BIOLOGICAL SYSTEM ANCHORS
${dnaLines || '  • none'}

MISSION
Goal: ${mission.goal || '(unspecified)'}
Tone: ${mission.tone || 'neutral'}
Constraints: ${mission.constraints || 'none'}
Target output: ${mission.targetOutput || 'unspecified'}

Operate only in your role; downstream nodes handle the rest. Let your dominant traits be visible in the work. Write the deliverable directly in Markdown — no preamble about being a node.`;
}

export function plainSystem(mission = {}) {
  return `You are one agent in a multi-agent pipeline. Goal: ${mission.goal || '(unspecified)'}. Write your output directly in Markdown.`;
}

// ─── Soul layer: CODEX ──────────────────────────────────────────────

export const CODEX_LAYERS = [
  { key: 'thesisForge',           name: 'Thesis Forge',           check: 'Contains or advances a clear, defensible central claim or insight.' },
  { key: 'integrityGates',        name: 'Integrity Gates',        check: 'Logically consistent, free of internal contradictions, morally coherent.' },
  { key: 'linguisticCalibration', name: 'Linguistic Calibration', check: 'Precise and truthful language; no vague, misleading, or manipulative phrasing.' },
  { key: 'visionArchitecture',    name: 'Vision Architecture',    check: 'Serves the stated goal and does not undermine the mission.' },
  { key: 'timeProvidence',        name: 'Time & Providence',      check: 'Appropriate for the stage of work it represents.' },
  { key: 'memory',                name: 'Memory & Reproduction',  check: 'Builds coherently on the context it was given rather than ignoring it.' },
  { key: 'publication',           name: 'Publication Suite',      check: 'Clearly communicable to its intended audience.' },
  { key: 'nousInterface',         name: 'Nous Interface',         check: 'Reflects genuine depth of reasoning, not surface pattern matching.' },
];

export const CODEX_THRESHOLD = 0.65;

export const CODEX_SCHEMA = {
  type: 'object',
  properties: {
    layers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string', enum: CODEX_LAYERS.map((l) => l.key) },
          passed: { type: 'boolean' },
          reason: { type: 'string' },
        },
        required: ['key', 'passed', 'reason'],
        additionalProperties: false,
      },
    },
    directive: { type: 'string', description: 'If any layer failed: one short paragraph telling the author exactly what to fix. Empty string if all passed.' },
  },
  required: ['layers', 'directive'],
  additionalProperties: false,
};

export function codexPrompt(output, nodeType, mission) {
  const checks = CODEX_LAYERS.map((l) => `- ${l.key} (${l.name}): ${l.check}`).join('\n');
  return {
    system: 'You are the CODEX — the constitution of the SWARMFRAME system. You audit one agent output against eight layers and return a verdict per layer. Be strict but fair: fail a layer only for a concrete, nameable problem.',
    prompt: `Mission goal: ${mission.goal}
Producing node: ${nodeType}

Output to audit:
"""
${output}
"""

Layers:
${checks}

Return one entry per layer with a one-sentence reason, plus a fix directive if anything failed.`,
  };
}

export function finalizeCodex(raw) {
  const byKey = Object.fromEntries((raw?.layers || []).map((l) => [l.key, l]));
  const layers = CODEX_LAYERS.map((l) => ({
    key: l.key,
    name: l.name,
    passed: byKey[l.key]?.passed ?? true,
    reason: byKey[l.key]?.reason ?? 'not evaluated',
  }));
  const score = layers.filter((l) => l.passed).length / layers.length;
  return {
    layers,
    score,
    approved: score >= CODEX_THRESHOLD,
    violations: layers.filter((l) => !l.passed).map((l) => l.name),
    directive: raw?.directive || '',
  };
}

// ─── Mind layer: PROMETHEAN-UPE ─────────────────────────────────────

export const UPE_DIMENSIONS = [
  { key: 'structural', name: 'Structural', weight: 0.20, focus: 'organization, logical flow, appropriate structure, scoping' },
  { key: 'technical',  name: 'Technical',  weight: 0.25, focus: 'accuracy, domain correctness, no unsupported claims, constraints honored' },
  { key: 'cognitive',  name: 'Cognitive',  weight: 0.25, focus: 'depth of reasoning, trade-offs, non-obvious connections' },
  { key: 'execution',  name: 'Execution',  weight: 0.20, focus: 'actionability, specificity, directly addresses the goal' },
  { key: 'innovation', name: 'Innovation', weight: 0.10, focus: 'originality, novel framing, avoids clichés' },
];

export const UPE_THRESHOLD = 0.72;

const dimSchema = {
  type: 'object',
  properties: {
    score: { type: 'number', description: '0-10' },
    feedback: { type: 'string' },
    improvement: { type: 'string' },
  },
  required: ['score', 'feedback', 'improvement'],
  additionalProperties: false,
};

export const UPE_SCHEMA = {
  type: 'object',
  properties: {
    ...Object.fromEntries(UPE_DIMENSIONS.map((d) => [d.key, dimSchema])),
    assessment: { type: 'string' },
  },
  required: [...UPE_DIMENSIONS.map((d) => d.key), 'assessment'],
  additionalProperties: false,
};

export function upePrompt(output, nodeType, mission) {
  const dims = UPE_DIMENSIONS.map((d) => `- ${d.key} (weight ${d.weight}): ${d.focus}`).join('\n');
  return {
    system: 'You are PROMETHEAN-UPE, the Ultimate Prompt Evaluator. Score outputs 0-10 per dimension. Calibrate honestly: 5 is mediocre, 7 is solid professional work, 9+ is exceptional. Every improvement must be concrete enough to act on.',
    prompt: `Mission goal: ${mission.goal}
Target output: ${mission.targetOutput || 'unspecified'}
Producing node: ${nodeType}

Output to score:
"""
${output}
"""

Dimensions:
${dims}`,
  };
}

export function finalizeUPE(raw) {
  const dimensions = UPE_DIMENSIONS.map((d) => {
    const r = raw?.[d.key] || {};
    const score = Math.max(0, Math.min(10, Number(r.score) || 0));
    return { key: d.key, name: d.name, weight: d.weight, score, feedback: r.feedback || '', improvement: r.improvement || '' };
  });
  const composite = dimensions.reduce((s, d) => s + (d.score / 10) * d.weight, 0);
  return {
    dimensions,
    composite,
    shouldRefine: composite < UPE_THRESHOLD,
    assessment: raw?.assessment || '',
  };
}

export function refinementPrompt(original, directives) {
  return `Your previous draft is below, followed by review directives. Produce an improved, complete replacement — not a diff, not commentary about the changes.

PREVIOUS DRAFT
"""
${original}
"""

REVIEW DIRECTIVES
${directives}`;
}
