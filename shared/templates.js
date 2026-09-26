/**
 * Swarm templates. Nodes use {{signal.*}} for mission fields and
 * {{<nodeType>}} / {{<nodeId>}} for upstream outputs.
 */

const n = (id, type, x, y, prompt, anatomy, extra = {}) => ({
  id, type, position: { x, y },
  data: { prompt, anatomy, config: { model: 'auto' }, ...extra },
});
const e = (source, target) => ({ id: `${source}->${target}`, source, target });

export const TEMPLATES = [
  {
    id: 'creative-architect',
    name: 'Creative Architecture',
    blurb: 'The original five-node pipeline: plan → variants → narrative → critique → synthesis.',
    mission: {
      goal: 'Design innovative urban housing solutions',
      tone: 'Visionary',
      constraints: 'Sustainable, affordable, human-centered',
      targetOutput: 'Detailed architectural proposal',
    },
    nodes: [
      n('cortex-1', 'cortex', 0, 0,
        'Analyze the core challenge: {{signal.goal}}. Break it into 3-5 key principles, ranked by priority. Respect these constraints: {{signal.constraints}}. Output a structured analysis.',
        { logic: 0.9, creativity: 0.6, empathy: 0.7, precision: 0.8 }),
      n('looper-1', 'looper', 0, 260,
        'Using this analysis:\n{{cortex}}\n\nGenerate 3 distinct approaches that address the constraints differently. Vary scale, materials, and community integration. Label them [Approach A], [Approach B], [Approach C].',
        { logic: 0.7, creativity: 0.9, empathy: 0.6, precision: 0.6 }),
      n('muse-1', 'muse', -170, 520,
        'Transform these concepts into vivid, human-centered narratives:\n{{looper}}\n\nPaint what it is like to live there. Use metaphors that connect the work to nature, community and flourishing. Inspiring yet grounded.',
        { logic: 0.4, creativity: 1.0, empathy: 0.9, precision: 0.5 }),
      n('sentinel-1', 'sentinel', 170, 520,
        'Evaluate these approaches:\n{{looper}}\n\nCheck sustainability, cost feasibility, regulatory compliance and social impact. Score each approach 1-10 per dimension, flag concerns, and recommend a direction.',
        { logic: 1.0, creativity: 0.3, empathy: 0.7, precision: 1.0 }),
      n('synth-1', 'synth', 0, 780,
        'Synthesize the creative vision:\n{{muse}}\n\nwith the critical evaluation:\n{{sentinel}}\n\nWrite the final {{signal.targetOutput}}: concept overview, key innovations, implementation roadmap, and a compelling picture of the result. Tone: {{signal.tone}}.',
        { logic: 0.8, creativity: 0.7, empathy: 0.8, precision: 0.9 }),
    ],
    edges: [e('cortex-1', 'looper-1'), e('looper-1', 'muse-1'), e('looper-1', 'sentinel-1'), e('muse-1', 'synth-1'), e('sentinel-1', 'synth-1')],
  },
  {
    id: 'brand-narrative',
    name: 'Brand Narrative',
    blurb: 'Creative-direction swarm: positioning, voice variants, story, adversarial critique, manifesto.',
    mission: {
      goal: 'Position a freelance photographer as a full creative-direction studio',
      tone: 'Confident, cinematic, human',
      constraints: 'No jargon; under 400 words for the manifesto; must name a clear ideal client',
      targetOutput: 'Brand manifesto + positioning one-pager',
    },
    nodes: [
      n('cortex-1', 'cortex', 0, 0,
        'Map the strategic territory for: {{signal.goal}}. Identify the ideal client, the transformation promised, three competitive alternatives and the white space between them.',
        { logic: 0.9, creativity: 0.5, empathy: 0.7, precision: 0.9 }),
      n('looper-1', 'looper', -200, 260,
        'From this map:\n{{cortex}}\n\nWrite three distinct positioning statements, each with a different archetype (e.g. Auteur, Partner, Provocateur). One paragraph each.',
        { logic: 0.6, creativity: 0.9, empathy: 0.7, precision: 0.6 }),
      n('muse-1', 'muse', 200, 260,
        'From this map:\n{{cortex}}\n\nWrite the origin story and signature visual language of the studio. Sensory, specific, cinematic.',
        { logic: 0.3, creativity: 1.0, empathy: 0.9, precision: 0.5 }),
      n('critic-1', 'critic', 0, 520,
        'Stress-test these positioning options:\n{{looper}}\n\nand this story:\n{{muse}}\n\nWhere would a skeptical client not believe it? What is generic? Which option survives?',
        { logic: 0.9, creativity: 0.4, empathy: 0.5, precision: 1.0 }),
      n('synth-1', 'synth', 0, 780,
        'Write the {{signal.targetOutput}}. Use the surviving position from:\n{{critic}}\n\nand the voice from:\n{{muse}}\n\nConstraints: {{signal.constraints}}. Tone: {{signal.tone}}.',
        { logic: 0.8, creativity: 0.8, empathy: 0.8, precision: 0.9 }),
    ],
    edges: [e('cortex-1', 'looper-1'), e('cortex-1', 'muse-1'), e('looper-1', 'critic-1'), e('muse-1', 'critic-1'), e('critic-1', 'synth-1'), e('muse-1', 'synth-1')],
  },
  {
    id: 'mvp-strategy',
    name: 'MVP Strategy',
    blurb: 'Product swarm: scope an MVP, generate feature cuts, evaluate, and ship a build plan.',
    mission: {
      goal: 'Define the MVP for an AI-powered note-taking Chrome extension',
      tone: 'Direct, pragmatic',
      constraints: 'Solo builder, 6-week timeline, must work offline-first',
      targetOutput: 'MVP spec with 6-week build plan and launch checklist',
    },
    nodes: [
      n('cortex-1', 'cortex', 0, 0,
        'Decompose {{signal.goal}} into user jobs-to-be-done, core loop, and the riskiest assumptions. Constraints: {{signal.constraints}}.',
        { logic: 1.0, creativity: 0.5, empathy: 0.7, precision: 0.9 }),
      n('looper-1', 'looper', 0, 260,
        'Given:\n{{cortex}}\n\nPropose three MVP cuts: Thin (1 feature), Core (3 features), Bold (one differentiated bet). List exactly what is in and out of each.',
        { logic: 0.7, creativity: 0.8, empathy: 0.6, precision: 0.7 }),
      n('sentinel-1', 'sentinel', 0, 520,
        'Score each cut on feasibility within {{signal.constraints}}, user value, and differentiation (1-10). Pick one and justify it:\n{{looper}}',
        { logic: 1.0, creativity: 0.3, empathy: 0.6, precision: 1.0 }),
      n('synth-1', 'synth', 0, 780,
        'Write the {{signal.targetOutput}} for the chosen cut:\n{{sentinel}}\n\nWeek-by-week plan, architecture sketch, success metrics, launch checklist.',
        { logic: 0.9, creativity: 0.5, empathy: 0.6, precision: 1.0 }),
    ],
    edges: [e('cortex-1', 'looper-1'), e('looper-1', 'sentinel-1'), e('sentinel-1', 'synth-1')],
  },
];

export const DEFAULT_ANATOMY = {
  cortex:   { logic: 0.9, creativity: 0.5, empathy: 0.6, precision: 0.9 },
  looper:   { logic: 0.6, creativity: 0.9, empathy: 0.6, precision: 0.6 },
  muse:     { logic: 0.4, creativity: 1.0, empathy: 0.9, precision: 0.5 },
  sentinel: { logic: 1.0, creativity: 0.3, empathy: 0.6, precision: 1.0 },
  synth:    { logic: 0.8, creativity: 0.7, empathy: 0.7, precision: 0.9 },
  critic:   { logic: 0.9, creativity: 0.4, empathy: 0.4, precision: 1.0 },
};

export const DEFAULT_PROMPT = {
  cortex: 'Decompose {{signal.goal}} into its key components and dependencies.',
  looper: 'Generate three distinct variants of the upstream work.',
  muse: 'Give the upstream work narrative depth, metaphor and emotional texture.',
  sentinel: 'Evaluate the upstream work against {{signal.constraints}}. Score and flag weaknesses.',
  synth: 'Merge all upstream work into the final {{signal.targetOutput}}.',
  critic: 'Stress-test the upstream work: counterfactuals, edge cases, weak assumptions.',
};
